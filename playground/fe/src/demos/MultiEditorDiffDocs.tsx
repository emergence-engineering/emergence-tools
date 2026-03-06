import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-multi-editor-diff";

const SETUP_PLUGIN = `import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  createMultiEditorDiffVisuPlugin,
  multiEditorDiffStateHolder,
} from "@emergence-engineering/prosemirror-multi-editor-diff";

// 1. Add the visualization plugin to both editors
const leftState = EditorState.create({
  doc: leftDoc,
  plugins: [...yourPlugins, createMultiEditorDiffVisuPlugin()],
});
const rightState = EditorState.create({
  doc: rightDoc,
  plugins: [...yourPlugins, createMultiEditorDiffVisuPlugin()],
});

const leftView = new EditorView(leftEl, { state: leftState });
const rightView = new EditorView(rightEl, { state: rightState });`;

const SETUP_STATE_HOLDER = `// 2. Create a state holder — it orchestrates diffing between the two editors
const stateHolder = multiEditorDiffStateHolder();

// 3. Register both editors with a unique id + version
stateHolder.addEditor(
  { uuid: "doc-left", versionId: 1 },
  leftView,
  leftScrollRef,   // React ref or { current: HTMLDivElement | null }
);
stateHolder.addEditor(
  { uuid: "doc-right", versionId: 1 },
  rightView,
  rightScrollRef,
);

// 4. Select which editor is "left" and which is "right"
stateHolder.selectEditor("left", { uuid: "doc-left", versionId: 1 });
stateHolder.selectEditor("right", { uuid: "doc-right", versionId: 1 });`;

const SETUP_TOGGLE = `// 5. Toggle diff visualization on and off
stateHolder.switchShowDiff(true);   // show inline diff decorations + spacers
stateHolder.switchShowDiff(false);  // remove all decorations`;

const SETUP_SCROLL_SYNC = `// 6. Wire up scroll synchronization (optional)
leftScrollRef.current?.addEventListener("scroll", (e) => {
  const target = e.target as HTMLDivElement;
  stateHolder.scrollChanged(target.scrollTop, { uuid: "doc-left", versionId: 1 });
});`;

const CONFIG_NODE_TYPES = `import {
  createMultiEditorDiffVisuPlugin,
  multiEditorDiffStateHolder,
} from "@emergence-engineering/prosemirror-multi-editor-diff";

// Both the plugin and the state holder accept the same config
const config = {
  diffableNodeTypes: new Set(["heading", "paragraph", "listItem"]),
};

const plugin = createMultiEditorDiffVisuPlugin(config);
const stateHolder = multiEditorDiffStateHolder(config);`;

const CONFIG_SIMILARITY = `import {
  stringNodePairing,
  defaultStringSimilarity,
} from "@emergence-engineering/prosemirror-multi-editor-diff";

// The pairing algorithm uses string-similarity-js by default.
// You can supply your own similarity function via the config's
// textExtractionOptions or by calling stringNodePairing directly:
const pairings = stringNodePairing({
  bodyExtractor: (node) => node.textContent,
  leftSideNodes: leftNodes,
  rightSideNodes: rightNodes,
  similarity: {
    fromString: (a, b) => myCustomSimilarity(a, b),
  },
  insertDeleteWeight: 0, // default: -1
});`;

const CONFIG_COLLAPSIBLE = `const config = {
  // Sync collapsible header toggle events between editors
  onToggleCollapsible: (view, pos, enableEscalation) => {
    // dispatch toggle on the paired node in the other editor
  },
  collapsibleHeadersPluginKey: myCollapsiblePluginKey,
};`;

const CSS_STYLES = `.highlight-addition {
  background-color: rgba(0, 200, 0, 0.25);
}

.highlight-deletion {
  background-color: rgba(255, 0, 0, 0.2);
}

.multi-editor-diff.empty-rect {
  width: 100%;
}

.multi-editor-diff.non-matching-node-type,
.multi-editor-diff.non-matching-node-level,
.multi-editor-diff.non-matching-node-parent-length,
.multi-editor-diff.non-matching-node-parent-type {
  display: inline-block;
  background: #ff9800;
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  margin-right: 4px;
}`;

const PEER_PACKAGE_NAMES = [
  "prosemirror-model",
  "prosemirror-state",
  "prosemirror-transform",
  "prosemirror-view",
];

export function MultiEditorDiffDocs() {
  return (
    <DevDocsLayout
      title="Multi-Editor Diff — Dev Docs"
      packageNames={["@emergence-engineering/prosemirror-multi-editor-diff"]}
      demoKey="multiEditorDiff"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Peer Dependencies</h4>
        <p className="docs-text">
          Install the required peer dependencies:
        </p>
        <InstallCommand packageNames={PEER_PACKAGE_NAMES} />

        <h4 className="docs-subtitle">Create Two Editor Views</h4>
        <p className="docs-text">
          Add <code>createMultiEditorDiffVisuPlugin()</code> to both editors.
          The plugin handles diff decoration rendering and spacer widgets
          internally.
        </p>
        <CodeBlock code={SETUP_PLUGIN} />

        <h4 className="docs-subtitle">Create a State Holder</h4>
        <p className="docs-text">
          The state holder orchestrates the diff between the two editors. It
          manages node pairing, recalculation on edits, and helper plugin
          lifecycle.
        </p>
        <CodeBlock code={SETUP_STATE_HOLDER} />

        <h4 className="docs-subtitle">Toggle Diff</h4>
        <p className="docs-text">
          Call <code>switchShowDiff(true)</code> to compute pairings and show
          inline diff decorations with spacers, or{" "}
          <code>switchShowDiff(false)</code> to remove them.
        </p>
        <CodeBlock code={SETUP_TOGGLE} />

        <h4 className="docs-subtitle">Scroll Synchronization</h4>
        <p className="docs-text">
          Wire up scroll events so both editors stay aligned. The state holder's{" "}
          <code>scrollChanged</code> method mirrors the scroll position to the
          opposite editor.
        </p>
        <CodeBlock code={SETUP_SCROLL_SYNC} />
      </DocsSection>

      <DocsSection title="Configuration Tips">
        <h4 className="docs-subtitle">Custom Diffable Node Types</h4>
        <p className="docs-text">
          By default only <code>heading</code> and <code>paragraph</code> nodes
          are diffed. Pass a custom set to include additional node types like
          list items.
        </p>
        <CodeBlock code={CONFIG_NODE_TYPES} />

        <h4 className="docs-subtitle">String Similarity Function</h4>
        <p className="docs-text">
          The pairing algorithm uses <code>string-similarity-js</code> to match
          nodes between editors. You can supply your own similarity function for
          specialized content.
        </p>
        <CodeBlock code={CONFIG_SIMILARITY} />

        <h4 className="docs-subtitle">Collapsible Header Integration</h4>
        <p className="docs-text">
          If your editors use collapsible headers, provide{" "}
          <code>onToggleCollapsible</code> and{" "}
          <code>collapsibleHeadersPluginKey</code> so toggle events are mirrored
          between editors.
        </p>
        <CodeBlock code={CONFIG_COLLAPSIBLE} />

        <h4 className="docs-subtitle">Required CSS</h4>
        <p className="docs-text">
          Add these styles to your application. The plugin uses these CSS classes
          for inline diff highlights, spacer widgets, and node mismatch badges.
        </p>
        <CodeBlock code={CSS_STYLES} lang="css" />
      </DocsSection>
    </DevDocsLayout>
  );
}
