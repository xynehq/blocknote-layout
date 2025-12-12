/**
 * Code Execution Runner
 * 
 * Manages execution of code via Judge0 or custom execution handlers.
 */

// Judge0 Language IDs
export const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
    python: 71,      // Python 3.8.1
    javascript: 63,  // JavaScript (Node.js 12.14.0)
    typescript: 74,  // TypeScript 3.7.4
    c: 50,           // C (GCC 9.2.0)
    cpp: 54,         // C++ (GCC 9.2.0)
    java: 62,        // Java (OpenJDK 13.0.1)
    rust: 73,        // Rust 1.40.0
    go: 60,          // Go 1.13.5
    ruby: 72,        // Ruby 2.7.0
    php: 68,         // PHP 7.4.1
    kotlin: 78,      // Kotlin 1.3.70
    swift: 83,       // Swift 5.2.3
    csharp: 51,      // C# (Mono 6.6.0.161)
    scala: 81,       // Scala 2.13.2
    haskell: 61,     // Haskell (GHC 8.8.1)
    lua: 64,         // Lua 5.3.5
    perl: 85,        // Perl 5.28.1
    r: 80,           // R 4.0.0 
    bash: 46,        // Bash 5.0.0
};

export interface RunnerResult {
    success: boolean;
    output: string;
    error?: string;
    executionTime?: number;
    memoryUsed?: number;
}

export type ExecuteCodeFn = (code: string, language: string, stdin?: string) => Promise<RunnerResult>;

export interface CodeRunnerConfig {
    /**
     * The API URL for Judge0. 
     * Defaults to 'https://ce.judge0.com' (public cloud).
     */
    judge0ApiUrl?: string;

    /**
     * Optional API key. Adds 'X-Auth-Token' header.
     *
     */
    judge0ApiKey?: string;

    /**
     * Custom headers to include in every request.
     * Use this for authentication (e.g., { 'Authorization': 'Bearer ...' })
     */
    headers?: Record<string, string>;

    /**
     * Custom execution handler.
     * If provided, this will be called instead of the default Judge0 implementation.
     * Use this if you want to proxy requests through your own backend.
     */
    executeCode?: ExecuteCodeFn;
}

// Default configuration
let config: CodeRunnerConfig = {
    judge0ApiUrl: 'https://ce.judge0.com',
};

/**
 * Configure the CodeRunner
 */
export function setCodeRunnerConfig(newConfig: CodeRunnerConfig): void {
    config = { ...config, ...newConfig };

    // Normalize URL
    if (config.judge0ApiUrl) {
        config.judge0ApiUrl = config.judge0ApiUrl.replace(/\/$/, '');
    }
}

/**
 * Get current configuration (read-only)
 */
export function getCodeRunnerConfig(): Readonly<CodeRunnerConfig> {
    return config;
}

/**
 * Execute code using the configured runner
 */
export async function executeCode(
    code: string,
    language: string,
    stdin?: string
): Promise<RunnerResult> {
    // 1. Use custom execution handler if provided
    if (config.executeCode) {
        return config.executeCode(code, language, stdin);
    }

    // 2. Fallback to default Judge0 implementation
    return runWithJudge0(code, language, stdin);
}

// Internal Judge0 implementation
async function runWithJudge0(
    code: string,
    language: string,
    stdin?: string
): Promise<RunnerResult> {
    const languageId = JUDGE0_LANGUAGE_IDS[language];
    const apiUrl = config.judge0ApiUrl || 'https://ce.judge0.com';

    if (!languageId) {
        return {
            success: false,
            output: '',
            error: `Unsupported language: ${language}`,
        };
    }

    try {
        interface Judge0Submission {
            source_code: string;
            language_id: number;
            stdin?: string;
        }

        const submission: Judge0Submission = {
            source_code: btoa(unescape(encodeURIComponent(code))),
            language_id: languageId,
            stdin: stdin ? btoa(unescape(encodeURIComponent(stdin))) : undefined,
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(config.headers || {}),
        };

        if (config.judge0ApiKey) {
            headers['X-Auth-Token'] = config.judge0ApiKey;
        }

        const submitResponse = await fetch(`${apiUrl}/submissions?base64_encoded=true&wait=false`, {
            method: 'POST',
            headers,
            body: JSON.stringify(submission),
        });

        if (!submitResponse.ok) {
            const errorText = await submitResponse.text();
            return {
                success: false,
                output: '',
                error: `Failed to submit code: ${submitResponse.status} ${errorText}`,
            };
        }

        const { token } = await submitResponse.json();
        return await pollForResult(token, apiUrl, headers);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
            return {
                success: false,
                output: '',
                error: `Cannot connect to Judge0 at ${apiUrl}.\nError: ${errorMessage}`,
            };
        }

        return {
            success: false,
            output: '',
            error: `Execution error: ${errorMessage}`,
        };
    }
}

async function pollForResult(token: string, apiUrl: string, headers: Record<string, string>, maxAttempts = 30): Promise<RunnerResult> {
    let attempts = 0;
    let delay = 100;

    while (attempts < maxAttempts) {
        attempts++;

        const response = await fetch(
            `${apiUrl}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,compile_output,message,status,time,memory`,
            { method: 'GET', headers }
        );

        if (!response.ok) {
            throw new Error(`Failed to get result: ${response.status}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await response.json();

        if (result.status.id <= 2) { // In Queue or Processing
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.5, 1000);
            continue;
        }

        const stdout = result.stdout ? decodeBase64(result.stdout) : '';
        const stderr = result.stderr ? decodeBase64(result.stderr) : '';
        const compileOutput = result.compile_output ? decodeBase64(result.compile_output) : '';
        const message = result.message ? decodeBase64(result.message) : '';

        // Success (Accepted)
        if (result.status.id === 3) {
            return {
                success: true,
                output: stdout || '(No output)',
                executionTime: result.time ? parseFloat(result.time) * 1000 : undefined,
                memoryUsed: result.memory,
            };
        }

        // Compilation Error
        if (result.status.id === 6) {
            return {
                success: false,
                output: '',
                error: `Compilation Error:\n${compileOutput}`,
            };
        }

        // Runtime/Internal Error
        let errorOutput = stderr || compileOutput || message || result.status.description;
        if (stdout) {
            errorOutput = `Output:\n${stdout}\n\nError:\n${errorOutput}`;
        }

        return {
            success: false,
            output: stdout,
            error: errorOutput,
            executionTime: result.time ? parseFloat(result.time) * 1000 : undefined,
            memoryUsed: result.memory,
        };
    }

    return {
        success: false,
        output: '',
        error: 'Execution timed out',
    };
}

function decodeBase64(str: string): string {
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch {
        return str;
    }
}

/**
 * Check availability
 */
export async function isRunnerAvailable(): Promise<boolean> {
    if (config.executeCode) return true;

    try {
        const apiUrl = config.judge0ApiUrl || 'https://ce.judge0.com';
        const response = await fetch(`${apiUrl}/about`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch {
        return false;
    }
}
