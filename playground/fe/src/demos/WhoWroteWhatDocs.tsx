import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-who-wrote-what";

const SETUP_SCHEMA = `import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";

// The plugin works with any ProseMirror schema — no schema changes required.
// Just use your existing schema as-is.
const schema = basicSchema;`;

const SETUP_PLUGIN = `import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { ySyncPlugin, yUndoPlugin } from "y-prosemirror";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import {
  createWhoWroteWhatPlugin,
  setWhoWroteWhatVisibility,
} from "@emergence-engineering/prosemirror-who-wrote-what";

// 1. Set up Yjs document and Hocuspocus provider
const ydoc = new Y.Doc();
const provider = new HocuspocusProvider({
  url: "ws://localhost:4000/hocuspocus",
  name: "my-document",
  document: ydoc,
});
const yXmlFragment = ydoc.getXmlFragment("default");

// 2. Create the editor with the plugin
const view = new EditorView(document.getElementById("editor")!, {
  state: EditorState.create({
    schema,
    plugins: [
      ySyncPlugin(yXmlFragment),
      yUndoPlugin(),
      createWhoWroteWhatPlugin({ userId: "current-user-id" }),
    ],
  }),
});

// 3. Toggle authorship highlights on/off
setWhoWroteWhatVisibility(view, false); // hide
setWhoWroteWhatVisibility(view, true);  // show`;

const CONFIG_COLORS = `import { createWhoWroteWhatPlugin } from "@emergence-engineering/prosemirror-who-wrote-what";

createWhoWroteWhatPlugin({
  userId: "alice",
  // Custom color palette — the plugin cycles through these
  colors: [
    "#bbdefb", // blue
    "#f8bbd0", // pink
    "#c8e6c9", // green
    "#ffe0b2", // orange
  ],
});`;

const CONFIG_DEBOUNCE = `createWhoWroteWhatPlugin({
  userId: "alice",
  // Adaptive debounce: delay = lastComputeMs * debounceFactor
  // Higher values = less CPU usage, more delay before decorations update
  // Set to 0 to disable debounce entirely (not recommended for large docs)
  debounceFactor: 2.0, // default: 1.5
});`;

const CONFIG_CUSTOM_DECORATION = `import { Decoration } from "prosemirror-view";

createWhoWroteWhatPlugin({
  userId: "alice",
  createDecoration: (from, to, color, userId) =>
    Decoration.inline(from, to, {
      class: \`author-highlight author-\${userId}\`,
      style: \`border-bottom: 2px solid \${color}\`,
    }),
});`;

const BACKEND_SETUP = `import { Hocuspocus } from "@hocuspocus/server";

const server = new Hocuspocus({
  port: 4000,
});

server.listen();`;

const PEER_PACKAGE_NAMES = [
  "prosemirror-state",
  "prosemirror-view",
  "yjs",
  "y-prosemirror",
];

export function WhoWroteWhatDocs() {
  return (
    <DevDocsLayout
      title="Who Wrote What — Dev Docs"
      packageNames={["@emergence-engineering/prosemirror-who-wrote-what"]}
      demoKey="whoWroteWhat"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Peer Dependencies</h4>
        <p className="docs-text">
          Install the required peer dependencies:
        </p>
        <InstallCommand packageNames={PEER_PACKAGE_NAMES} />

        <h4 className="docs-subtitle">Schema</h4>
        <p className="docs-text">
          No schema modifications required. The plugin works with any
          ProseMirror schema by adding inline decorations on top of existing
          content.
        </p>
        <CodeBlock code={SETUP_SCHEMA} />

        <h4 className="docs-subtitle">Plugin Registration</h4>
        <p className="docs-text">
          Add the plugin <em>after</em> <code>ySyncPlugin</code> in your plugins
          array. The plugin observes Yjs changes and creates colored inline
          decorations for each author.
        </p>
        <CodeBlock code={SETUP_PLUGIN} />
      </DocsSection>

      <DocsSection title="Configuration Tips">
        <h4 className="docs-subtitle">Custom Colors</h4>
        <p className="docs-text">
          The plugin ships with 16 built-in pastel colors. You can override them
          with your own palette. Colors are assigned to authors sequentially and
          cycle when exhausted.
        </p>
        <CodeBlock code={CONFIG_COLORS} />

        <h4 className="docs-subtitle">Debounce Tuning</h4>
        <p className="docs-text">
          For large documents, the adaptive debounce prevents excessive
          recomputation. The delay scales with how long the last computation
          took: <code>delay = lastComputeMs * debounceFactor</code>.
        </p>
        <CodeBlock code={CONFIG_DEBOUNCE} />

        <h4 className="docs-subtitle">Custom Decorations</h4>
        <p className="docs-text">
          Override the default background-color decorations with your own
          factory for full control over how authorship is displayed.
        </p>
        <CodeBlock code={CONFIG_CUSTOM_DECORATION} />
      </DocsSection>

      <DocsSection title="Backend Requirements">
        <p className="docs-text">
          This plugin requires a <strong>Yjs collaboration backend</strong> to
          sync documents between clients. The recommended setup
          is{" "}
          <a
            href="https://tiptap.dev/hocuspocus/introduction"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hocuspocus
          </a>
          , but any Yjs provider (y-websocket, y-webrtc, etc.) works.
        </p>

        <h4 className="docs-subtitle">Minimal Hocuspocus Server</h4>
        <CodeBlock code={BACKEND_SETUP} />

        <p className="docs-text">
          The plugin stores a <code>userMap</code> in the Yjs document (as a
          shared YMap) to map Yjs client IDs to your application's user IDs.
          This map is automatically maintained — no server-side configuration
          needed.
        </p>
      </DocsSection>

      <DocsSection title="Compatibility">
        <div className="docs-compat-grid">
          <div className="docs-compat-item">
            <strong>Yjs</strong>
            <span>Required — the plugin reads Yjs item metadata to determine authorship</span>
          </div>
          <div className="docs-compat-item">
            <strong>ProseMirror</strong>
            <span>prosemirror-state ^1.4, prosemirror-view ^1.30</span>
          </div>
          <div className="docs-compat-item">
            <strong>Browsers</strong>
            <span>All modern browsers (Chrome, Firefox, Safari, Edge)</span>
          </div>
          <div className="docs-compat-item">
            <strong>TipTap</strong>
            <span>
              Compatible — register as a ProseMirror plugin via TipTap's{" "}
              <code>addProseMirrorPlugins()</code>
            </span>
          </div>
        </div>
      </DocsSection>
    </DevDocsLayout>
  );
}
