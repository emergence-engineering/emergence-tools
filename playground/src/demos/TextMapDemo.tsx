import { useCallback, useEffect, useRef, useState } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView, Decoration, DecorationSet } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  docToTextWithMapping,
  textPosToDocPos,
  TextMappingItem,
} from "@emergence-engineering/prosemirror-text-map";
import { InstallCommand } from "../components/InstallCommand";

function createInitialDoc(): Node {
  const { nodes, marks } = schema;
  const strong = marks.strong.create();
  const em = marks.em.create();
  const code = marks.code.create();

  return nodes.doc.create(null, [
    nodes.heading.create({ level: 2 }, [schema.text("Text Mapping Demo")]),
    nodes.paragraph.create(null, [
      schema.text("This editor shows how "),
      schema.text("prosemirror-text-map", [strong]),
      schema.text(" converts a "),
      schema.text("rich document", [em]),
      schema.text(" into plain text while tracking position mappings."),
    ]),
    nodes.heading.create({ level: 3 }, [schema.text("How it works")]),
    nodes.paragraph.create(null, [
      schema.text("The plugin walks through every block and inline node. "),
      schema.text("Bold", [strong]),
      schema.text(", "),
      schema.text("italic", [em]),
      schema.text(", and "),
      schema.text("code", [code]),
      schema.text(
        " marks are invisible in the plain text output — only the text content is extracted.",
      ),
    ]),
    nodes.blockquote.create(null, [
      nodes.paragraph.create(null, [
        schema.text(
          "Blockquotes are treated as regular blocks. Each block is separated by a newline in the output.",
        ),
      ]),
    ]),
    nodes.paragraph.create(null, [
      schema.text("Try editing this content and watch the "),
      schema.text("Extracted Text", [strong]),
      schema.text(" and "),
      schema.text("Position Mapping", [strong]),
      schema.text(" panels update in real time."),
    ]),
  ]);
}

/** Reverse of textPosToDocPos: given a doc position, find the corresponding text position. */
function docPosToTextPos(
  docPos: number,
  mapping: TextMappingItem[],
): number {
  for (let i = mapping.length - 1; i >= 0; i--) {
    if (docPos >= mapping[i].docPos) {
      return mapping[i].textPos + (docPos - mapping[i].docPos);
    }
  }
  return 0;
}

const SOURCE_URL =
  "https://github.com/emergence-engineering/ee-prosemirror-tools/blob/main/playground/src/demos/TextMapDemo.tsx";

export function TextMapDemo() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const extractedTextRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [mapping, setMapping] = useState<TextMappingItem[]>([]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [textSelection, setTextSelection] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [editorSelection, setEditorSelection] = useState<{
    from: number;
    to: number;
  } | null>(null);

  const updateMapping = (doc: EditorState["doc"]) => {
    const result = docToTextWithMapping(doc);
    setText(result.text);
    setMapping(result.mapping);
  };

  // Compute the highlight range for the editor based on hovered row or text selection
  const getDocHighlight = useCallback(():
    | { from: number; to: number }
    | undefined => {
    if (textSelection) {
      const from = textPosToDocPos(textSelection.from, mapping);
      const to = textPosToDocPos(textSelection.to, mapping);
      return { from, to };
    }
    if (hoveredRow !== null && mapping.length > 0) {
      const from = mapping[hoveredRow].docPos;
      const to =
        hoveredRow + 1 < mapping.length
          ? mapping[hoveredRow + 1].docPos
          : viewRef.current
            ? viewRef.current.state.doc.content.size
            : from;
      return { from, to };
    }
    return undefined;
  }, [hoveredRow, textSelection, mapping]);

  // Compute the text highlight range based on hovered row or editor selection
  const getTextHighlight = useCallback(():
    | { from: number; to: number }
    | undefined => {
    if (editorSelection && mapping.length > 0) {
      const from = docPosToTextPos(editorSelection.from, mapping);
      const to = docPosToTextPos(editorSelection.to, mapping);
      if (from !== to) return { from, to };
    }
    if (hoveredRow !== null && mapping.length > 0) {
      const from = mapping[hoveredRow].textPos;
      const to =
        hoveredRow + 1 < mapping.length
          ? mapping[hoveredRow + 1].textPos
          : text.length;
      return { from, to };
    }
    return undefined;
  }, [editorSelection, hoveredRow, mapping, text.length]);

  // Apply decorations to the editor whenever highlight changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const range = getDocHighlight();
    view.setProps({
      decorations: (state) => {
        if (!range || range.from === range.to) return DecorationSet.empty;
        const clampedTo = Math.min(range.to, state.doc.content.size);
        return DecorationSet.create(state.doc, [
          Decoration.inline(range.from, clampedTo, {
            class: "highlight-mark",
          }),
        ]);
      },
    });
  }, [getDocHighlight]);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: createInitialDoc(),
      plugins: exampleSetup({ schema }),
    });

    viewRef.current = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(tr: Transaction) {
        const newState = viewRef.current!.state.apply(tr);
        viewRef.current!.updateState(newState);
        if (tr.docChanged) {
          updateMapping(newState.doc);
        }
        const { from, to } = newState.selection;
        if (from !== to) {
          setEditorSelection({ from, to });
        } else {
          setEditorSelection(null);
        }
      },
    });

    updateMapping(state.doc);

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  /** Convert a character offset within extractedTextRef into a text position. */
  const getTextOffsetFromSelection = (
    container: HTMLElement,
    node: globalThis.Node,
    offset: number,
  ): number => {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
    );
    let pos = 0;
    while (walker.nextNode()) {
      if (walker.currentNode === node) {
        return pos + offset;
      }
      pos += (walker.currentNode as Text).length;
    }
    return pos;
  };

  const handleExtractedTextMouseUp = () => {
    const container = extractedTextRef.current;
    if (!container || mapping.length === 0) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.anchorNode || !sel.focusNode) {
      setTextSelection(null);
      return;
    }
    if (
      !container.contains(sel.anchorNode) ||
      !container.contains(sel.focusNode)
    ) {
      setTextSelection(null);
      return;
    }
    const start = getTextOffsetFromSelection(
      container,
      sel.anchorNode,
      sel.anchorOffset,
    );
    const end = getTextOffsetFromSelection(
      container,
      sel.focusNode,
      sel.focusOffset,
    );
    const from = Math.min(start, end);
    const to = Math.max(start, end);
    if (from !== to) {
      setTextSelection({ from, to });
    } else {
      setTextSelection(null);
    }
  };

  // Render extracted text with optional <mark> highlight
  const textHighlight = getTextHighlight();
  const renderExtractedText = () => {
    const displayText = text || "(empty document)";
    if (!text) {
      return <span className="output-text-empty">{displayText}</span>;
    }
    // Don't render <mark> when user is selecting within the extracted text
    // (their native selection is visible)
    if (textHighlight && !textSelection) {
      const { from, to } = textHighlight;
      const clampedFrom = Math.max(0, Math.min(from, text.length));
      const clampedTo = Math.max(clampedFrom, Math.min(to, text.length));
      return (
        <>
          {text.slice(0, clampedFrom)}
          <mark className="highlight-mark-text">{text.slice(clampedFrom, clampedTo)}</mark>
          {text.slice(clampedTo)}
        </>
      );
    }
    return displayText;
  };

  return (
    <div>
      <div className="demo-header">
        <h1 className="demo-title">prosemirror-text-map</h1>
        <p className="demo-description">
          Converts a ProseMirror document to plain text with position mapping.
          Useful for integrating with text-only libraries (diffing, NLP,
          search).
        </p>
        <InstallCommand packageName="@emergence-engineering/prosemirror-text-map" />
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
            <strong>Select text in the editor</strong> to see the corresponding
            range highlighted in the extracted text panel.
          </li>
          <li>
            <strong>Select text in the extracted text panel</strong> to see the
            corresponding range highlighted in the editor.
          </li>
          <li>
            <strong>Hover a row</strong> in the position mapping table to
            highlight the range it represents in both the editor and the
            extracted text.
          </li>
          <li>
            <strong>Edit the document</strong> and watch all panels update in
            real time.
          </li>
        </ul>
      </div>

      <div className="card editor-card">
        <div className="card-header">
          <span className="card-label">Editor</span>
          <span className="card-hint">
            Select text to highlight in extracted text
          </span>
        </div>
        <div ref={editorRef} />
      </div>

      <div className="output-grid">
        <div className="output-panel">
          <div className="output-panel-header">
            <span className="output-panel-label">Extracted Text</span>
            <span className="output-panel-hint">
              Select text to highlight in editor
            </span>
          </div>
          <div className="output-panel-body">
            <div
              ref={extractedTextRef}
              className="extracted-text"
              onMouseUp={handleExtractedTextMouseUp}
            >
              {renderExtractedText()}
            </div>
          </div>
        </div>

        <div className="output-panel">
          <div className="output-panel-header">
            <span className="output-panel-label">Position Mapping</span>
            <span className="output-panel-hint">
              Hover a row to highlight range
            </span>
          </div>
          <div className="data-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Text Pos</th>
                  <th>Doc Pos</th>
                  <th>textPosToDocPos()</th>
                </tr>
              </thead>
              <tbody>
                {mapping.map((item, i) => (
                  <tr
                    key={i}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={hoveredRow === i ? "row-hovered" : ""}
                  >
                    <td>{item.textPos}</td>
                    <td>{item.docPos}</td>
                    <td>{textPosToDocPos(item.textPos, mapping)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}