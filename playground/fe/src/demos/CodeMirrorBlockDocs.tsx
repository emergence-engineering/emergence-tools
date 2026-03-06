import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-codemirror-block";

const SETUP_SCHEMA = `import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { CodeBlockNodeName } from "prosemirror-codemirror-block";

// Add a "lang" attribute to the code_block node so the plugin
// can store the selected language.
const codeBlockSpec = basicSchema.spec.nodes.get(CodeBlockNodeName);

export const schema = new Schema({
  nodes: basicSchema.spec.nodes.update(CodeBlockNodeName, {
    ...(codeBlockSpec || {}),
    attrs: { ...codeBlockSpec?.attrs, lang: { default: null } },
  }),
  marks: basicSchema.spec.marks,
});`;

const SETUP_PLUGIN = `import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import { keymap } from "prosemirror-keymap";
import { undo, redo } from "prosemirror-history";
import {
  codeMirrorBlockPlugin,
  defaultSettings,
  languageLoaders,
  legacyLanguageLoaders,
  codeBlockKeymap,
} from "prosemirror-codemirror-block";

const state = EditorState.create({
  schema,
  plugins: [
    ...exampleSetup({ schema }),
    codeMirrorBlockPlugin({
      ...defaultSettings,
      languageLoaders: { ...languageLoaders, ...legacyLanguageLoaders },
      undo,
      redo,
    }),
    keymap(codeBlockKeymap),
  ],
});

const view = new EditorView(document.getElementById("editor")!, { state });`;

const CONFIG_LANGUAGE_LOADERS = `// Built-in language loaders use dynamic import() for lazy loading.
// You can also create your own loaders:
import { LanguageLoaders } from "prosemirror-codemirror-block";

const customLoaders: LanguageLoaders = {
  // Each key is the language name shown in the selector
  typescript: () =>
    import("@codemirror/lang-javascript").then(
      (m) => m.javascript({ typescript: true })
    ),
};`;

const CONFIG_THEMES = `import { gruvboxDark } from "cm6-theme-gruvbox-dark";
import { basicLight } from "cm6-theme-basic-light";
import { updateTheme } from "prosemirror-codemirror-block";

// 1. Define available themes
const themes = [
  { extension: gruvboxDark, name: "Dark" },
  { extension: basicLight, name: "Light" },
];

// 2. Pass themes to the plugin
codeMirrorBlockPlugin({
  ...defaultSettings,
  languageLoaders,
  undo,
  redo,
  themes,
  getCurrentTheme: () =>
    document.body.classList.contains("dark") ? "Dark" : "Light",
});

// 3. Switch themes at runtime
updateTheme("Dark");`;

const CONFIG_LEGACY = `import {
  legacyLanguageLoaders,
  languageLoaders,
} from "prosemirror-codemirror-block";

// Merge CM6-native and legacy (CM5) language modes
codeMirrorBlockPlugin({
  ...defaultSettings,
  languageLoaders: { ...languageLoaders, ...legacyLanguageLoaders },
  undo,
  redo,
});`;

const CONFIG_SELECT = `// Override createSelect / updateSelect for a fully custom
// language selector (e.g. a React portal or headless listbox).
codeMirrorBlockPlugin({
  ...defaultSettings,
  languageLoaders,
  undo,
  redo,
  createSelect: (settings, dom, node, view, getPos) => {
    // Build your own DOM select here, append to \`dom\`
    // Return a cleanup function
    return () => {};
  },
  updateSelect: (settings, dom, node, view, getPos, oldNode) => {
    // Update your selector when the node changes
  },
});`;

const YJS_COMPAT = `// When using Yjs for collaboration, pass yUndo / yRedo
// instead of prosemirror-history undo / redo:
import { undo as yUndo, redo as yRedo } from "y-prosemirror";

codeMirrorBlockPlugin({
  ...defaultSettings,
  languageLoaders,
  undo: yUndo,
  redo: yRedo,
});`;

const PEER_PACKAGE_NAMES = [
  "@codemirror/state",
  "prosemirror-commands",
  "prosemirror-model",
  "prosemirror-state",
  "prosemirror-view",
];

export function CodeMirrorBlockDocs() {
  return (
    <DevDocsLayout
      title="CodeMirror Block — Dev Docs"
      packageNames={["prosemirror-codemirror-block"]}
      demoKey="codeMirrorBlock"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Peer Dependencies</h4>
        <p className="docs-text">Install the required peer dependencies:</p>
        <InstallCommand packageNames={PEER_PACKAGE_NAMES} />

        <h4 className="docs-subtitle">Schema</h4>
        <p className="docs-text">
          Add a <code>lang</code> attribute to your <code>code_block</code> node
          so the plugin can persist the selected language.
        </p>
        <CodeBlock code={SETUP_SCHEMA} />

        <h4 className="docs-subtitle">Plugin Registration</h4>
        <p className="docs-text">
          Register the plugin, the CodeMirror node view, and the keyboard
          shortcuts. The <code>codeBlockKeymap</code> handles arrow-key escape
          and the <code>Cmd/Ctrl+Alt+C</code> toggle shortcut.
        </p>
        <CodeBlock code={SETUP_PLUGIN} />
      </DocsSection>

      <DocsSection title="Configuration Tips">
        <h4 className="docs-subtitle">Language Loaders</h4>
        <p className="docs-text">
          Language support is lazy-loaded via dynamic <code>import()</code>. The
          package ships two loader maps: <code>languageLoaders</code> (CM6
          native) and <code>legacyLanguageLoaders</code> (CM5 modes via{" "}
          <code>@codemirror/legacy-modes</code>). You can also write your own.
        </p>
        <CodeBlock code={CONFIG_LANGUAGE_LOADERS} />

        <h4 className="docs-subtitle">Theme Switching</h4>
        <p className="docs-text">
          Pass an array of <code>themes</code> and a{" "}
          <code>getCurrentTheme</code> callback. Call <code>updateTheme</code> at
          runtime to switch all code blocks at once.
        </p>
        <CodeBlock code={CONFIG_THEMES} />

        <h4 className="docs-subtitle">Legacy CodeMirror 5 Modes</h4>
        <p className="docs-text">
          For languages not yet ported to CM6, merge the legacy loader map with
          the native one. This gives you 100+ language modes.
        </p>
        <CodeBlock code={CONFIG_LEGACY} />

        <h4 className="docs-subtitle">Custom Language Selector</h4>
        <p className="docs-text">
          Override <code>createSelect</code> and <code>updateSelect</code> to
          render a fully custom language picker (e.g. a React portal or a
          headless listbox).
        </p>
        <CodeBlock code={CONFIG_SELECT} />
      </DocsSection>

      <DocsSection title="Compatibility">
        <div className="docs-compat-grid">
          <div className="docs-compat-item">
            <strong>Yjs / Collaboration</strong>
            <span>
              Compatible — pass <code>yUndo</code> / <code>yRedo</code> from{" "}
              <code>y-prosemirror</code> instead of prosemirror-history's undo/redo
            </span>
          </div>
          <div className="docs-compat-item">
            <strong>ProseMirror</strong>
            <span>prosemirror-state ^1.4, prosemirror-view ^1.29</span>
          </div>
          <div className="docs-compat-item">
            <strong>CodeMirror</strong>
            <span>@codemirror/state ^6.1, @codemirror/view ^6.7</span>
          </div>
          <div className="docs-compat-item">
            <strong>TipTap</strong>
            <span>
              Compatible — register via TipTap's{" "}
              <code>addProseMirrorPlugins()</code>
            </span>
          </div>
        </div>
        <h4 className="docs-subtitle">Yjs Undo Integration</h4>
        <p className="docs-text">
          When using Yjs collaboration, the undo/redo must come from{" "}
          <code>y-prosemirror</code> rather than <code>prosemirror-history</code>
          . This ensures undo operations inside CodeMirror blocks are routed
          through the Yjs undo manager.
        </p>
        <CodeBlock code={YJS_COMPAT} />
      </DocsSection>
    </DevDocsLayout>
  );
}
