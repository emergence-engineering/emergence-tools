import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-text-map";

const SETUP_BASIC = `import {
  docToTextWithMapping,
  textPosToDocPos,
} from "@emergence-engineering/prosemirror-text-map";

// Convert a ProseMirror doc to plain text with position mapping
const { text, mapping } = docToTextWithMapping(editorView.state.doc);

// Later, map a position in the plain text back to the document
const docPos = textPosToDocPos(textPos, mapping);`;

const CUSTOM_NODE_SERIALIZER = `import { docToTextWithMapping } from "@emergence-engineering/prosemirror-text-map";
import type { MappingOptions } from "@emergence-engineering/prosemirror-text-map";

// Custom node serializer — e.g. include image alt text in the output
const options: Partial<MappingOptions> = {
  nodeToTextMappingOverride: {
    image: (node) => ({
      text: node.attrs.alt || "[image]",
      mapping: [{ docPos: 0, textPos: 0 }],
    }),
  },
};

const { text, mapping } = docToTextWithMapping(doc, options);`;

const PEER_PACKAGE_NAMES = ["prosemirror-model"];

export function TextMapDocs() {
  return (
    <DevDocsLayout
      title="Text Map — Dev Docs"
      packageNames={["@emergence-engineering/prosemirror-text-map"]}
      demoKey="textMap"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Peer Dependencies</h4>
        <p className="docs-text">
          Install the required peer dependency:
        </p>
        <InstallCommand packageNames={PEER_PACKAGE_NAMES} />

        <h4 className="docs-subtitle">Basic Usage</h4>
        <p className="docs-text">
          Use <code>docToTextWithMapping</code> to extract plain text from a
          ProseMirror document along with a position mapping. Then use{" "}
          <code>textPosToDocPos</code> to convert any position in the plain text
          back to the corresponding document position. This is especially useful
          when integrating text-only libraries (diffing, NLP, search) with
          ProseMirror.
        </p>
        <CodeBlock code={SETUP_BASIC} />

        <h4 className="docs-subtitle">Custom Node Serializers</h4>
        <p className="docs-text">
          Pass a <code>MappingOptions</code> object with{" "}
          <code>nodeToTextMappingOverride</code> to control how specific node
          types are serialized to text. This is helpful when you want non-text
          nodes (like images) to appear in the diff output.
        </p>
        <CodeBlock code={CUSTOM_NODE_SERIALIZER} />
      </DocsSection>
    </DevDocsLayout>
  );
}
