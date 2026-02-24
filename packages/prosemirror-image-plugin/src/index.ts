import { defaultSettings } from "./defaults";
import imagePlugin from "./plugin/index";

import {
  imageAlign,
} from "./types";

import type {
  ImagePluginSettings,
  RemoveImagePlaceholder,
  InsertImagePlaceholder,
  ImagePluginAction,
  ImagePluginState,
} from "./types";

import updateImageNode from "./updateImageNode";
import {
  startImageUpload,
  startImageUploadFn,
  imagePluginKey,
  fetchImageAsBase64,
  localStorageCache,
  imageCache,
} from "./utils";

import type {
  ImageUploadReturn,
  Store,
} from "./utils";

export {
  updateImageNode,
  imageAlign,
  imagePlugin,
  startImageUpload,
  startImageUploadFn,
  defaultSettings,
  imagePluginKey,
  fetchImageAsBase64,
  localStorageCache,
  imageCache,
};

export type {
  ImagePluginSettings,
  RemoveImagePlaceholder,
  InsertImagePlaceholder,
  ImagePluginAction,
  ImagePluginState,
  ImageUploadReturn,
  Store,
};
