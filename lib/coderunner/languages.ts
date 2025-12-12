/**
 * Language Configuration for CodeRunner
 * 
 * Centralizes all language metadata, CodeMirror extensions, and default templates.
 */

import { Extension } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { php } from '@codemirror/lang-php';

export type SupportedLanguage =
    | 'python'
    | 'javascript'
    | 'typescript'
    | 'c'
    | 'cpp'
    | 'java'
    | 'rust'
    | 'go'
    | 'ruby'
    | 'php'
    | 'kotlin'
    | 'swift'
    | 'csharp'
    | 'haskell'
    | 'bash';

export interface LanguageConfig {
    name: string;
    displayName: string;
    extension: string;
    getCodeMirrorExtension: () => Extension;
    defaultCode: string;
}

// Language configurations
export const LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
    python: {
        name: 'python',
        displayName: 'Python',
        extension: '.py',
        getCodeMirrorExtension: () => python(),
        defaultCode: `# Python - runs via Judge0
print("Hello, World!")

# Try some calculations
result = sum(range(1, 11))
print(f"Sum of 1-10: {result}")`,
    },

    javascript: {
        name: 'javascript',
        displayName: 'JavaScript',
        extension: '.js',
        getCodeMirrorExtension: () => javascript(),
        defaultCode: `// JavaScript - runs via Judge0 (Node.js)
console.log("Hello, World!");

// Try some calculations
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(\`Sum of 1-10: \${sum}\`);`,
    },

    typescript: {
        name: 'typescript',
        displayName: 'TypeScript',
        extension: '.ts',
        getCodeMirrorExtension: () => javascript({ typescript: true }),
        defaultCode: `// TypeScript - runs via Judge0
const greeting: string = "Hello, World!";
console.log(greeting);

const numbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const sum: number = numbers.reduce((a, b) => a + b, 0);
console.log(\`Sum of 1-10: \${sum}\`);`,
    },

    c: {
        name: 'c',
        displayName: 'C',
        extension: '.c',
        getCodeMirrorExtension: () => cpp(),
        defaultCode: `// C - runs via Judge0
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        sum += i;
    }
    printf("Sum of 1-10: %d\\n", sum);
    
    return 0;
}`,
    },

    cpp: {
        name: 'cpp',
        displayName: 'C++',
        extension: '.cpp',
        getCodeMirrorExtension: () => cpp(),
        defaultCode: `// C++ - runs via Judge0
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    std::cout << "Hello, World!" << std::endl;
    
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    std::cout << "Sum of 1-10: " << sum << std::endl;
    
    return 0;
}`,
    },

    java: {
        name: 'java',
        displayName: 'Java',
        extension: '.java',
        getCodeMirrorExtension: () => java(),
        defaultCode: `// Java - runs via Judge0
import java.util.stream.IntStream;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        int sum = IntStream.rangeClosed(1, 10).sum();
        System.out.println("Sum of 1-10: " + sum);
    }
}`,
    },

    rust: {
        name: 'rust',
        displayName: 'Rust',
        extension: '.rs',
        getCodeMirrorExtension: () => rust(),
        defaultCode: `// Rust - runs via Judge0
fn main() {
    println!("Hello, World!");
    
    let sum: i32 = (1..=10).sum();
    println!("Sum of 1-10: {}", sum);
}`,
    },

    go: {
        name: 'go',
        displayName: 'Go',
        extension: '.go',
        getCodeMirrorExtension: () => go(),
        defaultCode: `// Go - runs via Judge0
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    
    sum := 0
    for i := 1; i <= 10; i++ {
        sum += i
    }
    fmt.Printf("Sum of 1-10: %d\\n", sum)
}`,
    },

    ruby: {
        name: 'ruby',
        displayName: 'Ruby',
        extension: '.rb',
        // Ruby uses similar syntax highlighting to Python
        getCodeMirrorExtension: () => python(),
        defaultCode: `# Ruby - runs via Judge0
puts "Hello, World!"

sum = (1..10).sum
puts "Sum of 1-10: #{sum}"`,
    },

    php: {
        name: 'php',
        displayName: 'PHP',
        extension: '.php',
        getCodeMirrorExtension: () => php(),
        defaultCode: `<?php
// PHP - runs via Judge0
echo "Hello, World!\\n";

$sum = array_sum(range(1, 10));
echo "Sum of 1-10: $sum\\n";
?>`,
    },

    kotlin: {
        name: 'kotlin',
        displayName: 'Kotlin',
        extension: '.kt',
        getCodeMirrorExtension: () => java(), // Kotlin uses similar syntax to Java
        defaultCode: `// Kotlin - runs via Judge0
fun main() {
    println("Hello, World!")
    
    val sum = (1..10).sum()
    println("Sum of 1-10: $sum")
}`,
    },

    swift: {
        name: 'swift',
        displayName: 'Swift',
        extension: '.swift',
        getCodeMirrorExtension: () => cpp(), // Swift uses similar syntax to C-family
        defaultCode: `// Swift - runs via Judge0
print("Hello, World!")

let sum = (1...10).reduce(0, +)
print("Sum of 1-10: \\(sum)")`,
    },

    csharp: {
        name: 'csharp',
        displayName: 'C#',
        extension: '.cs',
        getCodeMirrorExtension: () => java(), // C# uses similar syntax to Java
        defaultCode: `// C# - runs via Judge0
using System;
using System.Linq;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        
        int sum = Enumerable.Range(1, 10).Sum();
        Console.WriteLine($"Sum of 1-10: {sum}");
    }
}`,
    },

    haskell: {
        name: 'haskell',
        displayName: 'Haskell',
        extension: '.hs',
        getCodeMirrorExtension: () => python(), // Use Python as fallback for highlighting
        defaultCode: `-- Haskell - runs via Judge0
main :: IO ()
main = do
    putStrLn "Hello, World!"
    putStrLn $ "Sum of 1-10: " ++ show (sum [1..10])`,
    },

    bash: {
        name: 'bash',
        displayName: 'Bash',
        extension: '.sh',
        getCodeMirrorExtension: () => python(), // Use Python as fallback
        defaultCode: `#!/bin/bash
# Bash - runs via Judge0
echo "Hello, World!"

sum=0
for i in {1..10}; do
    sum=$((sum + i))
done
echo "Sum of 1-10: $sum"`,
    },
};

/**
 * Get the list of all supported languages for the dropdown
 */
export function getSupportedLanguages(): Array<{ value: SupportedLanguage; label: string }> {
    return Object.entries(LANGUAGES).map(([key, config]) => ({
        value: key as SupportedLanguage,
        label: config.displayName,
    }));
}

/**
 * Get language configuration by name
 */
export function getLanguageConfig(language: SupportedLanguage): LanguageConfig {
    return LANGUAGES[language] || LANGUAGES.python;
}

/**
 * Get CodeMirror extension for a language
 */
export function getCodeMirrorExtension(language: SupportedLanguage): Extension {
    const config = LANGUAGES[language];
    return config ? config.getCodeMirrorExtension() : python();
}

/**
 * Get default code template for a language
 */
export function getDefaultCode(language: SupportedLanguage): string {
    const config = LANGUAGES[language];
    return config ? config.defaultCode : LANGUAGES.python.defaultCode;
}
