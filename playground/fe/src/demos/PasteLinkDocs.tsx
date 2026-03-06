import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-paste-link";

const SETUP_BASIC = `import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import pasteLinkPlugin from "prosemirror-paste-link";

const view = new EditorView(document.getElementById("editor")!, {
  state: EditorState.create({
    schema, // must include a "link" mark
    plugins: [
      // ...other plugins
      pasteLinkPlugin,
    ],
  }),
});`;

const TIPTAP_USAGE = `import { Extension } from "@tiptap/core";
import pasteLinkPlugin from "prosemirror-paste-link";

const PasteLink = Extension.create({
  name: "pasteLink",
  addProseMirrorPlugins() {
    return [pasteLinkPlugin];
  },
});`;

const PEER_PACKAGE_NAMES = ["prosemirror-state", "prosemirror-transform"];

export function PasteLinkDocs() {
  return (
    <DevDocsLayout
      title="Paste Link — Dev Docs"
      packageNames={["prosemirror-paste-link"]}
      demoKey="pasteLink"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Peer Dependencies</h4>
        <p className="docs-text">
          Install the required peer dependencies:
        </p>
        <InstallCommand packageNames={PEER_PACKAGE_NAMES} />

        <h4 className="docs-subtitle">Plugin Registration</h4>
        <p className="docs-text">
          Import the default export and add it to your plugins array. The plugin
          requires your schema to have a <code>link</code> mark with an{" "}
          <code>href</code> attribute. When the user pastes a URL while text is
          selected, the selection is wrapped in a link instead of being replaced
          by the URL text.
        </p>
        <CodeBlock code={SETUP_BASIC} />

        <h4 className="docs-subtitle">TipTap</h4>
        <p className="docs-text">
          Register the plugin via TipTap's extension API:
        </p>
        <CodeBlock code={TIPTAP_USAGE} />
      </DocsSection>
    </DevDocsLayout>
  );
}
