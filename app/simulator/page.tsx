'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Play, Download, Upload, Trash2, Loader2 } from 'lucide-react';

// Declare Pyodide types
declare global {
  interface Window {
    loadPyodide: (config?: any) => Promise<any>;
  }
}

export default function CodeSimulatorPage() {
  const [code, setCode] = useState(`# Welcome to AI Code Simulator
# Preloaded libraries: numpy, pandas, scikit-learn, matplotlib, scipy

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Example: Create a simple plot
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)')
plt.xlabel('X')
plt.ylabel('Y')
plt.title('Simple Plot Example')
plt.legend()
plt.grid(True)

# Note: plt.show() doesn't work in browser, but we can display the plot data
print("Plot data generated!")
print("X values (first 5):", x[:5])
print("Y values (first 5):", y[:5])
print("Hello from AI Code Simulator!")`);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pyodideReady, setPyodideReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pyodideRef = useRef<any>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize Pyodide
  useEffect(() => {
    const initPyodide = async () => {
      try {
        setInitializing(true);
        setOutput('Initializing Pyodide... This may take a moment on first load.\n');
        
        // Load Pyodide from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        // Wait a bit for Pyodide to be available
        await new Promise(resolve => setTimeout(resolve, 100));

        if (window.loadPyodide) {
          pyodideRef.current = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
          });

          // Install micropip for package management
          await pyodideRef.current.loadPackage('micropip');
          
          // Install common packages
          setOutput('Loading scientific libraries...\n');
          await pyodideRef.current.loadPackage([
            'numpy',
            'pandas',
            'matplotlib',
            'scipy',
            'scikit-learn',
          ]);

          // Set up stdout capture
          pyodideRef.current.setStdout({
            batched: (text: string) => {
              setOutput((prev) => prev + text);
            },
          });

          setPyodideReady(true);
          setInitializing(false);
          setOutput('✅ Pyodide initialized successfully!\n✅ Libraries loaded: numpy, pandas, matplotlib, scipy, scikit-learn\n\nReady to run Python code!');
        } else {
          throw new Error('Pyodide failed to load');
        }
      } catch (err: any) {
        setError(`Failed to initialize Pyodide: ${err.message}`);
        setInitializing(false);
      }
    };

    initPyodide();
  }, []);

  const executeCode = async () => {
    if (!pyodideRef.current || !pyodideReady) {
      setError('Pyodide is not ready yet. Please wait for initialization.');
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');

    try {
      // Capture stdout
      let capturedOutput = '';
      pyodideRef.current.setStdout({
        batched: (text: string) => {
          capturedOutput += text;
          setOutput(capturedOutput);
        },
      });

      // Set up stderr
      pyodideRef.current.setStderr({
        batched: (text: string) => {
          setError((prev) => prev + text);
        },
      });

      // Execute the code
      await pyodideRef.current.runPython(code);
      
      // Check if we got any output
      if (!capturedOutput) {
        setOutput('Code executed successfully. No output generated.');
      }
    } catch (err: any) {
      const errorMsg = err.toString();
      setError(errorMsg);
      // Keep output if it exists (might have partial output before error)
    } finally {
      setLoading(false);
    }
  };

  const clearCode = () => {
    setCode('');
    setOutput('');
    setError('');
  };

  const clearOutput = () => {
    setOutput('');
    setError('');
  };

  const loadExample = (example: string) => {
    const examples: Record<string, string> = {
      ml: `# Machine Learning Example
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Generate sample data
X, y = make_classification(n_samples=1000, n_features=4, n_informative=2, n_redundant=0, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"Model Accuracy: {accuracy:.2f}")`,
      dl: `# Deep Learning Example using scikit-learn
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np

# Generate sample data
X, y = make_classification(n_samples=1000, n_features=20, n_informative=15, 
                          n_redundant=5, n_classes=2, random_state=42)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create a multi-layer perceptron (neural network)
# Hidden layers: 128 -> 64 -> 32 neurons
model = MLPClassifier(hidden_layer_sizes=(128, 64, 32), 
                      activation='relu', 
                      solver='adam',
                      max_iter=100,
                      random_state=42,
                      verbose=True)

# Train the model
print("Training neural network...")
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\nModel Accuracy: {accuracy:.4f}")
print("Model training completed!")`,
      data: `# Data Analysis Example
import pandas as pd
import numpy as np

# Create sample DataFrame
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'Age': [25, 30, 35, 28],
    'Score': [85, 90, 88, 92]
}

df = pd.DataFrame(data)
print("DataFrame:")
print(df)
print(f"\nAverage Score: {df['Score'].mean():.2f}")`,
      genai: `# GenAI Example - Using OpenAI-style API calls
# Note: For real API calls, you'll need to handle API keys securely
# This example shows the pattern

import json

# Example: Simple text processing that could be used with GenAI
def process_text(text):
    # Simulate text processing
    words = text.split()
    word_count = len(words)
    char_count = len(text)
    return {
        'word_count': word_count,
        'char_count': char_count,
        'words': words[:5]  # First 5 words
    }

text = "This is a sample text for GenAI processing"
result = process_text(text)
print("Text Processing Result:")
print(json.dumps(result, indent=2))

# For real GenAI API calls, you would use:
# import requests
# response = requests.post('https://api.openai.com/v1/chat/completions', ...)
# But API keys need to be handled securely (backend proxy recommended)`,
    };
    setCode(examples[example] || '');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2">AI Code Simulator</h1>
          <p className="text-textSecondary">
            Write and execute Python code with preloaded ML libraries
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl overflow-hidden"
          >
            <div className="bg-card/50 p-4 flex items-center justify-between border-b border-card">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text">Python Editor</span>
                {mounted && (
                  <>
                    {initializing ? (
                      <span className="text-xs text-textSecondary flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Initializing Pyodide...
                      </span>
                    ) : pyodideReady ? (
                      <span className="text-xs text-green-400">✅ Ready</span>
                    ) : (
                      <span className="text-xs text-textSecondary">Preloaded: numpy, pandas, scikit-learn, matplotlib, scipy</span>
                    )}
                  </>
                )}
                {!mounted && (
                  <span className="text-xs text-textSecondary">Loading...</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadExample('ml')}
                  className="px-3 py-1 text-xs bg-card hover:bg-card/80 rounded transition-all"
                >
                  ML Example
                </button>
                <button
                  onClick={() => loadExample('dl')}
                  className="px-3 py-1 text-xs bg-card hover:bg-card/80 rounded transition-all"
                >
                  DL Example
                </button>
                <button
                  onClick={() => loadExample('data')}
                  className="px-3 py-1 text-xs bg-card hover:bg-card/80 rounded transition-all"
                >
                  Data Example
                </button>
                <button
                  onClick={() => loadExample('genai')}
                  className="px-3 py-1 text-xs bg-card hover:bg-card/80 rounded transition-all"
                >
                  GenAI Example
                </button>
                <button
                  onClick={clearCode}
                  className="p-2 hover:bg-card/80 rounded transition-all"
                  aria-label="Clear code"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-[500px] p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Write your Python code here..."
              spellCheck={false}
              style={{ 
                color: '#ffffff', 
                backgroundColor: 'rgba(26, 35, 50, 0.95)',
                caretColor: '#ff6b35',
                border: 'none',
                outline: 'none'
              }}
            />
            <div className="bg-card/50 p-4 border-t border-card">
              <button
                onClick={executeCode}
                disabled={loading || !code.trim() || !pyodideReady || initializing || !mounted}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Code
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl overflow-hidden"
          >
            <div className="bg-card/50 p-4 border-b border-card flex items-center justify-between">
              <span className="text-sm font-medium text-text">Console Output</span>
              {(output || error) && (
                <button
                  onClick={clearOutput}
                  className="px-3 py-1 text-xs bg-card hover:bg-card/80 rounded transition-all text-textSecondary hover:text-text"
                  aria-label="Clear output"
                >
                  Clear Output
                </button>
              )}
            </div>
            <div className="p-4 h-[500px] overflow-auto" style={{ backgroundColor: 'rgba(10, 17, 40, 0.9)' }}>
              {error ? (
                <>
                  <pre className="text-red-400 font-mono text-sm whitespace-pre-wrap mb-2 break-words">
                    {error}
                  </pre>
                  {output && (
                    <pre className="text-textSecondary font-mono text-sm whitespace-pre-wrap mt-2 border-t border-card pt-2 break-words">
                      {output}
                    </pre>
                  )}
                </>
              ) : output ? (
                <pre className="text-textSecondary font-mono text-sm whitespace-pre-wrap break-words" style={{ color: '#a0aec0' }}>
                  {output}
                </pre>
              ) : (
                <p className="text-textSecondary text-sm" style={{ color: '#a0aec0' }}>
                  Output will appear here after code execution...
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Library Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-6 rounded-xl"
        >
          <h2 className="text-xl font-bold text-text mb-4">Available Libraries</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['numpy', 'pandas', 'scikit-learn', 'matplotlib', 'scipy', 'json', 'requests'].map(
              (lib) => (
                <div
                  key={lib}
                  className="px-4 py-2 bg-card/50 rounded-lg text-center text-sm font-medium text-text"
                >
                  {lib}
                </div>
              )
            )}
          </div>
          <div className="mt-4 p-4 bg-card/30 rounded-lg">
            <p className="text-sm text-textSecondary">
              <strong className="text-text">Note:</strong> TensorFlow and PyTorch are not available in Pyodide due to size constraints.
              For Deep Learning, use scikit-learn's neural network modules or consider using a backend service.
              For GenAI API calls, handle API keys securely through a backend proxy.
            </p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

