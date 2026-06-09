'use client';
import { useState, useCallback } from 'react';

interface Props {
  initialCode: string;
  language?: string;
}

const JAVA_TEMPLATE = `public class Main {
    public static void main(String[] args) {
        // Your code here
        System.out.println("Hello, World!");
    }
}`;

const STREAMS_TEMPLATE = `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = Arrays.asList(1, 2, 3, 4, 5);
        int sum = nums.stream().filter(n -> n % 2 == 0).mapToInt(Integer::intValue).sum();
        System.out.println("Sum of evens: " + sum);
    }
}`;

const COLLECTIONS_TEMPLATE = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> map = new HashMap<>();
        map.put("Alice", 90);
        map.put("Bob", 85);
        map.entrySet().stream()
           .sorted(Map.Entry.<String,Integer>comparingByValue().reversed())
           .forEach(e -> System.out.println(e.getKey() + ": " + e.getValue()));
    }
}`;

const PISTON_RUNTIMES: Record<string, { language: string; version: string }> = {
  java: { language: 'java', version: '15.0.2' },
  python: { language: 'python', version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  js: { language: 'javascript', version: '18.15.0' },
};

export default function CodePlayground({ initialCode, language = 'java' }: Props) {
  const [code, setCode] = useState(initialCode || JAVA_TEMPLATE);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [showPlayground, setShowPlayground] = useState(false);
  const [copied, setCopied] = useState(false);

  const runtime = PISTON_RUNTIMES[language.toLowerCase()] ?? PISTON_RUNTIMES.java;

  const hasMainMethod = (src: string) => /public\s+static\s+void\s+main/.test(src);
  const hasSpringAnnotations = (src: string) =>
    /@(Service|Component|Autowired|SpringBootApplication|Bean|Repository|Controller|RestController)/.test(src);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);

  const run = async () => {
    if (language === 'java' && hasSpringAnnotations(code) && !hasMainMethod(code)) {
      setOutput('');
      setError(
        'This code uses Spring annotations (@Service, @Autowired, etc.) which require a Spring context to run.\n\n' +
        'It is conceptual code showing the pattern — not directly executable.\n\n' +
        'Use a Template below to try runnable Java instead.'
      );
      return;
    }
    if (language === 'java' && !hasMainMethod(code)) {
      setOutput('');
      setError(
        'No main method found. Java needs:\n\n' +
        '  public static void main(String[] args) { ... }\n\n' +
        'Click a Template below to get started with runnable code.'
      );
      return;
    }
    setRunning(true);
    setOutput('');
    setError('');
    try {
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [{ name: `Main.${language === 'java' ? 'java' : 'py'}`, content: code }],
          stdin: '',
        }),
      });
      const data = await res.json();
      const stdout: string = data.run?.stdout ?? '';
      const stderr: string = data.run?.stderr ?? '';
      const compileErr: string = data.compile?.stderr ?? '';
      if (compileErr) setError(compileErr);
      else if (stderr) setError(stderr);
      else setOutput(stdout || '(program exited with no output)');
    } catch {
      setError('Network error — check your connection. The code runner uses the Piston API.');
    } finally {
      setRunning(false);
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="my-4 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="text-xs text-gray-400 ml-2 font-mono">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyCode}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
          >
            {copied ? '\u2713 Copied' : '\u2398 Copy'}
          </button>
          <button
            onClick={() => setShowPlayground((s) => !s)}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
          >
            {showPlayground ? '\u25b2 Collapse' : '\u25b6 Edit & Run'}
          </button>
          {showPlayground && (
            <button
              onClick={run}
              disabled={running}
              className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-3 py-1 rounded-lg transition-colors font-medium"
            >
              {running ? <span className="animate-spin">&#8987;</span> : <span>&#9654;</span>}
              {running ? 'Running\u2026' : 'Run'}
            </button>
          )}
        </div>
      </div>

      {/* Static code view */}
      {!showPlayground && (
        <pre className="bg-gray-950 p-4 overflow-x-auto text-sm leading-relaxed font-mono text-gray-200">
          <code>{code}</code>
        </pre>
      )}

      {/* Editable playground */}
      {showPlayground && (
        <>
          <div className="relative bg-gray-950">
            <div className="flex">
              <div className="select-none text-right pr-3 pt-4 pb-4 pl-3 text-gray-600 text-xs font-mono leading-6 border-r border-gray-800 min-w-[3rem]">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-transparent text-gray-200 font-mono text-sm leading-6 p-4 outline-none resize-none w-full"
                style={{ minHeight: `${Math.max(8, lineCount) * 1.5}rem` }}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          </div>

          {/* Output panel */}
          {(output || error) && (
            <div className={`border-t ${error ? 'border-red-800 bg-red-950/30' : 'border-gray-700 bg-gray-900/50'} p-4`}>
              <div className={`text-xs font-semibold mb-1 ${error ? 'text-red-400' : 'text-green-400'}`}>
                {error ? '\u2717 Error / Info' : '\u2713 Output'}
              </div>
              <pre className={`text-sm font-mono whitespace-pre-wrap ${error ? 'text-red-300' : 'text-gray-300'}`}>
                {error || output}
              </pre>
            </div>
          )}

          {/* Templates */}
          {language === 'java' && (
            <div className="flex gap-2 px-4 py-2 border-t border-gray-800 bg-gray-900/30 flex-wrap">
              <span className="text-xs text-gray-500">Templates:</span>
              <button onClick={() => setCode(JAVA_TEMPLATE)} className="text-xs text-gray-400 hover:text-white underline">Hello World</button>
              <button onClick={() => setCode(STREAMS_TEMPLATE)} className="text-xs text-gray-400 hover:text-white underline">Streams</button>
              <button onClick={() => setCode(COLLECTIONS_TEMPLATE)} className="text-xs text-gray-400 hover:text-white underline">Collections</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
