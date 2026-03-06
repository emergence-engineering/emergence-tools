import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/fast-diff-merge";

const SETUP_BASIC = `import { getDiff } from "@emergence-engineering/fast-diff-merge";

const original = "The quick brown fox jumps over the lazy dog.";
const modified = "The quick red fox leaps over the lazy dog.";

const diffs = getDiff(original, modified);
// Returns Replace[] — each entry describes a span:
// { from: number, to: number, original: string, replacement: string }

// Identity spans have original === replacement (unchanged text).
// Changed spans have different original and replacement values.`;

const CUSTOM_SEPARATORS = `import {
  getDiff,
  whitespaceSeparators,
} from "@emergence-engineering/fast-diff-merge";

// By default, getDiff splits on spaces only.
// Use whitespaceSeparators for full Unicode whitespace support
// (tabs, newlines, non-breaking spaces, etc.)
const diffs = getDiff(original, modified, {
  separators: whitespaceSeparators,
});`;

const MERGE_REPLACE_PAIR = `import {
  mergeReplacePair,
  isIdentity,
} from "@emergence-engineering/fast-diff-merge";

// mergeReplacePair combines two adjacent Replace entries
// into a smarter grouping based on word boundaries.
// getDiff uses this internally, but you can also use it
// to post-process your own Replace arrays.
const merged = mergeReplacePair(leftReplace, rightReplace);`;

export function FastDiffMergeDocs() {
  return (
    <DevDocsLayout
      title="Fast Diff Merge — Dev Docs"
      packageNames={["@emergence-engineering/fast-diff-merge"]}
      demoKey="fastDiffMerge"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Basic Usage</h4>
        <p className="docs-text">
          Use <code>getDiff</code> to compute word-level diffs between two
          strings. It returns a <code>Replace[]</code> array where each entry
          describes a span with its position, original text, and replacement
          text. Unchanged spans have <code>original === replacement</code>.
        </p>
        <CodeBlock code={SETUP_BASIC} />
      </DocsSection>

      <DocsSection title="Configuration Tips">
        <h4 className="docs-subtitle">Custom Separators</h4>
        <p className="docs-text">
          By default, <code>getDiff</code> splits on spaces only. For documents
          with tabs, newlines, or Unicode whitespace, pass the built-in{" "}
          <code>whitespaceSeparators</code> array via the{" "}
          <code>separators</code> option.
        </p>
        <CodeBlock code={CUSTOM_SEPARATORS} />

        <h4 className="docs-subtitle">Merge Replace Pairs</h4>
        <p className="docs-text">
          The <code>mergeReplacePair</code> function combines two adjacent{" "}
          <code>Replace</code> entries into a smarter grouping based on word
          boundaries. This is used internally by <code>getDiff</code>, but you
          can also use it directly to post-process your own replace arrays.
        </p>
        <CodeBlock code={MERGE_REPLACE_PAIR} />
      </DocsSection>
    </DevDocsLayout>
  );
}
