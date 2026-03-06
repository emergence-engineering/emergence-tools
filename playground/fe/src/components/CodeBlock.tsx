import { useCallback, useEffect, useRef, useState } from "react";
import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  lang?: "typescript" | "bash" | "css" | "json";
}

export function CodeBlock({ code, lang = "typescript" }: CodeBlockProps) {
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let cancelled = false;
    codeToHtml(code.trim(), {
      lang,
      theme: "github-light",
    }).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="code-block">
      <button
        type="button"
        className="code-block-copy"
        onClick={handleCopy}
        title="Copy to clipboard"
      >
        {copied ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="code-block-fallback">
          <code>{code.trim()}</code>
        </pre>
      )}
    </div>
  );
}
