export interface JavaScriptResult {
    success: boolean;
    output: string;
    error?: string;
}

/**
 * Runs JavaScript code in a sandboxed environment.
 * Captures console output and return value.
 */
export async function runJavaScript(code: string): Promise<JavaScriptResult> {
    const logs: string[] = [];

    // Create a sandboxed console that captures output
    const sandboxedConsole = {
        log: (...args: unknown[]) => {
            logs.push(args.map(formatValue).join(' '));
        },
        error: (...args: unknown[]) => {
            logs.push('[Error] ' + args.map(formatValue).join(' '));
        },
        warn: (...args: unknown[]) => {
            logs.push('[Warn] ' + args.map(formatValue).join(' '));
        },
        info: (...args: unknown[]) => {
            logs.push('[Info] ' + args.map(formatValue).join(' '));
        },
        debug: (...args: unknown[]) => {
            logs.push('[Debug] ' + args.map(formatValue).join(' '));
        },
        table: (data: unknown) => {
            logs.push(formatValue(data));
        },
        clear: () => {
            logs.length = 0;
        },
        time: () => { },
        timeEnd: () => { },
        timeLog: () => { },
        assert: (condition: boolean, ...args: unknown[]) => {
            if (!condition) {
                logs.push('[Assertion Failed] ' + args.map(formatValue).join(' '));
            }
        },
        count: () => { },
        countReset: () => { },
        group: () => { },
        groupCollapsed: () => { },
        groupEnd: () => { },
        dir: (obj: unknown) => {
            logs.push(formatValue(obj));
        },
        dirxml: (obj: unknown) => {
            logs.push(formatValue(obj));
        },
        trace: () => {
            logs.push('[Trace] ' + new Error().stack);
        },
    };

    try {
        // Create a function that runs the code with our sandboxed console
        // Using Function constructor to create an isolated scope
        const wrappedCode = `
            "use strict";
            return (async function(console) {
                ${code}
            })(arguments[0]);
        `;

        const fn = new Function(wrappedCode);
        const result = await fn(sandboxedConsole);

        let output = logs.join('\n');

        // Append the return value if it's meaningful
        if (result !== undefined && result !== null) {
            const resultStr = formatValue(result);
            if (resultStr && resultStr !== 'undefined') {
                output = output ? `${output}\n${resultStr}` : resultStr;
            }
        }

        return {
            success: true,
            output: output || '(No output)',
        };
    } catch (error) {
        const errorMessage = error instanceof Error
            ? `${error.name}: ${error.message}`
            : String(error);

        return {
            success: false,
            output: logs.length > 0 ? logs.join('\n') + '\n' + errorMessage : '',
            error: errorMessage,
        };
    }
}

/**
 * Format a value for display in console output
 */
function formatValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'bigint') return `${value}n`;

    if (value instanceof Error) {
        return `${value.name}: ${value.message}`;
    }

    if (Array.isArray(value)) {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return '[Array]';
        }
    }

    if (typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return '[Object]';
        }
    }

    return String(value);
}
