import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { applyDevTools } from "prosemirror-dev-toolkit";
import {
  defaultSettings,
  updateImageNode,
  imagePlugin,
} from "prosemirror-image-plugin";

import "prosemirror-image-plugin/dist/styles/common.css";
import "prosemirror-image-plugin/dist/styles/withResize.css";
import "prosemirror-image-plugin/dist/styles/sideResize.css";

import styled from "styled-components";
import { Schema } from "prosemirror-model";

const Root = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const StyledEditor = styled.div`
  width: 80%;
  margin-bottom: 0.625rem;
`;

export const initialDoc = {
  content: [
    {
      content: [
        {
          text: "What day of the wek iss it?",
          type: "text",
        },
      ],
      type: "paragraph",
    },
  ],
  type: "doc",
};

const imageSettings = { ...defaultSettings, ...{} };

const imageSchema = new Schema({
  nodes: updateImageNode(schema.spec.nodes, {
    ...imageSettings,
  }),
  marks: schema.spec.marks,
});

export const ProsemirrorEditor = () => {
  const [editorState, setEditorState] = useState<EditorState>();
  const [editorView, setEditorView] = useState<EditorView>();
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const state = EditorState.create({
      doc: imageSchema.nodeFromJSON(initialDoc),
      plugins: [
        ...exampleSetup({
          schema: imageSchema,
        }),
        imagePlugin({ ...imageSettings }),
      ],
    });
    const view = new EditorView(document.querySelector("#editor"), {
      state,
      dispatchTransaction: (tr) => {
        try {
          const newState = view.state.apply(tr);
          view.updateState(newState);
          setEditorState(newState);
        } catch (e) {}
      },
    });
    setEditorView(view);
    setEditorState(view.state);
    applyDevTools(view);
    return () => {
      view.destroy();
    };
  }, [editorRef]);

  return (
    <Root>
      <StyledEditor id="editor" ref={editorRef} />
    </Root>
  );
};
