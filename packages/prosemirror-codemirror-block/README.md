# prosemirror-codemirror-block

![alt text](https://gitlab.com/emergence-engineering/prosemirror-codemirror-block/-/raw/main/public/editorScreenshot.png)

Sponsored by [Skiff](https://www.skiff.org/) - a private, end-to-end encrypted, and decentralized workspace.

By [Viktor Váczi](https://emergence-engineering.com/cv/viktor) at [Emergence Engineering](https://emergence-engineering.com/)

Try it out at <https://emergence-engineering.com/blog/prosemirror-codemirror-block>

# Features

- CodeMirror 6 `code_block` in ProseMirror
- Customizable language selector
- Lazy-loaded language support
- Legacy ( CodeMirror 5 ) language support trough `@codemirror/legacy-modes`
- Custom themes

# How to use

```typescript
import { schema as BasicSchema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import {
  codeMirrorBlockPlugin,
  defaultSettings,
  languageLoaders,
  codeBlockKeymap,
  legacyLanguageLoaders,
  CodeBlockNodeName,
} from "prosemirror-codemirror-block";
import { undo, redo } from "prosemirror-history";
import { Schema } from "prosemirror-model";
import { keymap } from "prosemirror-keymap";

const codeBlockSpec = BasicSchema.spec.nodes.get(CodeBlockNodeName);

export const schema = new Schema({
  nodes: BasicSchema.spec.nodes.update(CodeBlockNodeName, {
    ...(codeBlockSpec || {}),
    attrs: { ...codeBlockSpec?.attrs, lang: { default: null } },
  }),
  marks: BasicSchema.spec.marks,
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
  ],
  type: "doc",
};

const state = EditorState.create({
  doc: schema.nodeFromJSON(codeBlockDoc),
  plugins: [
    ...exampleSetup({
      schema,
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
```

# Configuration

### CodeBlockSettings

Interface for the settings used by this plugin.

| name              | type                                                                                                                                                                    | description                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| createSelect      | (settings: CodeBlockSettings, dom: HTMLElement, node: ProseMirrorNode, view: EditorView, getPos: (() => number) &#124; boolean) => ()=> void)                           | Callback to create lanaguge selector. Returns function that is called when the NodeView is cleaned up. Has default.   |
| updateSelect      | (settings: CodeBlockSettings, dom: HTMLElement, node: ProseMirrorNode, view: EditorView, getPos: (() => number) &#124; boolean, oldNode: ProseMirrorNode) => ()=> void) | Called when the codeblock node is updated. Should update the select value to reflect the `lang` property of the node. |
| languageLoaders   | ?LanguageLoaders                                                                                                                                                        | Record of functions which return a code extension for a given language.                                               |
| languageNameMap   | ?Record<string, string>                                                                                                                                                 | Can be used to give aliases to languages in the selector.                                                             |
| languageWhitelist | ?string[]                                                                                                                                                               | List of used languages.                                                                                               |
| undo              | (state: EditorState, dispatch: (tr: Transaction) => void) => void                                                                                                       | Undo provided by `prosemirror-history`. YJS uses a different one!                                                     |
| redo              | (state: EditorState, dispatch: (tr: Transaction) => void) => void                                                                                                       | Redo provided by `prosemirror-history`. YJS uses a different one!                                                     |
| theme             | Extension[]                                                                                                                                                             | Insert codemirror theme here. Or any other extension you want!                                                        |
| stopEvent         | (e: Event) => boolean                                                                                                                                                   | Can be used to override stopEvent in NodeView. Can be used for custom drag handles for ex.                            |
| readOnly          | boolean                                                                                                                                                                 | Read only editor mode. Defaults to false                                                                              |
| themes            | Array<{ extension: Extension; name: string }>                                                                                                                           | Editor themes                                                                                                         |
| getCurrentTheme   | () => string                                                                                                                                                            | Sets the current theme when creating a new code block                                                                 |

### CSS & Styles

The following is a good starter style for the language selector:

```css
.codeblock-select {
  position: absolute;
  right: 0;
  z-index: 100;
  opacity: 0;
  transition: all 0.3s ease;
  margin: 6px 14px;
}
.codeblock-root {
  position: relative;
}

.codeblock-root:hover .codeblock-select {
  opacity: 1;
}
```

### Using and Customizing Themes

- create your own themes, or use one from `npm`

```ts
import { gruvboxDark } from "cm6-theme-gruvbox-dark";
import { basicLight } from "cm6-theme-basic-light";

const themes = [
  {
    extension: gruvboxDark,
    name: "Dark",
  },
  {
    extension: basicLight,
    name: "Light",
  },
];

export const CodeBlockExtension = Extension.create({
  name: "codeBlock",
  addProseMirrorPlugins: () => [
    codeMirrorBlockPlugin({
      ...defaultSettings,
      languageLoaders: { ...languageLoaders },
      undo,
      redo,
      // add themes
      themes,
      // tell the nodeView which theme should be used when adding a new code block
      getCurrentTheme: () => {
        const content = document.getElementById("html-root");
        return content?.classList.contains("darkMode") ? "Dark" : "Light";
      },
    }),
    keymap(codeBlockKeymap),
  ],
});
```

- use `updateTheme` to update the code blocks' theme

```ts
import { updateTheme } from "prosemirror-codemirror-block";

// const updateTheme: (theme: string) => void;
updateTheme("Dark")
```

### About us

Emergence Engineering is dev shop from the EU:
<https://emergence-engineering.com/>

We're looking for work, especially with ProseMirror ;)

Feel free to contact me at viktor.vaczi@emergence-engineering.com
