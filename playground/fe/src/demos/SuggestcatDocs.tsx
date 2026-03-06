import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-suggestcat-plugin";

const SETUP_GRAMMAR = `import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  grammarSuggestPluginV2,
  grammarSuggestV2Key,
} from "prosemirror-suggestcat-plugin";
import { ActionType } from "@emergence-engineering/prosemirror-block-runner";

const view = new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    doc: schema.nodeFromJSON(initialDoc),
    plugins: [
      grammarSuggestPluginV2("<YOUR_API_KEY>", {
        debounceMs: 1000,
        batchSize: 4,
        model: "openai:gpt-4o-mini",
      }),
      ...exampleSetup({ schema }),
    ],
  }),
});

// Initialize the grammar checker
view.dispatch(
  view.state.tr.setMeta(grammarSuggestV2Key, {
    type: ActionType.INIT,
    metadata: {},
  }),
);`;

const SETUP_COMPLETE = `import {
  completePluginV2,
  startTask,
  acceptResult,
  rejectResult,
  AiPromptsWithoutParam,
} from "prosemirror-suggestcat-plugin";

// Add to your plugins array
completePluginV2("<YOUR_API_KEY>", {
  maxSelection: 1000,
  model: "openai:gpt-4o-mini",
});

// Trigger AI actions
startTask(view, AiPromptsWithoutParam.Complete);
startTask(view, AiPromptsWithoutParam.Simplify);

// Accept or reject results
acceptResult(view);
rejectResult(view);`;

const SETUP_AUTOCOMPLETE = `import {
  autoCompletePlugin,
  setAutoCompleteEnabled,
} from "prosemirror-suggestcat-plugin";

// Add to your plugins array
autoCompletePlugin("<YOUR_API_KEY>", {
  debounceMs: 500,
  maxContextLength: 2000,
  model: "openai:gpt-4o-mini",
});

// Toggle on/off programmatically
setAutoCompleteEnabled(view, true);
setAutoCompleteEnabled(view, false);`;

const SETUP_REACT = `import { SlashMenuPlugin } from "prosemirror-slash-menu";
import {
  ProsemirrorSuggestcatPluginReact,
  GrammarPopup,
  promptCommands,
  slashOpeningCondition,
} from "prosemirror-suggestcat-plugin-react";

// 1. Add SlashMenuPlugin to your editor plugins
SlashMenuPlugin(promptCommands, undefined, slashOpeningCondition);

// 2. Render the React components alongside your editor
<ProsemirrorSuggestcatPluginReact
  editorView={editorView}
  editorState={editorState}
/>
<GrammarPopup
  editorView={editorView}
  editorState={editorState}
  apiKey="<YOUR_API_KEY>"
/>`;

const SETUP_STYLES = `// Base plugin styles (grammar decorations)
import "prosemirror-suggestcat-plugin/dist/styles/styles.css";

// React component styles (popups, overlays, slash menu)
import "prosemirror-suggestcat-plugin-react/dist/styles/styles.css";

// Ghost text for autocomplete (add your own CSS)
// .autoCompleteGhostText {
//   color: #9ca3af;
//   opacity: 0.7;
//   pointer-events: none;
// }`;

const CONFIG_MODELS = `// All plugins accept a model option
type AIModel =
  | "openai:gpt-4o"
  | "openai:gpt-4o-mini"       // default
  | "cerebras:llama-3.1-8b"
  | "cerebras:llama-3.3-70b"
  | "cerebras:qwen-3-32b";

// Grammar plugin with fallback model
grammarSuggestPluginV2("<YOUR_API_KEY>", {
  model: "cerebras:llama-3.3-70b",
  fallback: {
    fallbackModel: "openai:gpt-4o-mini",
    failureThreshold: 3, // switch after 3 failures
  },
});`;

const CONFIG_DEBOUNCE = `// Grammar: delay before re-checking edited paragraphs
grammarSuggestPluginV2("<YOUR_API_KEY>", {
  debounceMs: 1000, // default: 1000ms
  batchSize: 4,     // parallel workers, default: 2
});

// Autocomplete: delay before requesting a suggestion
autoCompletePlugin("<YOUR_API_KEY>", {
  debounceMs: 500,        // default: 500ms
  maxContextLength: 2000, // chars sent as context
});`;

const CONFIG_TIPTAP = `import { Extension } from "@tiptap/core";
import {
  grammarSuggestPluginV2,
  completePluginV2,
  autoCompletePlugin,
} from "prosemirror-suggestcat-plugin";

const SuggestCatExtension = Extension.create({
  name: "suggestcat",
  addProseMirrorPlugins() {
    return [
      grammarSuggestPluginV2("<YOUR_API_KEY>"),
      completePluginV2("<YOUR_API_KEY>"),
      autoCompletePlugin("<YOUR_API_KEY>"),
    ];
  },
});`;

const BACKEND_API_KEY = `// 1. Create an account at https://www.suggestcat.com/
// 2. Generate an API key from your dashboard
// 3. Pass the key to each plugin

grammarSuggestPluginV2("<YOUR_API_KEY>");
completePluginV2("<YOUR_API_KEY>");
autoCompletePlugin("<YOUR_API_KEY>");`;

const BACKEND_ENDPOINT = `// All plugins use the SuggestCat API by default.
// To use a custom endpoint:

grammarSuggestPluginV2("<YOUR_API_KEY>", {
  apiEndpoint: "https://your-proxy.example.com/grammar",
});

completePluginV2("<YOUR_API_KEY>", {
  apiEndpoint: "https://your-proxy.example.com/complete",
});

autoCompletePlugin("<YOUR_API_KEY>", {
  apiEndpoint: "https://your-proxy.example.com/autocomplete",
});`;

const PEER_PACKAGE_NAMES = [
  "prosemirror-model",
  "prosemirror-state",
  "prosemirror-transform",
  "prosemirror-view",
];

const REACT_PEER_PACKAGE_NAMES = [
  "prosemirror-slash-menu",
  "prosemirror-slash-menu-react",
  "prosemirror-suggestcat-plugin",
  "react",
  "react-dom",
];

export function SuggestcatDocs() {
  return (
    <DevDocsLayout
      title="Suggestcat — Dev Docs"
      packageNames={[
        "prosemirror-suggestcat-plugin",
        "prosemirror-suggestcat-plugin-react",
      ]}
      demoKey="suggestcat"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Peer Dependencies</h4>
        <p className="docs-text">
          Install the required peer dependencies for the core plugin:
        </p>
        <InstallCommand packageNames={PEER_PACKAGE_NAMES} />

        <p className="docs-text">
          If using the React UI layer, also install:
        </p>
        <InstallCommand packageNames={REACT_PEER_PACKAGE_NAMES} />

        <h4 className="docs-subtitle">Get an API Key</h4>
        <p className="docs-text">
          Create an account on{" "}
          <a
            href="https://www.suggestcat.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            SuggestCat
          </a>{" "}
          and generate an API key from your dashboard. Pass this key to each
          plugin you register.
        </p>

        <h4 className="docs-subtitle">Grammar Plugin</h4>
        <p className="docs-text">
          Checks text for grammar and style issues paragraph by paragraph.
          Only edited paragraphs are re-checked, and multiple paragraphs are
          processed in parallel via the block runner.
        </p>
        <CodeBlock code={SETUP_GRAMMAR} />

        <h4 className="docs-subtitle">Complete Plugin</h4>
        <p className="docs-text">
          AI text completion and transformation with streaming. Use it to
          complete, shorten, lengthen, simplify, explain, translate text and
          more. Trigger tasks via <code>startTask()</code>, then accept or
          reject the streamed result.
        </p>
        <CodeBlock code={SETUP_COMPLETE} />

        <h4 className="docs-subtitle">Autocomplete Plugin</h4>
        <p className="docs-text">
          Inline ghost-text completions that appear after the cursor as you
          type. Press <strong>Tab</strong> to accept, <strong>Escape</strong>{" "}
          to dismiss.
        </p>
        <CodeBlock code={SETUP_AUTOCOMPLETE} />

        <h4 className="docs-subtitle">React UI Components</h4>
        <p className="docs-text">
          The <code>prosemirror-suggestcat-plugin-react</code> package provides
          a slash menu for AI commands, a suggestion overlay for streaming
          results, and a grammar popup for inline corrections. Add the
          components next to your editor div.
        </p>
        <CodeBlock code={SETUP_REACT} />

        <h4 className="docs-subtitle">Styles</h4>
        <p className="docs-text">
          Import the CSS for decorations, popups, and overlays. Autocomplete
          ghost text requires your own CSS class.
        </p>
        <CodeBlock code={SETUP_STYLES} />
      </DocsSection>

      <DocsSection title="Configuration Tips">
        <h4 className="docs-subtitle">Model Selection</h4>
        <p className="docs-text">
          All plugins default to <code>openai:gpt-4o-mini</code>. You can
          choose a different model per plugin, and the grammar plugin supports
          automatic fallback when the primary model fails repeatedly.
        </p>
        <CodeBlock code={CONFIG_MODELS} />

        <h4 className="docs-subtitle">Debounce and Batch Size</h4>
        <p className="docs-text">
          Tune the debounce delay and batch size to balance responsiveness
          and API usage. Higher debounce values reduce API calls; higher
          batch sizes process more paragraphs in parallel.
        </p>
        <CodeBlock code={CONFIG_DEBOUNCE} />

        <h4 className="docs-subtitle">TipTap Integration</h4>
        <p className="docs-text">
          All plugins work with TipTap by wrapping them in an extension.
          Register the plugins via{" "}
          <code>addProseMirrorPlugins()</code>.
        </p>
        <CodeBlock code={CONFIG_TIPTAP} />
      </DocsSection>

      <DocsSection title="Backend Requirements">
        <h4 className="docs-subtitle">API Key Setup</h4>
        <p className="docs-text">
          All plugins communicate with the SuggestCat backend. You need an
          API key from{" "}
          <a
            href="https://www.suggestcat.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            suggestcat.com
          </a>
          . Track usage and manage keys from your admin dashboard.
        </p>
        <CodeBlock code={BACKEND_API_KEY} />

        <h4 className="docs-subtitle">Endpoint Configuration</h4>
        <p className="docs-text">
          By default all requests go to the SuggestCat API. You can point
          each plugin to a custom endpoint (e.g. a proxy server) by passing
          the <code>apiEndpoint</code> option.
        </p>
        <CodeBlock code={BACKEND_ENDPOINT} />
      </DocsSection>

      <DocsSection title="Compatibility">
        <div className="docs-compat-grid">
          <div className="docs-compat-item">
            <strong>ProseMirror</strong>
            <span>
              prosemirror-state ^1.4, prosemirror-view ^1.31,
              prosemirror-model ^1.19
            </span>
          </div>
          <div className="docs-compat-item">
            <strong>React</strong>
            <span>^18.2 (for the React UI package only)</span>
          </div>
          <div className="docs-compat-item">
            <strong>Browsers</strong>
            <span>All modern browsers (Chrome, Firefox, Safari, Edge)</span>
          </div>
          <div className="docs-compat-item">
            <strong>TipTap</strong>
            <span>
              Compatible — register as ProseMirror plugins via{" "}
              <code>addProseMirrorPlugins()</code>
            </span>
          </div>
        </div>
      </DocsSection>
    </DevDocsLayout>
  );
}
