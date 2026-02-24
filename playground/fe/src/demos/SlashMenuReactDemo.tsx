import { useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { SlashMenuPlugin } from "prosemirror-slash-menu";
import {
  SlashMenuReact,
  defaultElements,
  defaultIcons,
} from "prosemirror-slash-menu-react";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/ee-prosemirror-tools/blob/main/playground/fe/src/demos/SlashMenuReactDemo.tsx";

export function SlashMenuReactDemo() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const slashPlugin = SlashMenuPlugin(defaultElements);

    const state = EditorState.create({
      schema,
      plugins: [slashPlugin, ...exampleSetup({ schema })],
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

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  return (
    <div>
      <div className="demo-header">
        <h1 className="demo-title">prosemirror-slash-menu-react</h1>
        <p className="demo-description">
          React slash menu component with Popper.js positioning. Type{" "}
          <code>/</code> in an empty paragraph to open the menu. Includes
          default menu elements, icons, and a submenu for headings.
        </p>
        <InstallCommand packageName="prosemirror-slash-menu-react" />
        <a
          className="source-link"
          href={SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          View source on GitHub
        </a>
      </div>

      <div className="demo-usage">
        <h3 className="demo-usage-title">How to use this demo</h3>
        <ul className="demo-usage-list">
          <li>
            <strong>Type <code>/</code></strong> in an empty paragraph to open
            the slash menu.
          </li>
          <li>
            <strong>Arrow keys</strong> to navigate between items. Use{" "}
            <strong>Right arrow</strong> to enter a submenu and{" "}
            <strong>Left arrow</strong> to go back.
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
      </div>

      <div className="card editor-card">
        <div ref={editorRef} />
        {editorState && viewRef.current && (
          <SlashMenuReact
            editorState={editorState}
            editorView={viewRef.current}
            icons={defaultIcons}
          />
        )}
      </div>
    </div>
  );
}
