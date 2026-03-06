import { useEffect, useRef, useState } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, Node } from "prosemirror-model";

import { schema as basicSchema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  autoLinkingPlugin,
  linksKey,
  defaultAliasDecoration,
  LinksMetaType,
} from "prosemirror-link-plugin";
import { DemoLayout } from "../components/DemoLayout";
import { linkTooltipPlugin } from "../components/linkTooltipPlugin";

const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

interface AliasSpec {
  alias: string;
  url: string;
}

const INITIAL_ALIASES: AliasSpec[] = [
  { alias: "ProseMirror", url: "https://prosemirror.net" },
  { alias: "Emergence Engineering", url: "https://emergence-engineering.com" },
  { alias: "TypeScript", url: "https://www.typescriptlang.org" },
];

function createInitialDoc(): Node {
  const { nodes } = schema;
  return nodes.doc.create(null, [
    nodes.heading.create({ level: 2 }, [schema.text("Link Plugin Demo")]),
    nodes.paragraph.create(null, [
      schema.text(
        "This editor uses the link plugin to automatically highlight aliases. " +
          "Words like ProseMirror, TypeScript, and Emergence Engineering are " +
          "detected and decorated wherever they appear in the document.",
      ),
    ]),
    nodes.heading.create({ level: 3 }, [schema.text("Try it out")]),
    nodes.paragraph.create(null, [
      schema.text(
        "Type one of the aliases listed in the panel on the right, or add a new " +
          "alias using the input below. You can also remove aliases and watch " +
          "the decorations update in real time.",
      ),
    ]),
    nodes.paragraph.create(null, [
      schema.text(
        "The plugin supports dynamic updates — aliases can be added or removed " +
          "at any time via transactions, and the decorations are recalculated " +
          "only in the affected range for performance.",
      ),
    ]),
  ]);
}

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/LinkPluginDemo.tsx";

function LinkPluginUsage() {
  return (
    <ul className="demo-usage-list">
      <li>
        Words matching the <strong>active aliases</strong> are automatically
        highlighted in the editor.
      </li>
      <li>
        <strong>Add or remove aliases</strong> using the controls below the
        editor — decorations update in real time.
      </li>
      <li>
        <strong>Type an alias</strong> into the editor to see it get
        decorated on the fly.
      </li>
      <li>
        <strong>Click on a decorated alias</strong> to see a tooltip with
        the alias name and a link to open its URL.
      </li>
    </ul>
  );
}

function LinkPluginContent() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [aliases, setAliases] = useState<AliasSpec[]>(INITIAL_ALIASES);
  const [newAlias, setNewAlias] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const aliasesRef = useRef(aliases);
  aliasesRef.current = aliases;

  useEffect(() => {
    if (!editorRef.current) return;

    const plugin = autoLinkingPlugin<AliasSpec>(
      INITIAL_ALIASES,
      defaultAliasDecoration,
    );

    const state = EditorState.create({
      doc: createInitialDoc(),
      plugins: [
        ...exampleSetup({ schema }),
        plugin,
        linkTooltipPlugin((state, from) => {
          const pluginState = linksKey.getState(state);
          if (!pluginState) return undefined;
          const decos = pluginState.decorations.find(from, from);
          if (!decos.length) return undefined;
          const spec = decos[0].spec as AliasSpec;
          return spec.url && spec.url !== "#" ? spec.url : undefined;
        }),
      ],
    });

    viewRef.current = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(tr: Transaction) {
        const newState = viewRef.current!.state.apply(tr);
        viewRef.current!.updateState(newState);
      },
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  function updateAliases(next: AliasSpec[]) {
    setAliases(next);
    if (!viewRef.current) return;
    const tr = viewRef.current.state.tr.setMeta(linksKey, {
      type: LinksMetaType.linkUpdate,
      specs: next,
    });
    viewRef.current.dispatch(tr);
  }

  function handleAdd() {
    const trimmed = newAlias.trim();
    if (!trimmed) return;
    if (aliasesRef.current.some((a) => a.alias === trimmed)) return;
    const next = [
      ...aliasesRef.current,
      { alias: trimmed, url: newUrl.trim() || "#" },
    ];
    updateAliases(next);
    setNewAlias("");
    setNewUrl("");
  }

  function handleRemove(alias: string) {
    const next = aliasesRef.current.filter((a) => a.alias !== alias);
    updateAliases(next);
  }

  return (
    <>
      <div className="card editor-card">
        <div className="card-header">
          <span className="card-label">Editor</span>
          <span className="card-hint">
            Matching aliases are highlighted automatically
          </span>
        </div>
        <div ref={editorRef} style={{ position: "relative" }} />
      </div>

      <div className="card" style={{ marginTop: "1rem", padding: "1rem" }}>
        <h3 style={{ margin: "0 0 0.75rem" }}>Active Aliases</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
          {aliases.map((a) => (
            <span
              key={a.alias}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "4px",
                background: "#e8f0fe",
                border: "1px solid #c5d7f2",
                fontSize: "0.85rem",
              }}
            >
              {a.alias}
              <button
                onClick={() => handleRemove(a.alias)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "1rem",
                  lineHeight: 1,
                  color: "#888",
                }}
                title="Remove alias"
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Alias text"
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{ padding: "0.35rem 0.5rem", borderRadius: "4px", border: "1px solid #ccc", flex: 1 }}
          />
          <input
            type="text"
            placeholder="URL (optional)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{ padding: "0.35rem 0.5rem", borderRadius: "4px", border: "1px solid #ccc", flex: 1 }}
          />
          <button
            onClick={handleAdd}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
      </div>

      <style>{`
        .autoLink {
          background: #e8f0fe;
          border: 1px solid #c5d7f2;
          border-radius: 3px;
          padding: 0 2px;
        }
      `}</style>
    </>
  );
}

export function LinkPluginDemo() {
  return (
    <DemoLayout
      title="prosemirror-link-plugin"
      description={
        <>
          Automatically decorates words matching a configurable alias list.
          Useful for auto-linking terms to wiki pages, glossary entries, or any
          other resource. Aliases can be updated dynamically, and decorations
          are recalculated efficiently.
        </>
      }
      packageNames={["prosemirror-link-plugin"]}
      sourceUrl={SOURCE_URL}
      demoKey="linkPlugin"
      usage={<LinkPluginUsage />}
    >
      <LinkPluginContent />
    </DemoLayout>
  );
}
