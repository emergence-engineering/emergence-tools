import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-link-plugin";

const PEER_PACKAGE_NAMES = [
  "prosemirror-model",
  "prosemirror-state",
  "prosemirror-view",
  "prosemirror-commands",
  "prosemirror-transform",
  "prosemirror-tables",
];

const SETUP_ALIASES = `import { Decoration } from "prosemirror-view";
import {
  autoLinkingPlugin,
  LinksKeyState,
} from "prosemirror-link-plugin";

// 1. Define your alias type (any object with an \`alias\` string field)
interface LinkSpec {
  alias: string;
  url: string;
}

// 2. Provide the initial alias list
const aliases: LinkSpec[] = [
  { alias: "ProseMirror", url: "https://prosemirror.net" },
  { alias: "TypeScript", url: "https://typescriptlang.org" },
];`;

const SETUP_DECORATION = `// 3. Create a decoration factory
//    Called for every match — return any ProseMirror Decoration
const createAliasDecoration = (
  start: number,
  end: number,
  alias: string,
  matchPos: number,
  pluginState: LinksKeyState<LinkSpec>,
  doc: Node,
) => {
  const spec = pluginState.aliasToSpec[alias];
  return Decoration.inline(start, end, {
    class: "autoLink",
    title: spec?.url,
  }, { alias, url: spec?.url });
};`;

const SETUP_PLUGIN = `import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";

// 4. Register the plugin
const state = EditorState.create({
  doc: schema.nodeFromJSON(initialDoc),
  plugins: [
    ...exampleSetup({ schema }),
    autoLinkingPlugin<LinkSpec>(
      aliases,
      createAliasDecoration,
      (added) => console.log("added:", added),    // onLinkAdd
      (removed) => console.log("removed:", removed), // onLinkRemove
    ),
  ],
});

const view = new EditorView(
  document.getElementById("editor")!,
  { state },
);`;

const CONFIG_UPDATE = `import { linksKey, LinksMetaType } from "prosemirror-link-plugin";

// Dispatch a transaction to replace the alias list at runtime
const updatedAliases = [
  { alias: "React", url: "https://react.dev" },
  { alias: "ProseMirror", url: "https://prosemirror.net" },
];

view.dispatch(
  view.state.tr.setMeta(linksKey, {
    type: LinksMetaType.linkUpdate,
    specs: updatedAliases,
  }),
);`;

const CONFIG_REGEX = `// Supply a custom regex generator for fine-grained matching
autoLinkingPlugin(
  aliases,
  createAliasDecoration,
  undefined,
  undefined,
  // Custom regex: case-insensitive, whole-word matching
  (aliasList) =>
    new RegExp(\`\\\\b(\${aliasList.join("|")})\\\\b\`, "gi"),
);`;

const CONFIG_CALLBACKS = `autoLinkingPlugin(
  aliases,
  createAliasDecoration,
  // Called when new alias matches appear in the document
  (addedLinks) => {
    addedLinks.forEach((link) =>
      console.log(\`Alias "\${link.alias}" was added\`),
    );
  },
  // Called when alias matches are removed from the document
  (removedLinks) => {
    removedLinks.forEach((link) =>
      console.log(\`Alias "\${link.alias}" was removed\`),
    );
  },
);`;

export function LinkPluginDocs() {
  return (
    <DevDocsLayout
      title="AutoLink Plugin — Dev Docs"
      packageNames={["prosemirror-link-plugin"]}
      demoKey="linkPlugin"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Peer Dependencies</h4>
        <p className="docs-text">
          Install the required peer dependencies:
        </p>
        <InstallCommand packageNames={PEER_PACKAGE_NAMES} />

        <h4 className="docs-subtitle">Define Aliases</h4>
        <p className="docs-text">
          Each alias is an object with at least an <code>alias</code> string
          field. You can attach any extra data (URLs, IDs, etc.) — the plugin
          is generic over this type.
        </p>
        <CodeBlock code={SETUP_ALIASES} />

        <h4 className="docs-subtitle">Create a Decoration Factory</h4>
        <p className="docs-text">
          The factory is called for every alias match found in the document.
          Return a ProseMirror <code>Decoration</code> (typically{" "}
          <code>Decoration.inline</code>) to control how the match is rendered.
        </p>
        <CodeBlock code={SETUP_DECORATION} />

        <h4 className="docs-subtitle">Register the Plugin</h4>
        <p className="docs-text">
          Pass the alias list, decoration factory, and optional callbacks to{" "}
          <code>autoLinkingPlugin</code>. The plugin will scan the document on
          init and re-scan affected ranges on every transaction.
        </p>
        <CodeBlock code={SETUP_PLUGIN} />
      </DocsSection>

      <DocsSection title="Configuration Tips">
        <h4 className="docs-subtitle">Updating Aliases at Runtime</h4>
        <p className="docs-text">
          Dispatch a transaction with <code>LinksMetaType.linkUpdate</code> to
          replace the alias list. The plugin recalculates all decorations
          across the document.
        </p>
        <CodeBlock code={CONFIG_UPDATE} />

        <h4 className="docs-subtitle">Custom Regex Generator</h4>
        <p className="docs-text">
          By default the plugin builds a regex that matches any of the alias
          strings. You can supply your own generator for case-insensitive
          matching, word-boundary rules, or other custom behaviour.
        </p>
        <CodeBlock code={CONFIG_REGEX} />

        <h4 className="docs-subtitle">Add / Remove Callbacks</h4>
        <p className="docs-text">
          Use <code>onLinkAdd</code> and <code>onLinkRemove</code> to react
          when aliases appear or disappear from the document — useful for
          analytics, side-panel updates, or syncing with external state.
        </p>
        <CodeBlock code={CONFIG_CALLBACKS} />
      </DocsSection>
    </DevDocsLayout>
  );
}
