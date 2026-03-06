import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-image-plugin";

const PEER_PACKAGE_NAMES = [
  "prosemirror-model",
  "prosemirror-state",
  "prosemirror-view",
  "prosemirror-commands",
  "prosemirror-transform",
];

const SETUP_SCHEMA = `import { Schema } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import {
  defaultSettings,
  updateImageNode,
  imagePlugin,
} from "prosemirror-image-plugin";

// Import styles
import "prosemirror-image-plugin/dist/styles/common.css";
import "prosemirror-image-plugin/dist/styles/withResize.css";
import "prosemirror-image-plugin/dist/styles/sideResize.css";

// Customise settings (or use defaultSettings as-is)
const imageSettings = { ...defaultSettings };

// updateImageNode injects an enhanced "image" node into your schema
const imageSchema = new Schema({
  nodes: updateImageNode(schema.spec.nodes, imageSettings),
  marks: schema.spec.marks,
});`;

const SETUP_PLUGIN = `import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";

const state = EditorState.create({
  doc: imageSchema.nodeFromJSON(initialDoc),
  plugins: [
    ...exampleSetup({ schema: imageSchema }),
    imagePlugin(imageSettings),
  ],
});

const view = new EditorView(
  document.getElementById("editor")!,
  { state },
);`;

const CONFIG_UPLOAD = `// Custom upload function — default returns a data URI
const imageSettings = {
  ...defaultSettings,
  uploadFile: async (file: File) => {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const { url } = await res.json();
    return url; // returned URL becomes the image src
  },
  deleteSrc: async (src: string) => {
    await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ src }),
    });
  },
};`;

const CONFIG_RESIZE = `const imageSettings = {
  ...defaultSettings,
  enableResize: true,   // default: true
  scaleImage: true,     // scale proportionally with editor width
  imageMargin: 50,      // px margin on each side
  minSize: 50,          // minimum image width in px
  maxSize: 2000,        // maximum image width in px
};`;

const CONFIG_OVERLAY = `const imageSettings = {
  ...defaultSettings,
  createOverlay: (node, getPos, view) => {
    const div = document.createElement("div");
    div.className = "my-custom-overlay";
    // Add alignment buttons, captions, etc.
    return div;
  },
  updateOverlay: (overlayRoot, getPos, view, node) => {
    // Called when the image node changes — update overlay DOM here
  },
};`;

const CONFIG_ALIGNMENT = `import { imageAlign } from "prosemirror-image-plugin";

// The image node stores alignment as an attribute.
// Possible values: imageAlign.left, .right, .center, .fullWidth
// You can read / update it via the overlay or custom commands.`;

const PROGRAMMATIC_UPLOAD = `import {
  startImageUpload,
  startImageUploadFn,
} from "prosemirror-image-plugin";

// Option A: from a File object
startImageUpload(view, file, file.name, imageSettings, imageSchema, pos);

// Option B: from an async function (useful for URL-based uploads)
await startImageUploadFn(view, async () => {
  const src = await uploadFromUrl(url);
  return { url: src, alt: "description" };
});`;

const CONFIG_DOWNLOAD = `import {
  fetchImageAsBase64,
  imageCache,
  localStorageCache,
} from "prosemirror-image-plugin";

// Simple authenticated download
const imageSettings = {
  ...defaultSettings,
  downloadImage: fetchImageAsBase64,
  downloadPlaceholder: () => ({ className: "loading-placeholder" }),
};

// With in-memory caching (survives drag & drop without re-fetching)
const cachedDownload = imageCache(new Map())(
  (url) => fetchImageAsBase64(url),
);
const settingsWithCache = {
  ...defaultSettings,
  downloadImage: cachedDownload,
};`;

export function ImagePluginDocs() {
  return (
    <DevDocsLayout
      title="Image Plugin — Dev Docs"
      packageNames={["prosemirror-image-plugin"]}
      demoKey="imagePlugin"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Peer Dependencies</h4>
        <p className="docs-text">
          Install the required peer dependencies:
        </p>
        <InstallCommand packageNames={PEER_PACKAGE_NAMES} />

        <h4 className="docs-subtitle">Schema &amp; Styles</h4>
        <p className="docs-text">
          Use <code>updateImageNode</code> to replace the default{" "}
          <code>image</code> node with an enhanced version that supports
          resizing, alignment, titles, and overlays. Import the CSS files that
          match your configuration.
        </p>
        <CodeBlock code={SETUP_SCHEMA} />

        <h4 className="docs-subtitle">Plugin Registration</h4>
        <p className="docs-text">
          Pass the same settings object to both <code>updateImageNode</code>{" "}
          and <code>imagePlugin</code> so the schema and plugin stay in sync.
        </p>
        <CodeBlock code={SETUP_PLUGIN} />
      </DocsSection>

      <DocsSection title="Configuration Tips">
        <h4 className="docs-subtitle">Resize Settings</h4>
        <p className="docs-text">
          Resize is enabled by default. Images scale proportionally with
          the editor width when <code>scaleImage</code> is <code>true</code>.
        </p>
        <CodeBlock code={CONFIG_RESIZE} />

        <h4 className="docs-subtitle">Custom Overlay</h4>
        <p className="docs-text">
          The overlay is a DOM element rendered on top of the image. Use it
          for alignment buttons, captions, or any interactive controls.
        </p>
        <CodeBlock code={CONFIG_OVERLAY} />

        <h4 className="docs-subtitle">Image Alignment</h4>
        <p className="docs-text">
          The plugin ships with four alignment modes. Alignment is stored as a
          node attribute and can be changed via the overlay or custom commands.
        </p>
        <CodeBlock code={CONFIG_ALIGNMENT} />

        <h4 className="docs-subtitle">Programmatic Upload</h4>
        <p className="docs-text">
          Use <code>startImageUpload</code> or <code>startImageUploadFn</code>{" "}
          to insert images from a file picker or URL without drag &amp; drop.
        </p>
        <CodeBlock code={PROGRAMMATIC_UPLOAD} />

        <h4 className="docs-subtitle">Custom Download &amp; Caching</h4>
        <p className="docs-text">
          For images behind authentication, provide a{" "}
          <code>downloadImage</code> callback. Use the built-in{" "}
          <code>imageCache</code> helper to avoid re-downloading after
          drag &amp; drop or state rebuilds.
        </p>
        <CodeBlock code={CONFIG_DOWNLOAD} />
      </DocsSection>

      <DocsSection title="Backend Requirements">
        <p className="docs-text">
          By default the plugin converts images to data URIs (no server
          needed). For production, provide an <code>uploadFile</code>{" "}
          callback that uploads to your server and returns the hosted URL.
          Optionally implement <code>deleteSrc</code> to clean up when images
          are removed from the document.
        </p>
        <CodeBlock code={CONFIG_UPLOAD} />
      </DocsSection>

      <DocsSection title="Compatibility">
        <div className="docs-compat-grid">
          <div className="docs-compat-item">
            <strong>Yjs</strong>
            <span>
              Works with Yjs out of the box — includes custom mapping for
              external document changes so decorations are not lost
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
