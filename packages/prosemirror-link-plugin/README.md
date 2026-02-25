# prosemirror-link-plugin

![Link plugin screenshot](https://gitlab.com/emergence-engineering/prosemirror-link-plugin/-/raw/master/public/editorScreenshot.png)

By [Viktor Váczi](https://emergence-engineering.com/cv/viktor) at [Emergence Engineering](https://emergence-engineering.com/)

Try it out at <https://emergence-engineering.com/blog/prosemirror-link-plugin>

# Features

- Add decoration around words in a given list of aliases
- Update the aliases on the fly and see your decorations update
- Get notified when the user types or removes an alias from the document
- Do something with the decorations ( for example links that lead to a page about the alias )

# How to use 

Install with `npm install --save prosemirror-link-plugin`, then:

```typescript
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { Decoration } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
    autoLinkingPlugin,
    LinksKeyState,
} from "prosemirror-link-plugin";

export interface LinkSpec {
    id: number;
    alias: string;
}

export const aliasDecoration = (
    start: number,
    end: number,
    alias: string,
    matchPos: number,
    pluginState: LinksKeyState<LinkSpec>,
) => {
    const spec = pluginState.aliasToSpec[alias];
    return Decoration.inline(
        start,
        end,

        {
            class: "autoLink",
            onclick: `alert('You clicked on "${alias}"')`,
        },
        { id: spec?.id, alias },
    );
};

let aliases = { alias: "typing", id: 1 };

const initialDoc = {
    content: [
        {
            content: [
                {
                    text: "Start typing!",
                    type: "text",
                },
            ],
            type: "paragraph",
        },
    ],
    type: "doc",
};

const state = EditorState.create<typeof schema>({
    doc: schema.nodeFromJSON(initialDoc),
    plugins: [
        ...exampleSetup({
            schema,
        }),
        autoLinkingPlugin(
            aliases,
            aliasDecoration,
        ),
    ],
});

const view: EditorView = new EditorView(document.getElementById("editor"), {
    state,
});
```

## How to update the alias list

```typescript
const meta: LinksMeta<LinkSpec> = {
    type: LinksMetaType.linkUpdate,
    // aliases is the new list of alises
    specs: aliases,
};
view.dispatch(pmView.state.tr.setMeta(linksKey, meta));
```

# Configuration

### AutoLinkingPlugin
| name                  | type                                                 | description                                                                                                                   |
| --------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| aliasesWithSpec       | Array<SpecWithAlias<T>>                              | Initial list of aliases ( with additional properties )         |
| createAliasDecoration | CreateAliasDecoration    ( explained below )         | Used to create ProseMirror `Decoration` when an alias is found |
| onLinkAdd             | ( addedLinks: Array<SpecWithAlias<T>> ) => void      | Called when links are added                                    |
| onLinkRemove          | ( removedLinks: Array<SpecWithAlias<T>> ) => void    | Called when links are removed                                  |
| regexGenerator        | regexGenerator: ( aliases: string[] ) => RegExp      | Creates the regex used internally to find matches              |

### createAliasDecoration

| name                  | type             | description                       |
| --------------------- | ---------------- | --------------------------------- |
| start                 |  number          | Start position of the alias       |
| end                   | number           | End position of the alias         |
| alias                 | string           | Matched alias                     |
| matchPos              | number           | Distance from the non-text parent |
| pluginState           | LinksKeyState<T> | Current state of the plugin       |
| doc                   | Node             | ProseMirror doc Node              |

### Example CSS

```css
.autoLink {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    background-color: lightblue;
    color: black;
    border: 1px solid blueviolet;
    width: fit-content;
    height: 1.4rem;
    padding: 3px 5px 3px 5px;
    border-radius: 5px;
    margin-left: 3px;
    margin-right: 3px;
    cursor: pointer;
  }
```

## Development

### Running & linking locally
1. install plugin dependencies: `npm install`
2. install peer dependencies: `npm run install-peers`
3. link local lib: `npm run link`
4. link the package from the project you want to use it:  `npm run link prosemirror-link-plugin`


### About us

Emergence Engineering is dev shop from the EU:
<https://emergence-engineering.com/>

We're looking for work, especially with ProseMirror ;)

Feel free to contact me at
<viktor.vaczi@emergence-engineering.com>
