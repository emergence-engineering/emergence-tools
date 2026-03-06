import { useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  defaultSettings,
  updateImageNode,
  imagePlugin,
  startImageUploadFn,
  ImagePluginSettings,
} from "prosemirror-image-plugin";

import "prosemirror-image-plugin/dist/styles/common.css";
import "prosemirror-image-plugin/dist/styles/withResize.css";
import "prosemirror-image-plugin/dist/styles/sideResize.css";

import { DemoLayout } from "../components/DemoLayout";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/ImagePluginDemo.tsx";

const initialDoc = {
  content: [
    {
      content: [
        {
          text: "Try dragging & dropping or pasting an image into this editor.",
          type: "text",
        },
      ],
      type: "paragraph",
    },
  ],
  type: "doc",
};

const buttonStyle: React.CSSProperties = {
  padding: "6px 14px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 500,
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--surface)",
  color: "var(--text)",
  transition: "all var(--transition)",
};

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "var(--accent-soft)",
  borderColor: "var(--accent)",
  color: "var(--accent)",
  fontWeight: 600,
};

// --- Normal mode editor ---

function NormalEditor() {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const imageSettings = { ...defaultSettings };
    const imageSchema = new Schema({
      nodes: updateImageNode(schema.spec.nodes, imageSettings),
      marks: schema.spec.marks,
    });

    const state = EditorState.create({
      doc: imageSchema.nodeFromJSON(initialDoc),
      plugins: [
        ...exampleSetup({ schema: imageSchema }),
        imagePlugin(imageSettings),
      ],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction: (tr) => {
        try {
          const newState = view.state.apply(tr);
          view.updateState(newState);
        } catch (e) {
          // ignore
        }
      },
    });

    return () => {
      view.destroy();
    };
  }, []);

  return (
    <div className="card editor-card">
      <div className="card-header">
        <span className="card-label">Normal Mode</span>
      </div>
      <div ref={editorRef} />
    </div>
  );
}

// --- Infinite Load mode editor ---

// Direct image URL (no redirects) to avoid CORS/redirect issues
const imgUrl = "https://picsum.photos/400/300";

function toDataURL(url: string): Promise<string> {
  if (url.startsWith("data:")) return Promise.resolve(url);
  return fetch(url)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }),
    );
}

function InfiniteLoadEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const uploadResolversRef = useRef<((s: string) => void)[]>([]);

  useEffect(() => {
    if (!editorRef.current) return;

    const imageSettings: ImagePluginSettings = {
      ...defaultSettings,
      // No download gate — just fetch the image directly once the node exists.
      // The deferred behavior is demonstrated by the upload gate alone.
      downloadImage: (url: string) => toDataURL(url),
      downloadPlaceholder: () => ({
        className: "placeholderClassName",
      }),
    };

    const imageSchema = new Schema({
      nodes: updateImageNode(schema.spec.nodes, imageSettings),
      marks: schema.spec.marks,
    });

    const state = EditorState.create({
      doc: imageSchema.nodeFromJSON({ type: "doc", content: [] }),
      plugins: [
        ...exampleSetup({ schema: imageSchema }),
        imagePlugin(imageSettings),
      ],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction: (tr) => {
        try {
          const newState = view.state.apply(tr);
          view.updateState(newState);
        } catch (e) {
          // ignore
        }
      },
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
      uploadResolversRef.current = [];
    };
  }, []);

  return (
    <div className="card editor-card">
      <div className="card-header">
        <span className="card-label">Infinite Load Mode</span>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 1rem" }}>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            const view = viewRef.current;
            if (!view) return;
            // Upload callback: waits for gate, then returns {url, alt}
            startImageUploadFn(view, () => {
              return new Promise<string>((resolve) => {
                uploadResolversRef.current.push(resolve);
              }).then(() => ({
                url: imgUrl,
                alt: "Demo image",
              }));
            });
          }}
        >
          Add image
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            uploadResolversRef.current.forEach((r) => r("go"));
            uploadResolversRef.current = [];
          }}
        >
          Resolve All Image
        </button>
      </div>
      <div ref={editorRef} />
    </div>
  );
}

// --- Usage and Content components ---

function ImagePluginUsage() {
  return (
    <ul className="demo-usage-list">
      <li>
        <strong>Normal mode:</strong> Drag &amp; drop or paste an image into
        the editor. Resize and align using the handles.
      </li>
      <li>
        <strong>Infinite Load mode:</strong> Click &quot;Add image&quot; to
        insert an image with a deferred download. Click &quot;Resolve All
        Image&quot; to resolve pending downloads and load images.
      </li>
    </ul>
  );
}

type Mode = "normal" | "infiniteLoad";

function ImagePluginContent() {
  const [mode, setMode] = useState<Mode>("normal");

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          style={mode === "normal" ? activeButtonStyle : buttonStyle}
          onClick={() => setMode("normal")}
        >
          Normal
        </button>
        <button
          type="button"
          style={mode === "infiniteLoad" ? activeButtonStyle : buttonStyle}
          onClick={() => setMode("infiniteLoad")}
        >
          Infinite Load
        </button>
      </div>

      {mode === "normal" ? (
        <NormalEditor key="normal" />
      ) : (
        <InfiniteLoadEditor key="infiniteLoad" />
      )}
    </>
  );
}

// --- Main demo component ---

export function ImagePluginDemo() {
  return (
    <DemoLayout
      title="prosemirror-image-plugin"
      description={
        <>
          A ProseMirror plugin for advanced image handling — drag &amp; drop,
          paste, resize, align, and lazy loading with placeholders.
        </>
      }
      packageNames={["prosemirror-image-plugin"]}
      sourceUrl={SOURCE_URL}
      demoKey="imagePlugin"
      usage={<ImagePluginUsage />}
    >
      <ImagePluginContent />
    </DemoLayout>
  );
}
