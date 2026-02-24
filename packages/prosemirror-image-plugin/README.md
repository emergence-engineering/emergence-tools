# prosemirror-image-plugin

![alt text](https://gitlab.com/emergence-engineering/prosemirror-image-plugin/-/raw/master/public/editorScreenshot.png)

By [Viktor Váczi](https://emergence-engineering.com/cv/viktor)
at [Emergence Engineering](https://emergence-engineering.com/)

Try it out at <https://emergence-engineering.com/blog/prosemirror-image-plugin>

# Features

- Drag and drop or paste images from anywhere
- Upload images to endpoints, showing placeholder until the upload finishes, and optionally delete
  images when the image is removed from the document
- Customizable overlay for alignment ( or whatever you think of! )
- Optional image title
- Image resizing with body resize listeners, so the image always fits the editor ( inspired by czi-prosemirror )
- Scaling images with editor size ( when resizing is enabled )
- Easy to implement image caching ( in downloadPlaceholder )

# How to use

```typescript
import {schema} from "prosemirror-schema-basic";
import {EditorState} from "prosemirror-state";
import {EditorView} from "prosemirror-view";
import {
    defaultSettings,
    updateImageNode,
    imagePlugin,
} from "prosemirror-image-plugin";

import "prosemirror-image-plugin/dist/styles/common.css";
import "prosemirror-image-plugin/dist/styles/withResize.css";
import "prosemirror-image-plugin/dist/styles/sideResize.css";

// Update your settings here!
const imageSettings = {...defaultSettings};

const imageSchema = new Schema({
    nodes: updateImageNode(schema.spec.nodes, {
        ...imageSettings,
    }),
    marks: schema.spec.marks,
});

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

const state = EditorState.create({
    doc: imageSchema.nodeFromJSON(initialDoc),
    plugins: [
        ...exampleSetup({
            schema: imageSchema,
        }),
        imagePlugin({...imageSettings}),
    ],
});

const view: EditorView = new EditorView(document.getElementById("editor"), {
    state,
});
```

# Configuration

### ImagePluginSettings

Interface for the settings used by this plugin.

| name                | type                                                                                                | description                                                                                                                                                                                            |
|---------------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| uploadFile          | (file: File) => Promise\<string>                                                                    | Uploads the image file to a remote server and returns the uploaded image URL. By default it returns the dataURI of the image.                                                                          |
| deleteSrc           | (src: string) => Promise\<void>                                                                     | Deletes the image from the server.                                                                                                                                                                     |
| hasTitle            | boolean                                                                                             | If set to `true` then the image has a title field. True by default. `isBlock` should be `true` if set.                                                                                                 |
| extraAttributes     | Record\<string, string &#124; null>                                                                 | Extra attributes on the new `image` node. By default is `defaultExtraAttributes`.                                                                                                                      |
| createOverlay       | ( node: PMNode, getPos: (() => number) &#124; boolean, view: EditorView) => Node &#124; undefined   | create an overlay DOM Node for the `image` node. The default is the one you see in the intro image.                                                                                                    |
| updateOverlay       | ( overlayRoot: Node, getPos: (() => number) &#124; boolean, view: EditorView, node: PMNode) => void | The function that runs whenever the `image` ProseMirror node changes to update the overlay.                                                                                                            |
| defaultTitle        | string                                                                                              | Default title on new images.                                                                                                                                                                           |
| defaultAlt          | string                                                                                              | Default alt on new images ( when it's not defined ).                                                                                                                                                   |
| downloadImage       | (url: string) => Promise\<string>                                                                   | Download image data with a callback function. Useful for images with behind auth.                                                                                                                      |
| downloadPlaceholder | (url: string, view: EditorView) => string &#124; {src?: string, className?: string}                 | If `downloadImage` is defined then this image is showed while the download is in progress. Caching can be done here if necessary. You can also apply a custom class while the download is in progress. |
| isBlock             | boolean                                                                                             | `true` if you want block images, `false` if you want inline ( ProseMirror default ). Titles are only possible with block images. Default `true`.                                                       |
| enableResize        | boolean                                                                                             | Enables resize features. Default `true`.                                                                                                                                                               |
| resizeCallback      | (el: Element, updateCallback: () => void) => () => void                                             | Creates & destroys resize listeners                                                                                                                                                                    |
| imageMargin         | number                                                                                              | Space in `px` on the side an image. Default 50.                                                                                                                                                        |
| minSize             | number                                                                                              | Minimum size in `px` of an image. Default 50.                                                                                                                                                          |
| maxSize             | number                                                                                              | Maximum size in `px` of an image. Default 2000.                                                                                                                                                        |
| scaleImage          | boolean                                                                                             | If `true` then images scale proportionally with editor width. Default `true`.                                                                                                                          |
| createDecorations   | (state: EditorState) => DecorationSet                                                               | Generate decorations from plugin state. Needed with YJS.                                                                                                                                               |
| createState         | (pluginSettings: ImagePluginSetting) => StateField                                                  | Handle editor state differently. Needed with YJS.                                                                                                                                                      |

### updateImageNode

Returns the updated nodes ( `Schema["spec"]["nodes"] type` )

Arguments:

| index | name           | type                      | description                                              |
|-------|----------------|---------------------------|----------------------------------------------------------|
| 1     | nodes          | Schema ["spec"] ["nodes"] | nodes from the to-be-updated Schema spec                 |
| 2     | pluginSettings | ImagePluginSettings       | same plugin settings the plugin will be initialized with |

### startImageUpload

Dispatches a transaction in the editor view which starts the image upload process ( and places placeholder etc ).
Returns `undefined`

Arguments:

| index | name           | type                | description                                          |
|-------|----------------|---------------------|------------------------------------------------------|
| 1     | view           | EditorView          | Reference of the mounted editor view                 |
| 2     | file           | File                | image file to be uploaded                            |
| 3     | alt            | string              | alt of the file ( file.name usually works )          |
| 4     | pluginSettings | ImagePluginSettings | same plugin settings the plugin was initialized with |
| 5     | schema         | Schema              | updated schema used by the editor                    |
| 6     | pos            | number              | insert position in the document                      |

### startImageUploadFn
Dispatches a transaction in the editor view which starts the image upload process ( and places placeholder etc ).
Returns `Promise<ImageUploadReturn>` (as the uploadFile function you gave in but after the editor transformations)

Type helper; `type ImageUploadReturn = { url: string; alt?: string };`

Arguments:

| index | name       | type                             | description                                                      |
|-------|------------|----------------------------------|------------------------------------------------------------------| 
| 1     | view       | EditorView                       | Reference of the mounted editor view                             |
| 2     | uploadFile | () => Promise<ImageUploadReturn> | An async function which returns the uploaded image src (and alt) |
| 3     | pos        | number?                          | insert position in the document (defaults to start of selection) |

Example call;
```typescript
const myImgUploadFn = (imgUrl: string) => async () => {
    const file = await getFileFromtheInternet(imgUrl);
    const src = await uploadFileToOurServer(file);
    return { url: src, alt: file.name };
};
await startImageUploadFn(editor, myImgUploadFn(inputUrl));
```

### Uploading files

Be aware that the default `uploadFile` inserts the dataURI of the image directly into the
ProseMirror document. That can cause issues with large files, for ex. `gif`s with long animations.

### Upload placeholder

The plugin creates a widget decoration while the upload process is still in progress. The widget decoration's
dom node is a `<placeholder>`, an example style could be:

```css
placeholder {
    color: #ccc;
    position: relative;
    top: 6px;
}

placeholder:after {
    content: "☁";
    font-size: 200%;
    line-height: 0.1;
    font-weight: bold;
}
```

### Loading image css

It is not really trivial how can you use css while you have a broken image src. 
To get some dirty ideas please check the `dev/src/index.css` file in the repo 
and try to understand the `placeholderClassName` rules.

Test your solution in all browsers! 

Firefox and Safari not showing the broken image icon, 
Chrome and Firefox handles the `::after` hack properly, Safari not. 
So you need to use a platform specific css hack to handle all!

### Loading images the custom way

If you have an image behind authentication, 
or even you just want to show the loading indicator, you need to set the `downloadImage` function.
You can add a `string => Promise<string>` function to the plugin settings, 
BUT you want that returning string to be a base64 encoded image. The reason you want to do that, is because
if you add a simple image url, your browser will try to load that image "again" without the auth, 
and without the custom load indicator.

We have a helper function which just fetches the given url and transforms it to base64. 
(Useful if you want to use the loading indicator.)
```typescript
import {fetchImageAsBase64} from "prosemirror-image-plugin";

const imageSettings = {...defaultSettings, downloadImage: fetchImageAsBase64};
```

### Cache images and drag & drop

Sometimes you want to modify the editor state as a way that the images want to rerender. 
Drag and drop is a good example.
Usually we don't want to redownload the images. 
If we have good caching settings at the backend we will not move all the data again, but still...
We have some helpers to help you with that.

```typescript
import {fetchImageAsBase64, imageCache, localStorageCache} from "prosemirror-image-plugin";

const inMemoryCachedDownloadImage = imageCache(
        new Map() // <- this map will be used as a cache, you can move it to a global variable
    )((url) => fetchImageAsBase64(url));
const localStorageCachedDownloadImage = imageCache(
        localStorageCache("img_cache_")
    )((url) => fetchImageAsBase64(url));

const imageSettings = {...defaultSettings, downloadImage: inMemoryCachedDownloadImage};
```

`imageCache` is a function which takes a long and a short-lived cache, and a download function 
(and returns with a more complex download function).
- The long-lived cache needs to have a `get(string)=>string|undifined` and a `set(string,string)` function 
(which Maps happened to have).
- The short-lived cache defaults to a `Map<string, Promise<string>>`, we use this to cache the promises only, 
if you have the same image multiple times in your editor state.
- The download function is a `string => Promise<string>` function, which returns the base64 encoded image (see above).

### Uploading images from a file picker

A small React example

In the "html" / JSX part:

```typescript jsx
<input type="file" id="imageselector" onChange={onInputChange}/>
```

The `onInputChange` callback:

```typescript
const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
        if (
            pmView?.state.selection.$from.parent.inlineContent &&
            e.target.files?.length
        ) {
            const file = e.target.files[0];
            startImageUpload(
                pmView,
                file,
                file.name,
                defaultSettings,
                imageSchema,
                pmView.state.selection.from
            );
        }
    },
    [pmView]
);
```

### CSS & Styles

The following styles are in the bundle:

```typescript
import "prosemirror-image-plugin/dist/styles/common.css";
import "prosemirror-image-plugin/dist/styles/withResize.css";
import "prosemirror-image-plugin/dist/styles/sideResize.css";
import "prosemirror-image-plugin/dist/styles/withoutResize.css";
```

### YJS compatibility

- BREAKING CHANGE: works with yjs collab out of the box, we have a custom mapping which deals with yjs replacing the
  whole document on external changes, so no worries about lost decorations

## Known issues

- titles and inline nodes do not work well together. If `hasTitle` is true then
  `isBlock` should also be true.

## Development

### Running & linking locally

1. install plugin dependencies: `npm install`
2. install peer dependencies: `npm run install-peers`
3. link local lib: `npm run link`
4. link the package from the project you want to use it: `npm run link prosemirror-image-plugin`

### About us

Emergence Engineering is dev shop from the EU:
<https://emergence-engineering.com/>

We're looking for work, especially with ProseMirror ;)

Feel free to contact me at
<viktor.vaczi@emergence-engineering.com>
