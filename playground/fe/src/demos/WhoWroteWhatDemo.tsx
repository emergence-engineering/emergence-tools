import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { ySyncPlugin, yUndoPlugin } from "y-prosemirror";
import {
  createWhoWroteWhatPlugin,
  setWhoWroteWhatVisibility,
  whoWroteWhatPluginKey,
} from "@emergence-engineering/prosemirror-who-wrote-what";
import { DemoLayout } from "../components/DemoLayout";

const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:4000/hocuspocus";

const USERS = ["Alice", "Bob", "Charlie", "Diana"];

function CollaborativeEditor({
  label,
  defaultUserId,
}: {
  label: string;
  defaultUserId: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const [visible, setVisible] = useState(true);
  const [online, setOnline] = useState(true);
  const [userId, setUserId] = useState(defaultUserId);

  useEffect(() => {
    if (!editorRef.current) return;

    const ydoc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: WS_URL,
      name: "who-wrote-what-demo",
      document: ydoc,
    });
    providerRef.current = provider;

    const yXmlFragment = ydoc.getXmlFragment("default");

    const view = new EditorView(editorRef.current, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(schema).parse(
          document.createElement("div"),
        ),
        plugins: [
          ...exampleSetup({ schema }),
          ySyncPlugin(yXmlFragment),
          yUndoPlugin(),
          createWhoWroteWhatPlugin({ userId }),
        ],
      }),
    });
    viewRef.current = view;
    setOnline(true);
    setVisible(true);

    return () => {
      view.destroy();
      provider.destroy();
      viewRef.current = null;
      providerRef.current = null;
    };
  }, [userId]);

  const toggleVisibility = () => {
    if (!viewRef.current) return;
    const pluginState = whoWroteWhatPluginKey.getState(viewRef.current.state);
    const next = !(pluginState?.visible ?? true);
    setWhoWroteWhatVisibility(viewRef.current, next);
    setVisible(next);
  };

  const toggleOnline = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) return;
    if (online) {
      provider.disconnect();
    } else {
      provider.connect();
    }
    setOnline(!online);
  }, [online]);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Changing userId triggers useEffect cleanup + re-init
    setUserId(e.target.value);
  };

  const buttonStyle = {
    padding: "4px 10px",
    fontSize: "0.8rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
    cursor: "pointer",
  };

  return (
    <div className="card editor-card">
      <div className="card-header">
        <span className="card-label">{label}</span>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <select
            value={userId}
            onChange={handleUserChange}
            style={{
              ...buttonStyle,
              background: "#fff",
              appearance: "auto",
            }}
          >
            {USERS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleOnline}
            style={{
              ...buttonStyle,
              background: online ? "#e6ffe6" : "#ffe6e6",
            }}
          >
            {online ? "Online" : "Offline"}
          </button>
          <button
            type="button"
            onClick={toggleVisibility}
            style={{
              ...buttonStyle,
              background: visible ? "#e6ffe6" : "#ffe6e6",
            }}
          >
            {visible ? "Highlights On" : "Highlights Off"}
          </button>
        </div>
      </div>
      <div ref={editorRef} />
    </div>
  );
}

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/WhoWroteWhatDemo.tsx";

function WhoWroteWhatUsage() {
  return (
    <ul className="demo-usage-list">
      <li>
        <strong>Type in either editor</strong> — each editor has a different
        user ID. Text you type is highlighted with that user's color.
      </li>
      <li>
        <strong>Switch user</strong> from the dropdown to disconnect, change
        identity, and reconnect — simulating a different collaborator.
      </li>
      <li>
        <strong>Toggle highlights</strong> to show or hide authorship
        decorations per editor.
      </li>
      <li>
        <strong>Toggle online/offline</strong> to disconnect an editor from
        the Hocuspocus server and reconnect later to see changes merge.
      </li>
    </ul>
  );
}

function WhoWroteWhatEditor() {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
    >
      <CollaborativeEditor label="Editor A" defaultUserId="Alice" />
      <CollaborativeEditor label="Editor B" defaultUserId="Bob" />
    </div>
  );
}

export function WhoWroteWhatDemo() {
  return (
    <DemoLayout
      title="prosemirror-who-wrote-what"
      description={
        <>
          Track text authorship in collaborative editors. Each user's text is
          highlighted with a unique color. Both editors share a Yjs document
          via Hocuspocus.
          <div style={{ fontSize: "0.85em", opacity: 0.85, marginTop: "0.75rem", marginBottom: "0.5rem" }}>
            Sponsored by{" "}
            <a href="https://lex.page" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
              <img src="https://lex.page/apple-touch-icon.png" alt="Lex" width="14" height="14" style={{ verticalAlign: "middle", marginRight: 3 }} />
              <strong>Lex</strong>
            </a>
            {" & "}
            <strong>Nathan Baschez</strong>
          </div>
        </>
      }
      packageNames={["@emergence-engineering/prosemirror-who-wrote-what"]}
      sourceUrl={SOURCE_URL}
      usage={<WhoWroteWhatUsage />}
      demoKey="whoWroteWhat"
    >
      <WhoWroteWhatEditor />
    </DemoLayout>
  );
}
