import { useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { setBlockType, toggleMark } from "prosemirror-commands";
import {
  SlashMenuPlugin,
  SlashMenuKey,
  type CommandItem,
  type SlashMenuState,
  type MenuElement,
} from "prosemirror-slash-menu";
import { DemoLayout } from "../components/DemoLayout";

const menuElements: MenuElement[] = [
  {
    id: "heading1",
    label: "Heading 1",
    type: "command",
    command: (view) => {
      setBlockType(view.state.schema.nodes.heading, { level: 1 })(
        view.state,
        view.dispatch,
        view,
      );
    },
    available: () => true,
  } as CommandItem,
  {
    id: "heading2",
    label: "Heading 2",
    type: "command",
    command: (view) => {
      setBlockType(view.state.schema.nodes.heading, { level: 2 })(
        view.state,
        view.dispatch,
        view,
      );
    },
    available: () => true,
  } as CommandItem,
  {
    id: "bold",
    label: "Bold",
    type: "command",
    command: (view) => {
      toggleMark(view.state.schema.marks.strong)(
        view.state,
        view.dispatch,
        view,
      );
    },
    available: () => true,
  } as CommandItem,
  {
    id: "italic",
    label: "Italic",
    type: "command",
    command: (view) => {
      toggleMark(view.state.schema.marks.em)(view.state, view.dispatch, view);
    },
    available: () => true,
  } as CommandItem,
  {
    id: "code",
    label: "Code",
    type: "command",
    command: (view) => {
      toggleMark(view.state.schema.marks.code)(
        view.state,
        view.dispatch,
        view,
      );
    },
    available: () => true,
  } as CommandItem,
];

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/SlashMenuVanillaDemo.tsx";

function SlashMenuVanillaUsage() {
  return (
    <ul className="demo-usage-list">
      <li>
        <strong>Type <code>/</code></strong> in an empty paragraph to open
        the slash menu.
      </li>
      <li>
        <strong>Arrow keys</strong> to navigate between items.
      </li>
      <li>
        <strong>Type to filter</strong> — the menu narrows to matching
        items.
      </li>
      <li>
        <strong>Enter or Tab</strong> to execute the selected command.
      </li>
      <li>
        <strong>Escape</strong> to close the menu.
      </li>
    </ul>
  );
}

function SlashMenuVanillaEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [menuState, setMenuState] = useState<SlashMenuState | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const slashPlugin = SlashMenuPlugin(menuElements);

    const state = EditorState.create({
      schema,
      plugins: [slashPlugin, ...exampleSetup({ schema })],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(tr) {
        const newState = view.state.apply(tr);
        view.updateState(newState);
        const slashState = SlashMenuKey.getState(newState);
        setMenuState(slashState ?? null);
      },
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  return (
    <div className="card editor-card" style={{ position: "relative" }}>
      <div ref={editorRef} />
      {menuState?.open && (
        <div
          style={{
            position: "absolute",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: 4,
            zIndex: 10,
            minWidth: 160,
          }}
        >
          {menuState.filter && (
            <div
              style={{
                padding: "4px 8px",
                fontSize: 12,
                color: "#888",
                borderBottom: "1px solid #eee",
              }}
            >
              Filter: {menuState.filter}
            </div>
          )}
          {menuState.filteredElements.map((el) => (
            <div
              key={el.id}
              id={el.id}
              style={{
                padding: "6px 12px",
                cursor: "pointer",
                borderRadius: 4,
                background:
                  menuState.selected === el.id ? "#e8f0fe" : "transparent",
                fontWeight: menuState.selected === el.id ? 600 : 400,
              }}
            >
              {el.label}
            </div>
          ))}
          {menuState.filteredElements.length === 0 && (
            <div style={{ padding: "6px 12px", color: "#999" }}>
              No matching items
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SlashMenuVanillaDemo() {
  return (
    <DemoLayout
      title="prosemirror-slash-menu"
      description={
        <>
          Headless slash menu plugin for ProseMirror. Type <code>/</code> in an
          empty paragraph to open the menu. This demo renders a custom UI by
          reading plugin state — no React dependency required.
        </>
      }
      packageNames={["prosemirror-slash-menu"]}
      demoKey="slashMenuVanilla"
      sourceUrl={SOURCE_URL}
      usage={<SlashMenuVanillaUsage />}
    >
      <SlashMenuVanillaEditor />
    </DemoLayout>
  );
}
