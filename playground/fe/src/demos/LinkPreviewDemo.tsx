import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { ySyncPlugin, yUndoPlugin } from "y-prosemirror";
import {
  addPreviewNode,
  applyYjs,
  createDecorationsYjs,
  findPlaceholderYjs,
  previewPlugin,
} from "prosemirror-link-preview";
import "prosemirror-link-preview/dist/styles/styles.css";
import { DemoLayout } from "../components/DemoLayout";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:4000/hocuspocus";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const mySchema = new Schema({
  nodes: addPreviewNode(schema.spec.nodes),
  marks: schema.spec.marks,
});

async function fetchLinkPreview(link: string) {
  const res = await fetch(`${API_URL}/api/link-preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ link }),
  });
  const { data } = await res.json();
  return {
    url: data.url,
    title: data.title,
    description: data.description,
    images: data.images,
  };
}

function createEditorView(
  element: HTMLElement,
  yXmlFragment: Y.XmlFragment,
) {
  return new EditorView(element, {
    state: EditorState.create({
      doc: DOMParser.fromSchema(mySchema).parse(
        document.createElement("div"),
      ),
      plugins: [
        ...exampleSetup({ schema: mySchema }),
        ySyncPlugin(yXmlFragment),
        yUndoPlugin(),
        previewPlugin(
          fetchLinkPreview,
          applyYjs,
          createDecorationsYjs,
          findPlaceholderYjs,
          undefined,
          { openLinkOnClick: true, pasteLink: true },
        ),
      ],
    }),
  });
}

function CollaborativeEditor({ label }: { label: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (!editorRef.current) return;

    const ydoc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: WS_URL,
      name: "link-preview-demo",
      document: ydoc,
    });
    providerRef.current = provider;

    const yXmlFragment = ydoc.getXmlFragment("prosemirror");
    const view = createEditorView(editorRef.current, yXmlFragment);

    return () => {
      view.destroy();
      provider.destroy();
      providerRef.current = null;
    };
  }, []);

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

  return (
    <div className="card editor-card">
      <div className="card-header">
        <span className="card-label">{label}</span>
        <button
          type="button"
          onClick={toggleOnline}
          style={{
            padding: "4px 10px",
            fontSize: "0.8rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            cursor: "pointer",
            background: online ? "#e6ffe6" : "#ffe6e6",
          }}
        >
          {online ? "Online" : "Offline"}
        </button>
      </div>
      <div ref={editorRef} />
    </div>
  );
}

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/LinkPreviewDemo.tsx";

function LinkPreviewUsage() {
  return (
    <ul className="demo-usage-list">
      <li>
        <strong>Paste a URL</strong> (e.g.{" "}
        <code>https://github.com</code>) into either editor to trigger a
        link preview.
      </li>
      <li>
        <strong>Type in one editor</strong> and watch the other update in
        real time via Yjs collaboration.
      </li>
      <li>
        <strong>Toggle online/offline</strong> to disconnect an editor from
        the Hocuspocus server and reconnect later to see changes merge.
      </li>
    </ul>
  );
}

function LinkPreviewEditor() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <CollaborativeEditor label="Editor A" />
      <CollaborativeEditor label="Editor B" />
    </div>
  );
}

export function LinkPreviewDemo() {
  return (
    <DemoLayout
      title="prosemirror-link-preview"
      description={
        <>
          Paste a URL into either editor to see a rich link preview card appear.
          Both editors share a Yjs document via Hocuspocus — changes sync in
          real time.
        </>
      }
      packageNames={["prosemirror-link-preview"]}
      sourceUrl={SOURCE_URL}
      demoKey="linkPreview"
      usage={<LinkPreviewUsage />}
    >
      <LinkPreviewEditor />
    </DemoLayout>
  );
}
