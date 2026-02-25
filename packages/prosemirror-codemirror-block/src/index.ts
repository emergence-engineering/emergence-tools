import { Plugin, PluginKey } from "prosemirror-state";

import { CodeBlockSettings, LanguageLoaders } from "./types";
import { codeMirrorBlockNodeView } from "./codeMirrorBlockNodeView";
import {
  CodeBlockNodeName,
  codeBlockArrowHandlers,
  createCodeBlock,
  removeCodeBlock,
  toggleCodeBlock,
  codeBlockToggleShortcut,
  codeBlockKeymap,
} from "./utils";
import { CodeBlockLanguages, LegacyLanguages } from "./languages";
import { defaultSettings } from "./defaults";
import languageLoaders, { legacyLanguageLoaders } from "./languageLoaders";

export const codeMirrorBlockKey = new PluginKey("codemirror-block");

export const themeCallbacks: Array<(theme: string) => void> = [];

const updateTheme = (theme: string) => {
  themeCallbacks.forEach((callback) => {
    callback(theme);
  });
};

const codeMirrorBlockPlugin = (settings: CodeBlockSettings) =>
  new Plugin({
    key: codeMirrorBlockKey,
    props: {
      nodeViews: {
        [settings.codeBlockName || "code_block"]:
          codeMirrorBlockNodeView(settings),
      },
    },
  });

export default codeMirrorBlockPlugin;

export {
  CodeBlockNodeName,
  codeMirrorBlockNodeView,
  codeBlockArrowHandlers,
  codeMirrorBlockPlugin,
  CodeBlockLanguages,
  LegacyLanguages,
  defaultSettings,
  languageLoaders,
  legacyLanguageLoaders,
  createCodeBlock,
  removeCodeBlock,
  toggleCodeBlock,
  codeBlockToggleShortcut,
  codeBlockKeymap,
  updateTheme,
};

export type { CodeBlockSettings, LanguageLoaders };
