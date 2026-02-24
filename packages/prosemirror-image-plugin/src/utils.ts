import { PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Node as PMNode, Schema } from "prosemirror-model";
import {
  imageAlign,
  ImagePluginSettings,
  ImagePluginState,
  InsertImagePlaceholder,
  RemoveImagePlaceholder,
} from "./types";

export const dataURIToFile = (dataURI: string, name: string) => {
  const arr = dataURI.split(",");
  const mime = arr[0]?.match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  // eslint-disable-next-line no-plusplus
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], name, { type: mime });
};

export const imagePluginKey = new PluginKey<ImagePluginState>("imagePlugin");

export type ImageUploadReturn = { url: string; alt?: string };

export const startImageUploadFn = (
  view: EditorView,
  uploadFile: () => Promise<ImageUploadReturn>,
  pos?: number
): Promise<ImageUploadReturn> => {
  // A fresh object to act as the ID for this upload
  const id = {};

  // Replace the selection with a placeholder
  const { tr } = view.state;
  const { schema } = view.state;
  const pluginSettings = view.state.plugins.find(
    (p) => p.spec.key === imagePluginKey
  )!.spec.settings as ImagePluginSettings;

  if (!tr.selection.empty && !pos) tr.deleteSelection();
  const imageMeta: InsertImagePlaceholder = {
    type: "add",
    pos: pos || tr.selection.from,
    id,
  };
  tr.setMeta(imagePluginKey, imageMeta);
  view.dispatch(tr);

  return uploadFile()
    .then((data) => {
      const { url, alt } = data;
      const placholderPos = pluginSettings.findPlaceholder(view.state, id);
      // If the content around the placeholder has been deleted, drop
      // the image
      if (placholderPos == null) return data;
      // Otherwise, insert it at the placeholder's position, and remove
      // the placeholder
      const removeMeta: RemoveImagePlaceholder = { type: "remove", id };
      view.dispatch(
        view.state.tr
          .insert(
            placholderPos,
            schema.nodes.image.create(
              { src: url, alt },
              pluginSettings.hasTitle
                ? schema.text(pluginSettings.defaultTitle)
                : undefined
            )
          )
          .setMeta(imagePluginKey, removeMeta)
      );
      return data;
    })
    .catch((reason) => {
      const removeMeta: RemoveImagePlaceholder = { type: "remove", id };
      // On failure, just clean up the placeholder
      view.dispatch(tr.setMeta(imagePluginKey, removeMeta));
      throw reason;
    });
};

export const startImageUpload = (
  view: EditorView,
  file: File,
  alt: string,
  pluginSettings: ImagePluginSettings,
  schema: Schema,
  pos?: number
) => {
  // A fresh object to act as the ID for this upload
  const id = {};

  // Replace the selection with a placeholder
  const { tr } = view.state;
  if (!tr.selection.empty && !pos) tr.deleteSelection();
  const imageMeta: InsertImagePlaceholder = {
    type: "add",
    pos: pos || tr.selection.from,
    id,
  };
  tr.setMeta(imagePluginKey, imageMeta);
  view.dispatch(tr);

  pluginSettings.uploadFile(file).then(
    (url) => {
      const placholderPos = pluginSettings.findPlaceholder(view.state, id);
      // If the content around the placeholder has been deleted, drop
      // the image
      if (placholderPos == null) return;
      // Otherwise, insert it at the placeholder's position, and remove
      // the placeholder
      const removeMeta: RemoveImagePlaceholder = { type: "remove", id };
      view.dispatch(
        view.state.tr
          .insert(
            placholderPos,
            schema.nodes.image.create(
              { src: url, alt },
              pluginSettings.hasTitle
                ? schema.text(pluginSettings.defaultTitle)
                : undefined
            )
          )
          .setMeta(imagePluginKey, removeMeta)
      );
    },
    () => {
      const removeMeta: RemoveImagePlaceholder = { type: "remove", id };
      // On failure, just clean up the placeholder
      view.dispatch(tr.setMeta(imagePluginKey, removeMeta));
    }
  );
};

export const generateChangeAlignment =
  (
    align: imageAlign,
    getPos: () => number | undefined,
    view: EditorView,
    node: PMNode
  ) =>
  () => {
    const pos = getPos() || 0;
    const t = view.state.tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      align,
    });
    view.dispatch(t);
  };

export const clamp = (min: number, value: number, max: number) =>
  Math.max(Math.min(max, value), min);

export const fetchImageAsBase64 = async (url: string) => {
  if (url.startsWith("data:image")) {
    return url;
  }
  return fetch(url)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
};

export interface Store {
  get: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
}

export const localStorageCache = (keyPrefix: string): Store => {
  const get = (key: string) => {
    const value = localStorage.getItem(`${keyPrefix}${key}`);
    if (value) {
      return value;
    }
    return undefined;
  };
  const set = (key: string, value: string) => {
    localStorage.setItem(`${keyPrefix}${key}`, value);
  };
  return { get, set };
};

export const imageCache =
  (cache: Store, shortStore: Map<string, Promise<string>> = new Map()) =>
  (downloadImage: (url: string) => Promise<string>) =>
  async (url: string) => {
    if (!url) {
      // null image or empty string
      return url;
    }
    if (url.startsWith("data:image")) {
      return url;
    }

    const cached = cache.get(url);
    if (cached) {
      return cached;
    }
    if (shortStore.has(url)) {
      return shortStore.get(url)!;
    }
    const resultPromise = downloadImage(url);
    shortStore.set(url, resultPromise);
    const result = await resultPromise;
    cache.set(url, result);
    shortStore.delete(url);
    return result;
  };
