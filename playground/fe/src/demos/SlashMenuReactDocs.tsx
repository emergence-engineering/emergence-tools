import { DevDocsLayout } from "../components/DevDocsLayout";
import { DocsSection } from "../components/DocsSection";
import { CodeBlock } from "../components/CodeBlock";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-slash-menu-react";

const SETUP_PLUGIN = `import { SlashMenuPlugin } from "prosemirror-slash-menu";
import { defaultElements } from "prosemirror-slash-menu-react";
import { EditorState } from "prosemirror-state";
import { exampleSetup } from "prosemirror-example-setup";

// 1. Register the vanilla slash menu plugin with your elements
const state = EditorState.create({
  schema,
  plugins: [
    SlashMenuPlugin(defaultElements),
    ...exampleSetup({ schema }),
  ],
});`;

const SETUP_REACT = `import { useState, useEffect, useRef } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { SlashMenuPlugin } from "prosemirror-slash-menu";
import {
  SlashMenuReact,
  defaultElements,
  defaultIcons,
  Icons,
} from "prosemirror-slash-menu-react";

// Import the default styles
import "prosemirror-slash-menu-react/dist/styles/menu-style.css";

function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorState, setEditorState] = useState<EditorState>();

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      schema,
      plugins: [SlashMenuPlugin(defaultElements), ...exampleSetup({ schema })],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(tr) {
        const newState = view.state.apply(tr);
        view.updateState(newState);
        setEditorState(newState);
      },
    });

    viewRef.current = view;
    setEditorState(state);
    return () => view.destroy();
  }, []);

  return (
    <>
      <div ref={editorRef} />
      {editorState && viewRef.current && (
        <SlashMenuReact
          editorState={editorState}
          editorView={viewRef.current}
          icons={{
            [Icons.HeaderMenu]: defaultIcons.HeadingIcon,
            [Icons.Level1]: defaultIcons.H1Icon,
            [Icons.Level2]: defaultIcons.H2Icon,
            [Icons.Level3]: defaultIcons.H3Icon,
            [Icons.Bold]: defaultIcons.BoldIcon,
            [Icons.Italic]: defaultIcons.ItalicIcon,
            [Icons.Code]: defaultIcons.CodeIcon,
            [Icons.Link]: defaultIcons.LinkIcon,
          }}
          filterPlaceHolder="Type to filter..."
          clickable
        />
      )}
    </>
  );
}`;

const CONFIG_ICONS = `import { defaultIcons, Icons } from "prosemirror-slash-menu-react";

// Map element ids to icon components
<SlashMenuReact
  icons={{
    [Icons.HeaderMenu]: defaultIcons.HeadingIcon,
    [Icons.Bold]: defaultIcons.BoldIcon,
    // Use any React FC as an icon
    myCustomId: () => <span>*</span>,
  }}
  rightIcons={{
    // Right-side icons, commonly used for submenu arrows
    [Icons.HeaderMenu]: defaultIcons.ArrowRight,
  }}
/>`;

const CONFIG_POPPER = `import { Placement } from "prosemirror-slash-menu-react";

// Anchor the menu to a custom element instead of the cursor
<SlashMenuReact
  popperReference={document.getElementById("toolbar")!}
  popperOptions={{
    placement: Placement.bottomStart,
    offsetModifier: { name: "offset", options: { offset: [0, 8] } },
  }}
/>`;

const CONFIG_CLICKABLE = `// Enable mouse interaction on menu items (keyboard still works)
<SlashMenuReact
  clickable
  filterPlaceHolder="Search commands..."
  mainMenuLabel="Commands"
/>`;

const PEER_PACKAGE_NAMES = [
  "prosemirror-slash-menu",
  "prosemirror-commands",
  "prosemirror-schema-basic",
  "prosemirror-state",
  "prosemirror-view",
  "react",
  "react-dom",
];

export function SlashMenuReactDocs() {
  return (
    <DevDocsLayout
      title="Slash Menu React — Dev Docs"
      packageNames={["prosemirror-slash-menu-react"]}
      demoKey="slashMenuReact"
      sourceUrl={SOURCE_URL}
    >
      <DocsSection title="Setup" defaultOpen>
        <h4 className="docs-subtitle">Peer Dependencies</h4>
        <p className="docs-text">Install the required peer dependencies:</p>
        <InstallCommand packageNames={PEER_PACKAGE_NAMES} />

        <h4 className="docs-subtitle">Register the Vanilla Plugin</h4>
        <p className="docs-text">
          This package provides the React UI layer. The menu state is managed by{" "}
          <code>prosemirror-slash-menu</code>, which must be installed and
          registered as a plugin. You can use the{" "}
          <code>defaultElements</code> shipped with this package or define your
          own.
        </p>
        <CodeBlock code={SETUP_PLUGIN} />

        <h4 className="docs-subtitle">Render the React Component</h4>
        <p className="docs-text">
          Pass the current <code>editorState</code> and{" "}
          <code>editorView</code> to <code>SlashMenuReact</code>. The component
          positions itself at the cursor using Popper.js and reads the menu
          state from the plugin.
        </p>
        <CodeBlock code={SETUP_REACT} />
      </DocsSection>

      <DocsSection title="Configuration Tips">
        <h4 className="docs-subtitle">Custom Icons</h4>
        <p className="docs-text">
          Map element <code>id</code> strings to React function components. The
          package exports a set of <code>defaultIcons</code> and an{" "}
          <code>Icons</code> enum for the built-in elements.
        </p>
        <CodeBlock code={CONFIG_ICONS} />

        <h4 className="docs-subtitle">Popper Placement</h4>
        <p className="docs-text">
          By default the menu appears below the cursor. Pass a{" "}
          <code>popperReference</code> element and <code>popperOptions</code> to
          anchor the menu elsewhere (e.g. below a toolbar).
        </p>
        <CodeBlock code={CONFIG_POPPER} />

        <h4 className="docs-subtitle">Clickable Mode & Filter Placeholder</h4>
        <p className="docs-text">
          Enable <code>clickable</code> to let users click menu items in
          addition to keyboard navigation. Use{" "}
          <code>filterPlaceHolder</code> and <code>mainMenuLabel</code> to
          customize the header text.
        </p>
        <CodeBlock code={CONFIG_CLICKABLE} />
      </DocsSection>
    </DevDocsLayout>
  );
}
