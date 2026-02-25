import './style.css'

import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import {
  codeMirrorBlockPlugin,
  defaultSettings,
  languageLoaders,
  legacyLanguageLoaders, CodeBlockNodeName, toggleCodeBlock
} from "prosemirror-codemirror-block";
import { undo, redo } from "prosemirror-history";
import { Schema } from "prosemirror-model";
import { keymap } from "prosemirror-keymap";
import { applyDevTools } from "prosemirror-dev-toolkit";
import { codeBlockKeymap } from "../src/utils";
import { MenuItem } from "prosemirror-menu";


const codeBlockSpec = schema.spec.nodes.get(CodeBlockNodeName);

const s = new Schema({
  nodes: schema.spec.nodes.update(CodeBlockNodeName, {
    ...(codeBlockSpec || {}),
    attrs: { ...codeBlockSpec?.attrs, lang: { default: null } },
  }),
  marks: schema.spec.marks,
});

const codeBlockDoc = {
  content: [
    {
      content: [
        {
          text: "prosemirror-codemirror-block",
          type: "text",
        },
      ],
      type: "paragraph",
    },
    {
      content: [
        {
          text: "const jsFun = (arg) => {\n  console.log(arg); \n}",
          type: "text",
        },
      ],
      attrs: {
        lang: "javascript",
      },
      type: CodeBlockNodeName,
    },
    {
      content: [
        {
          text: "const jsFun = (arg) => {",
          type: "text",
        },
      ],
      type: "paragraph",
    },
    {
      content: [
        {
          text: "  console.log(arg);",
          type: "text",
        },
      ],
      type: "paragraph",
    },
    {
      content: [
        {
          text: "}",
          type: "text",
        },
      ],
      type: "paragraph",
    }
  ],
  type: "doc",
};

const toggleCodeBlockMenuItem = new MenuItem(
  {
    run: toggleCodeBlock,
    label: "CB",
    title: "CB",
  }
)

const state = EditorState.create({
  doc: s.nodeFromJSON(codeBlockDoc),
  plugins: [
    ...exampleSetup({
      schema: s,
      menuContent: [
        [toggleCodeBlockMenuItem]
      ]
    }),
    codeMirrorBlockPlugin({
      ...defaultSettings,
      languageLoaders: { ...languageLoaders, ...legacyLanguageLoaders },
      undo,
      redo,
    }),
    keymap(codeBlockKeymap),
  ],
});

const view: EditorView = new EditorView(document.getElementById("editor"), {
  state,
});

applyDevTools(view, {devToolsExpanded: true});

(window as any)._view = view