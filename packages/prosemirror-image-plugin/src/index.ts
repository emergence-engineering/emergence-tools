import { defaultSettings } from "./defaults";
import imagePlugin from "./plugin/index";

import {
  imageAlign,
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
  ImageUploadReturn,
  fetchImageAsBase64,
  Store,
  localStorageCache,
  imageCache,
} from "./utils";

export {
  updateImageNode,
  imageAlign,
  ImagePluginSettings,
  RemoveImagePlaceholder,
  InsertImagePlaceholder,
  ImagePluginAction,
  ImagePluginState,
  imagePlugin,
  startImageUpload,
  startImageUploadFn,
  ImageUploadReturn,
  defaultSettings,
  imagePluginKey,
  fetchImageAsBase64,
  Store,
  localStorageCache,
  imageCache,
};
