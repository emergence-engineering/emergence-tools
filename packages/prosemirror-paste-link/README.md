# prosemirror-paste-link

ProseMirror plugin handling paste case when:
- the editor has selected text
- the pasted text is an URL

In that case a mark with the URL will be added to the selected
text, instead of overwriting the selection with the URL text.

# Usage
```typescript
import pasteLinkPlugin from "prosemirror-paste-link";
/*...*/
const state = EditorState.create<typeof imageSchema>({
    /*...*/
    plugins: [
        /*...*/
        pasteLink,
    ],
});
```