// Pyodide types - defined inline to avoid type resolution issues at build time
interface PyodideInterface {
    runPython: (code: string) => unknown;
    loadPackage: (packages: string | string[]) => Promise<void>;
    loadPackagesFromImports: (code: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodideInstance: PyodideInterface | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadingPromise: Promise<PyodideInterface> | null = null;

export interface PythonResult {
    success: boolean;
    output: string;
    error?: string;
    images?: string[]; // Base64 encoded PNG images from matplotlib
}

/**
 * Lazily loads and returns the Pyodide instance.
 * Caches the instance so subsequent calls are fast.
 */
export async function getPyodide(): Promise<PyodideInterface> {
    if (pyodideInstance) {
        return pyodideInstance;
    }

    if (loadingPromise) {
        return loadingPromise;
    }

    loadingPromise = (async () => {
        // Dynamic import to avoid bundle issues
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pyodideModule = await import("pyodide") as any;
        const loadPyodide = pyodideModule.loadPyodide;

        pyodideInstance = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/",
        }) as PyodideInterface;

        return pyodideInstance;
    })();

    return loadingPromise;
}

/**
 * Runs Python code and returns the result.
 * Captures stdout/stderr and return value.
 */
export async function runPython(code: string): Promise<PythonResult> {
    try {
        const pyodide = await getPyodide();

        // Automatically load packages from imports
        await pyodide.loadPackagesFromImports(code);

        // Configure matplotlib to use headless Agg backend if matplotlib is being used
        if (code.includes('matplotlib') || code.includes('plt')) {
            pyodide.runPython(`
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for image capture
            `);
        }

        // Set up stdout/stderr capture
        pyodide.runPython(`
import sys
from io import StringIO

_stdout_capture = StringIO()
_stderr_capture = StringIO()
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture
    `);

        let result;
        try {
            // Patch urllib to use Pyodide's open_url for network requests (e.g., seaborn.load_dataset)
            pyodide.runPython(`
import pyodide.http
import urllib.request
from io import BytesIO

# Patch urlopen to use Pyodide's open_url which works in the browser
_original_urlopen = urllib.request.urlopen

def _patched_urlopen(url, *args, **kwargs):
    url_str = url if isinstance(url, str) else url.full_url
    try:
        response = pyodide.http.open_url(url_str)
        # Wrap the string response in a file-like object
        content = response.read() if hasattr(response, 'read') else response
        if isinstance(content, str):
            content = content.encode('utf-8')
        return BytesIO(content)
    except Exception as e:
        # Fall back to original (will likely fail but gives original error)
        return _original_urlopen(url, *args, **kwargs)

urllib.request.urlopen = _patched_urlopen
            `);

            result = pyodide.runPython(code);
        } catch (pythonError) {
            // Get captured stderr
            const stderr = pyodide.runPython("_stderr_capture.getvalue()") as string;

            // Reset streams
            pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
      `);

            return {
                success: false,
                output: stderr || String(pythonError),
                error: String(pythonError),
            };
        }

        // Get captured outputs
        const stdout = pyodide.runPython("_stdout_capture.getvalue()") as string;

        // Reset streams
        pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
    `);

        // Build output string
        let output = stdout;

        // Include return value if it's not None
        if (result !== undefined && result !== null) {
            const resultStr = String(result);
            if (resultStr !== "None" && resultStr.trim()) {
                output = output ? `${output}${resultStr}` : resultStr;
            }
        }

        // Check for matplotlib figures and capture them as base64
        const images: string[] = [];
        try {
            const hasMpl = pyodide.runPython(`
import sys
'matplotlib' in sys.modules or 'matplotlib.pyplot' in sys.modules
            `);

            if (hasMpl) {
                // Capture all open figures as base64 PNG
                const figureDataProxy = pyodide.runPython(`
import base64
from io import BytesIO
import matplotlib.pyplot as plt

# Dark theme colors
BG_COLOR = '#0a0a0b'
TEXT_COLOR = '#e4e4e7'
GRID_COLOR = '#27272a'

_figure_images = []
for fig_num in plt.get_fignums():
    fig = plt.figure(fig_num)
    
    # Apply dark theme to all axes in the figure
    for ax in fig.get_axes():
        # Set axes background
        ax.set_facecolor(BG_COLOR)
        # Set text colors
        ax.title.set_color(TEXT_COLOR)
        ax.xaxis.label.set_color(TEXT_COLOR)
        ax.yaxis.label.set_color(TEXT_COLOR)
        # Set tick colors
        ax.tick_params(colors=TEXT_COLOR, which='both')
        # Set spine colors
        for spine in ax.spines.values():
            spine.set_color(GRID_COLOR)
    
    buf = BytesIO()
    # bbox_inches='tight' expands the saved area to include ALL elements
    fig.savefig(buf, format='png', bbox_inches='tight', pad_inches=0.3, dpi=100, facecolor=BG_COLOR, edgecolor='none')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    _figure_images.append(img_base64)
    buf.close()

plt.close('all')
_figure_images
                `);

                // Convert Pyodide proxy to JS array
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const figureData = (figureDataProxy as any)?.toJs?.() || figureDataProxy;

                if (figureData && Array.isArray(figureData)) {
                    images.push(...figureData);
                } else if (figureData && typeof figureData === 'object' && figureData.length !== undefined) {
                    // Handle array-like objects
                    for (let i = 0; i < figureData.length; i++) {
                        images.push(figureData[i]);
                    }
                }
            }
        } catch (mplError) {
            console.warn('matplotlib image capture failed:', mplError);
        }

        return {
            success: true,
            output: output || (images.length > 0 ? "" : "(No output)"),
            images: images.length > 0 ? images : undefined,
        };
    } catch (error) {
        return {
            success: false,
            output: "",
            error: `Failed to initialize Python: ${error}`,
        };
    }
}

/**
 * Check if Pyodide is already loaded
 */
export function isPyodideLoaded(): boolean {
    return pyodideInstance !== null;
}

/**
 * Check if Pyodide is currently loading
 */
export function isPyodideLoading(): boolean {
    return loadingPromise !== null && pyodideInstance === null;
}
