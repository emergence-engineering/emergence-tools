import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-slash-menu";

const SETUP_ELEMENTS = `import { SlashMenuPlugin, type CommandItem, type SubMenu, type MenuElement } from "prosemirror-slash-menu";
import { setBlockType, toggleMark } from "prosemirror-commands";

// Each element needs a unique id.
const H1Command: CommandItem = {
  id: "heading1",
  label: "Heading 1",
  type: "command",
  command: (view) => {
    setBlockType(view.state.schema.nodes.heading, { level: 1 })(
      view.state, view.dispatch, view,
    );
  },
  available: () => true,
};

const BoldCommand: CommandItem = {
  id: "bold",
  label: "Bold",
  type: "command",
  command: (view) => {
    toggleMark(view.state.schema.marks.strong)(view.state, view.dispatch, view);
  },
  available: () => true,
};

// Group related commands in a SubMenu
const HeadingsMenu: SubMenu = {
  id: "headings",
  label: "Headings",
  type: "submenu",
  elements: [H1Command /* , H2Command, H3Command */],
  available: () => true,
};

const menuElements: MenuElement[] = [HeadingsMenu, BoldCommand];`;

const SETUP_PLUGIN = `import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import { SlashMenuPlugin } from "prosemirror-slash-menu";

const state = EditorState.create({
  schema,
  plugins: [
    SlashMenuPlugin(menuElements),
    ...exampleSetup({ schema }),
  ],
});

const view = new EditorView(document.getElementById("editor")!, { state });`;

const CONFIG_CONDITIONS = `import { SlashMenuPlugin, type OpeningConditions } from "prosemirror-slash-menu";

const customConditions: OpeningConditions = {
  shouldOpen: (state, event, view) => {
    // Example: also open on "!" in empty paragraphs
    return event.key === "!";
  },
  shouldClose: (state, event, view) => {
    // Default close on Escape is always active;
    // return true here for additional close triggers
    return false;
  },
};

SlashMenuPlugin(menuElements, undefined, customConditions);`;

const CONFIG_GROUPS = `// Use the "group" property to visually separate items in the UI.
const menuElements: MenuElement[] = [
  { id: "h1", label: "H1", type: "command", command: ..., available: () => true, group: "Blocks" },
  { id: "h2", label: "H2", type: "command", command: ..., available: () => true, group: "Blocks" },
  { id: "bold", label: "Bold", type: "command", command: ..., available: () => true, group: "Inline" },
];`;

const CONFIG_AVAILABILITY = `// Hide items dynamically with the "available" callback.
// It receives the EditorView so you can inspect current state.
const codeBlockCommand: CommandItem = {
  id: "codeBlock",
  label: "Code Block",
  type: "command",
  command: (view) => { /* ... */ },
  available: (view) => {
    // Only show when the selection is in a paragraph
    const { $from } = view.state.selection;
    return $from.parent.type.name === "paragraph";
  },
};`;

const CONFIG_NESTED = `// SubMenus can be nested arbitrarily deep.
const nestedMenu: SubMenu = {
  id: "formatting",
  label: "Formatting",
  type: "submenu",
  available: () => true,
  elements: [
    {
      id: "inline",
      label: "Inline",
      type: "submenu",
      available: () => true,
      elements: [
        { id: "bold", label: "Bold", type: "command", command: ..., available: () => true },
        { id: "italic", label: "Italic", type: "command", command: ..., available: () => true },
      ],
    },
  ],
};`;

const PEER_PACKAGE_NAMES = [
  "prosemirror-model",
  "prosemirror-state",
  "prosemirror-view",
];

export function SlashMenuDocs() {
  return (
    <DevDocsLayout
      title="Slash Menu — Dev Docs"
      packageNames={["prosemirror-slash-menu"]}
      demoKey="slashMenuVanilla"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Peer Dependencies</h4>
        <p className="docs-text">Install the required peer dependencies:</p>
        <InstallCommand packageNames={PEER_PACKAGE_NAMES} />

        <h4 className="docs-subtitle">Define Menu Elements</h4>
        <p className="docs-text">
          Menu elements are either a <code>CommandItem</code> (executes an
          action) or a <code>SubMenu</code> (opens a nested list). Every element
          must have a unique <code>id</code>.
        </p>
        <CodeBlock code={SETUP_ELEMENTS} />

        <h4 className="docs-subtitle">Register Plugin</h4>
        <p className="docs-text">
          Pass your menu elements array to <code>SlashMenuPlugin</code> and add
          it to the editor plugins.{" "}
          <strong>
            The slash menu plugin must be registered before other plugins
            (e.g. <code>exampleSetup</code>) in the plugins array.
          </strong>{" "}
          This ensures the menu captures keyboard events (Arrow keys, Enter,
          Escape) for navigation before other key bindings consume them. The
          plugin is headless — it manages state only. You render the UI yourself
          by reading <code>SlashMenuKey.getState(editorState)</code>, or use{" "}
          <a href="#slashMenuReact">prosemirror-slash-menu-react</a> for a
          ready-made React component.
        </p>
        <CodeBlock code={SETUP_PLUGIN} />
      </DocsSection>

      <DocsSection title="Configuration Tips">
        <h4 className="docs-subtitle">Custom Opening Conditions</h4>
        <p className="docs-text">
          By default the menu opens when <code>/</code> is typed in an empty
          paragraph or after a space. Pass <code>customConditions</code> to
          override or extend this behavior.
        </p>
        <CodeBlock code={CONFIG_CONDITIONS} />

        <h4 className="docs-subtitle">Groups</h4>
        <p className="docs-text">
          The <code>group</code> property on menu elements lets your UI render
          visual separators. The plugin itself does not consume this value — it
          is surfaced in the state for your UI layer.
        </p>
        <CodeBlock code={CONFIG_GROUPS} />

        <h4 className="docs-subtitle">Dynamic Availability</h4>
        <p className="docs-text">
          Use the <code>available</code> callback to show or hide items based on
          the current editor state.
        </p>
        <CodeBlock code={CONFIG_AVAILABILITY} />

        <h4 className="docs-subtitle">Nested SubMenus</h4>
        <p className="docs-text">
          SubMenus can contain other SubMenus for arbitrarily deep nesting.
          Navigate with <strong>Right arrow</strong> to enter and{" "}
          <strong>Escape / Left arrow</strong> to go back.
        </p>
        <CodeBlock code={CONFIG_NESTED} />
      </DocsSection>
    </DevDocsLayout>
  );
}
