import { useState } from "react";
import {
  getDiff,
  whitespaceSeparators,
  type Replace,
} from "@emergence-engineering/fast-diff-merge";
import { InstallCommand } from "../components/InstallCommand";

const EXAMPLE_ORIGINAL = `The quick brown fox jumps over the lazy dog.
She sells sea shells by the sea shore.
Pack my box with five dozen liquor jugs.`;

const EXAMPLE_MODIFIED = `The quick red fox leaps over the lazy dog.
She sells sea shells on the sea shore.
Pack my box with five dozen liquor jugs!`;

const SOURCE_URL =
  "https://github.com/emergence-engineering/ee-prosemirror-tools/blob/main/playground/fe/src/demos/FastDiffMergeDemo.tsx";

function ReplaceItem({ r }: { r: Replace }) {
  const identity = r.original === r.replacement;
  return (
    <div className={`diff-replace-item ${identity ? "diff-identity" : "diff-change"}`}>
      <div className="diff-replace-positions">
        [{r.from}, {r.to})
      </div>
      {identity ? (
        <div className="diff-replace-text">
          <span className="diff-label">text:</span>{" "}
          <code>{JSON.stringify(r.original)}</code>
        </div>
      ) : (
        <>
          <div className="diff-replace-text">
            <span className="diff-label">original:</span>{" "}
            <code className="diff-del">{JSON.stringify(r.original)}</code>
          </div>
          <div className="diff-replace-text">
            <span className="diff-label">replacement:</span>{" "}
            <code className="diff-ins">{JSON.stringify(r.replacement)}</code>
          </div>
        </>
      )}
    </div>
  );
}

export function FastDiffMergeDemo() {
  const [original, setOriginal] = useState(EXAMPLE_ORIGINAL);
  const [modified, setModified] = useState(EXAMPLE_MODIFIED);
  const [useWhitespaceSeparators, setUseWhitespaceSeparators] = useState(false);

  const options = useWhitespaceSeparators
    ? { separators: whitespaceSeparators }
    : undefined;

  const result: Replace[] = getDiff(original, modified, options);
  const changes = result.filter((r) => r.original !== r.replacement);

  return (
    <div>
      <div className="demo-header">
        <h1 className="demo-title">fast-diff-merge</h1>
        <p className="demo-description">
          Computes word-level diffs between two strings. Returns a{" "}
          <code>Replace[]</code> array describing changes with positions,
          originals, and replacements — useful for building track-changes UIs.
        </p>
        <InstallCommand packageName="@emergence-engineering/fast-diff-merge" />
        <a
          className="source-link"
          href={SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          View source on GitHub
        </a>
      </div>

      <div className="demo-usage">
        <h3 className="demo-usage-title">How to use this demo</h3>
        <ul className="demo-usage-list">
          <li>
            <strong>Edit</strong> the Original or Modified text to see diffs
            update in real time.
          </li>
          <li>
            <strong>Toggle whitespace separators</strong> to use the full
            Unicode whitespace set instead of the default space separator.
          </li>
          <li>
            Changes are shown in{" "}
            <strong style={{ color: "var(--color-accent)" }}>blue</strong>;
            identity (unchanged) spans are dimmed.
          </li>
        </ul>
      </div>

      <div className="diff-options">
        <label className="diff-option-label">
          <input
            type="checkbox"
            checked={useWhitespaceSeparators}
            onChange={(e) => setUseWhitespaceSeparators(e.target.checked)}
          />
          Use <code>whitespaceSeparators</code> (full Unicode set)
        </label>
      </div>

      <div className="output-grid">
        <div className="output-panel">
          <div className="output-panel-header">
            <span className="output-panel-label">Original</span>
          </div>
          <div className="output-panel-body">
            <textarea
              className="diff-textarea"
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              rows={6}
            />
          </div>
        </div>

        <div className="output-panel">
          <div className="output-panel-header">
            <span className="output-panel-label">Modified</span>
          </div>
          <div className="output-panel-body">
            <textarea
              className="diff-textarea"
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              rows={6}
            />
          </div>
        </div>
      </div>

      <div className="output-panel" style={{ marginTop: "1rem" }}>
        <div className="output-panel-header">
          <span className="output-panel-label">
            getDiff() Result
          </span>
          <span className="output-panel-hint">
            {result.length} spans, {changes.length} change{changes.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="output-panel-body">
          <div className="diff-results">
            {result.map((r, i) => (
              <ReplaceItem key={i} r={r} />
            ))}
            {result.length === 0 && (
              <div className="diff-empty">No differences found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
