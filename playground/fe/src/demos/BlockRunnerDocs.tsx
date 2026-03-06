import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-block-runner";

const SETUP_PROCESSOR = `import type {
  ProcessingUnit,
  UnitProcessorResult,
} from "@emergence-engineering/prosemirror-block-runner";
import type { EditorView } from "prosemirror-view";

// A processor receives the EditorView and a ProcessingUnit,
// then returns { data } on success or { error } on failure.
async function myProcessor(
  view: EditorView,
  unit: ProcessingUnit,
): Promise<UnitProcessorResult<MyResponse>> {
  const result = await analyzeText(unit.text);
  return { data: result };
}`;

const SETUP_DECORATION_FACTORY = `import { Decoration } from "prosemirror-view";
import type {
  ProcessingUnit,
  ResultDecoration,
  ResultDecorationSpec,
} from "@emergence-engineering/prosemirror-block-runner";

// The decoration factory converts a processor response into
// ProseMirror Decorations that are rendered in the editor.
function myDecorationFactory(
  response: MyResponse,
  unit: ProcessingUnit,
): ResultDecoration<MyResponse>[] {
  return [
    Decoration.inline(unit.from, unit.to, { class: "highlight" }, {
      id: {},
      unitId: unit.id,
      originalText: unit.text,
      response,
    } as ResultDecorationSpec<MyResponse>),
  ] as ResultDecoration<MyResponse>[];
}`;

const SETUP_PLUGIN = `import {
  blockRunnerPlugin,
  createBlockRunnerKey,
  ActionType,
  dispatchAction,
} from "@emergence-engineering/prosemirror-block-runner";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

// 1. Create a unique plugin key
const myKey = createBlockRunnerKey("my-processor");

// 2. Register the plugin
const state = EditorState.create({
  schema,
  plugins: [
    blockRunnerPlugin({
      pluginKey: myKey,
      unitProcessor: myProcessor,
      decorationFactory: myDecorationFactory,
      initialContextState: {},
      options: { batchSize: 2, maxRetries: 3 },
    }),
  ],
});

const view = new EditorView(document.getElementById("editor")!, { state });

// 3. Start processing
dispatchAction(view, myKey, {
  type: ActionType.INIT,
  metadata: { single: {} },
});`;

const CONFIG_BATCH = `blockRunnerPlugin({
  // ...
  options: {
    batchSize: 2,       // process 2 units in parallel (default: 4)
    maxRetries: 5,      // retry up to 5 times on error (default: 3)
    backoffBase: 2000,  // initial backoff delay in ms (default: 1000)
  },
});`;

const CONFIG_WIDGET = `import { Decoration } from "prosemirror-view";
import type { ProcessingUnit, WidgetFactory } from "@emergence-engineering/prosemirror-block-runner";

const myWidgetFactory: WidgetFactory = (unit: ProcessingUnit) => {
  // Show a spinner while the unit is processing
  return Decoration.widget(unit.from + 1, () => {
    const span = document.createElement("span");
    span.className = "loading-spinner";
    return span;
  }, { id: {}, unitId: unit.id, originalText: "", response: undefined });
};

blockRunnerPlugin({
  // ...
  widgetFactory: myWidgetFactory,
});`;

const CONFIG_DIRTY = `blockRunnerPlugin({
  // ...
  options: {
    dirtyHandling: {
      shouldRecalculate: true,   // re-process when text changes (default: true)
      debounceDelay: 2000,       // ms to wait before re-processing (default: 2000)
      skipDirtyOnSelfChange: true, // ignore changes made by the plugin itself
    },
  },
});`;

const CONFIG_PAUSE_RESUME = `import { pauseRunner, resumeRunner, canResume } from "@emergence-engineering/prosemirror-block-runner";

// Pause the runner — units stop being picked up
pauseRunner(view, myKey);

// Resume — queued and dirty units continue processing
if (canResume(view, myKey)) {
  resumeRunner(view, myKey);
}`;

const CONFIG_ACCEPT_DECLINE = `import {
  ActionType,
  dispatchAction,
} from "@emergence-engineering/prosemirror-block-runner";
import type { ResultDecorationSpec } from "@emergence-engineering/prosemirror-block-runner";

// 1. Select a decoration (e.g. on click)
dispatchAction(view, myKey, {
  type: ActionType.SELECT_DECORATION,
  id: decoration.spec.id,
});

// 2. Accept — apply the suggestion to the document, then remove the decoration
const spec = decoration.spec as ResultDecorationSpec<MyResponse>;
const tr = view.state.tr.replaceWith(
  decoration.from,
  decoration.to,
  schema.text(spec.response.replacement),
);
tr.setMeta(myKey, { type: ActionType.REMOVE_DECORATION, id: spec.id });
view.dispatch(tr);

// 3. Decline — just remove the decoration without changing the document
dispatchAction(view, myKey, {
  type: ActionType.REMOVE_DECORATION,
  id: decoration.spec.id,
});

// 4. Deselect (e.g. when clicking away)
dispatchAction(view, myKey, { type: ActionType.DESELECT_DECORATION });`;

const PEER_PACKAGE_NAMES = [
  "prosemirror-model",
  "prosemirror-state",
  "prosemirror-transform",
  "prosemirror-view",
];

export function BlockRunnerDocs() {
  return (
    <DevDocsLayout
      title="Block Runner — Dev Docs"
      packageNames={["@emergence-engineering/prosemirror-block-runner"]}
      demoKey="blockRunner"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Peer Dependencies</h4>
        <p className="docs-text">
          Install the required peer dependencies:
        </p>
        <InstallCommand packageNames={PEER_PACKAGE_NAMES} />

        <h4 className="docs-subtitle">Create a Processor Function</h4>
        <p className="docs-text">
          A <code>UnitProcessor</code> is an async function that receives an{" "}
          <code>EditorView</code> and a <code>ProcessingUnit</code> (containing
          the block's text, position range, and mapping). Return{" "}
          <code>{"{ data }"}</code> on success or <code>{"{ error }"}</code> on
          failure.
        </p>
        <CodeBlock code={SETUP_PROCESSOR} />

        <h4 className="docs-subtitle">Create a Decoration Factory</h4>
        <p className="docs-text">
          The decoration factory converts a processor's response into ProseMirror
          decorations (inline highlights, widgets, etc.) that are rendered in the
          editor.
        </p>
        <CodeBlock code={SETUP_DECORATION_FACTORY} />

        <h4 className="docs-subtitle">Configure the Plugin</h4>
        <p className="docs-text">
          Create a plugin key, register the plugin with your processor and
          decoration factory, then dispatch an <code>INIT</code> action to start
          processing.
        </p>
        <CodeBlock code={SETUP_PLUGIN} />
      </DocsSection>

      <DocsSection title="Configuration Tips">
        <h4 className="docs-subtitle">Batch Size and Retry/Backoff</h4>
        <p className="docs-text">
          Control how many units are processed in parallel and how failures are
          retried. The backoff delay doubles with each retry:{" "}
          <code>delay = backoffBase * 2^retryCount</code>.
        </p>
        <CodeBlock code={CONFIG_BATCH} />

        <h4 className="docs-subtitle">Widget Factories</h4>
        <p className="docs-text">
          Add a <code>widgetFactory</code> to show loading indicators or error
          badges next to units while they are being processed.
        </p>
        <CodeBlock code={CONFIG_WIDGET} />

        <h4 className="docs-subtitle">Dirty Tracking</h4>
        <p className="docs-text">
          When the document changes, affected units are marked{" "}
          <code>DIRTY</code> and re-processed after a debounce delay. Configure
          this behavior with the <code>dirtyHandling</code> options.
        </p>
        <CodeBlock code={CONFIG_DIRTY} />

        <h4 className="docs-subtitle">Pause and Resume</h4>
        <p className="docs-text">
          Use <code>pauseRunner</code> and <code>resumeRunner</code> to
          temporarily halt and continue processing without losing state.
        </p>
        <CodeBlock code={CONFIG_PAUSE_RESUME} />

        <h4 className="docs-subtitle">Accept / Decline Decorations</h4>
        <p className="docs-text">
          Once the processor creates decorations (e.g. grammar suggestions),
          users interact with them via three actions:{" "}
          <code>SELECT_DECORATION</code> to highlight one,{" "}
          <code>REMOVE_DECORATION</code> to accept or decline it, and{" "}
          <code>DESELECT_DECORATION</code> to clear the selection. To accept,
          apply the change to the document and remove the decoration in a single
          transaction. To decline, just remove the decoration.
        </p>
        <CodeBlock code={CONFIG_ACCEPT_DECLINE} />
      </DocsSection>
    </DevDocsLayout>
  );
}
