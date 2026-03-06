import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-link-preview";

const PEER_PACKAGE_NAMES = [
  "prosemirror-model",
  "prosemirror-state",
  "prosemirror-view",
  "prosemirror-commands",
];

const SETUP_SCHEMA = `import { Schema } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addPreviewNode } from "prosemirror-link-preview";

// addPreviewNode injects a "preview" node type into your schema spec
const mySchema = new Schema({
  nodes: addPreviewNode(schema.spec.nodes),
  marks: schema.spec.marks,
});`;

const SETUP_PLUGIN_PLAIN = `import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import {
  previewPlugin,
  apply,
  createDecorations,
  findPlaceholder,
} from "prosemirror-link-preview";

// Import the default styles
import "prosemirror-link-preview/dist/styles/styles.css";

const view = new EditorView(document.getElementById("editor")!, {
  state: EditorState.create({
    schema: mySchema,
    plugins: [
      ...exampleSetup({ schema: mySchema }),
      previewPlugin(
        fetchLinkPreview,  // your fetch callback (see Backend section)
        apply,
        createDecorations,
        findPlaceholder,
        undefined,         // customYSyncPluginKey (not needed without Yjs)
        { openLinkOnClick: true },
      ),
    ],
  }),
});`;

const SETUP_PLUGIN_YJS = `import { ySyncPlugin, yUndoPlugin } from "y-prosemirror";
import {
  previewPlugin,
  applyYjs,
  createDecorationsYjs,
  findPlaceholderYjs,
} from "prosemirror-link-preview";

// For Yjs collaboration, swap in the Yjs-aware helpers
const view = new EditorView(element, {
  state: EditorState.create({
    schema: mySchema,
    plugins: [
      ...exampleSetup({ schema: mySchema }),
      ySyncPlugin(yXmlFragment),
      yUndoPlugin(),
      previewPlugin(
        fetchLinkPreview,
        applyYjs,
        createDecorationsYjs,
        findPlaceholderYjs,
        undefined,
        { openLinkOnClick: true, pasteLink: true },
      ),
    ],
  }),
});`;

const BACKEND_FETCH = `// The plugin does NOT fetch previews itself — you provide the callback.
// Example using a backend endpoint:
async function fetchLinkPreview(link: string) {
  const res = await fetch("/api/link-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ link }),
  });
  const { data } = await res.json();
  return {
    url: data.url,
    title: data.title,
    description: data.description,
    images: data.images, // string[]
  };
}`;

const BACKEND_SERVER = `// Example backend using link-preview-js (Node / Next.js API route)
import { getLinkPreview } from "link-preview-js";

export default async function handler(req, res) {
  const { link } = JSON.parse(req.body);
  const data = await getLinkPreview(link);
  res.json({ data });
}`;

export function LinkPreviewDocs() {
  return (
    <DevDocsLayout
      title="Link Preview — Dev Docs"
      packageNames={["prosemirror-link-preview"]}
      demoKey="linkPreview"
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
          Use <code>addPreviewNode</code> to inject a <code>preview</code> node
          type into your schema. This node stores the title, description, image
          URL, and link URL as attributes.
        </p>
        <CodeBlock code={SETUP_SCHEMA} />

        <h4 className="docs-subtitle">Plugin Registration (Plain ProseMirror)</h4>
        <p className="docs-text">
          For a standard ProseMirror setup (no Yjs), use the plain{" "}
          <code>apply</code>, <code>createDecorations</code>, and{" "}
          <code>findPlaceholder</code> helpers. Don't forget to import the CSS.
        </p>
        <CodeBlock code={SETUP_PLUGIN_PLAIN} />

        <h4 className="docs-subtitle">Plugin Registration (Yjs Collaboration)</h4>
        <p className="docs-text">
          When using Yjs, swap in the Yjs-aware variants:{" "}
          <code>applyYjs</code>, <code>createDecorationsYjs</code>, and{" "}
          <code>findPlaceholderYjs</code>. This ensures placeholders survive
          Yjs document replacements.
        </p>
        <CodeBlock code={SETUP_PLUGIN_YJS} />
      </DocsSection>

      <DocsSection title="Configuration Tips">
        <h4 className="docs-subtitle">Options</h4>
        <p className="docs-text">
          The last argument to <code>previewPlugin</code> is an options object:
        </p>
        <ul className="docs-text" style={{ paddingLeft: "1.5rem" }}>
          <li>
            <code>openLinkOnClick</code> (boolean) — when <code>true</code>,
            clicking the preview card opens the original URL in a new tab.
          </li>
          <li>
            <code>pasteLink</code> (boolean) — when <code>true</code>,
            pasting a URL automatically triggers a preview fetch. Defaults to{" "}
            <code>false</code>.
          </li>
        </ul>

        <h4 className="docs-subtitle">Custom Styles</h4>
        <p className="docs-text">
          The default card structure is:
        </p>
        <CodeBlock
          code={`<div class="preview-root">
  <div class="preview-image" />
  <div class="preview-title" />
  <div class="preview-description" />
</div>`}
          lang="bash"
        />
        <p className="docs-text">
          Import the bundled CSS or write your own rules targeting these class
          names.
        </p>
      </DocsSection>

      <DocsSection title="Backend Requirements">
        <p className="docs-text">
          The plugin does <strong>not</strong> fetch link metadata itself. You
          must provide a <code>fetchLinkPreview</code> callback that returns a
          promise resolving to{" "}
          <code>{"{ url, title, description, images }"}</code>.
        </p>
        <p className="docs-text">
          <strong>Why a backend?</strong> Browsers enforce{" "}
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
            target="_blank"
            rel="noopener noreferrer"
          >
            CORS (Cross-Origin Resource Sharing)
          </a>{" "}
          restrictions that prevent client-side JavaScript from fetching HTML
          from arbitrary domains. Most websites do not set permissive CORS
          headers, so a direct <code>fetch()</code> from the browser will fail.
          A server-side endpoint can fetch the target page without CORS
          restrictions, scrape the Open Graph / meta tags, and return the
          structured preview data to your frontend.
        </p>
        <CodeBlock code={BACKEND_FETCH} />

        <h4 className="docs-subtitle">Server-Side Example</h4>
        <p className="docs-text">
          A minimal backend using{" "}
          <a
            href="https://www.npmjs.com/package/link-preview-js"
            target="_blank"
            rel="noopener noreferrer"
          >
            link-preview-js
          </a>:
        </p>
        <CodeBlock code={BACKEND_SERVER} />
      </DocsSection>

      <DocsSection title="Compatibility">
        <div className="docs-compat-grid">
          <div className="docs-compat-item">
            <strong>Yjs</strong>
            <span>
              Optional — use the Yjs-aware helpers (<code>applyYjs</code>,{" "}
              <code>createDecorationsYjs</code>, <code>findPlaceholderYjs</code>)
              for collaborative editing
            </span>
          </div>
          <div className="docs-compat-item">
            <strong>ProseMirror</strong>
            <span>prosemirror-state ^1.3, prosemirror-view ^1.15</span>
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
