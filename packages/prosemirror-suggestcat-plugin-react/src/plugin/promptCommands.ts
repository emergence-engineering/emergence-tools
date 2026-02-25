import { CommandItem, SubMenu } from "prosemirror-slash-menu";
import {
  startTask,
  MoodParamType,
  AiPromptsWithoutParam,
  AiPromptsWithParam,
  TranslationTargetLanguage,
} from "prosemirror-suggestcat-plugin";
import { PromptIcons } from "./promptIcons";

// Commands using completeV2 startTask action

const Complete: CommandItem = {
  id: PromptIcons.Complete,
  label: "Complete",
  type: "command",
  command: (view) => {
    startTask(view, AiPromptsWithoutParam.Complete);
    return true;
  },
  available: () => true,
};

const MakeItShorter: CommandItem = {
  id: PromptIcons.MakeItShorter,
  label: "Make it shorter",
  type: "command",
  command: (view) => {
    startTask(view, AiPromptsWithoutParam.MakeShorter);
    return true;
  },
  available: () => true,
};

const MakeItLonger: CommandItem = {
  id: PromptIcons.MakeItLonger,
  label: "Make it longer",
  type: "command",
  command: (view) => {
    startTask(view, AiPromptsWithoutParam.MakeLonger);
    return true;
  },
  available: () => true,
};

const Explain: CommandItem = {
  id: PromptIcons.Explain,
  label: "Explain",
  type: "command",
  command: (view) => {
    startTask(view, AiPromptsWithoutParam.Explain);
    return true;
  },
  available: () => true,
};

const Simplify: CommandItem = {
  id: PromptIcons.Simplify,
  label: "Simplify",
  type: "command",
  command: (view) => {
    startTask(view, AiPromptsWithoutParam.Simplify);
    return true;
  },
  available: () => true,
};

const ActionItems: CommandItem = {
  id: PromptIcons.ActionItems,
  label: "Action items",
  type: "command",
  command: (view) => {
    startTask(view, AiPromptsWithoutParam.ActionItems);
    return true;
  },
  available: () => true,
};

const getTranslations = () => {
  const keys = Object.keys(
    TranslationTargetLanguage,
  ) as (keyof typeof TranslationTargetLanguage)[];
  if (!keys) return [];

  return keys.map((key) => {
    return {
      id: `To${TranslationTargetLanguage[key]}`,
      label: TranslationTargetLanguage[key],
      type: "command",
      command: (view) => {
        startTask(view, AiPromptsWithParam.Translate, {
          targetLanguage: TranslationTargetLanguage[key],
        });
        return true;
      },
      available: () => true,
    } as CommandItem;
  });
};

// Submenus
const Translate: SubMenu = {
  id: PromptIcons.Translate,
  label: "Translate",
  type: "submenu",
  available: () => true,
  elements: getTranslations(),
};

const ToCasual: CommandItem = {
  id: "ToCasual",
  label: "Casual",
  type: "command",
  command: (view) => {
    startTask(view, AiPromptsWithParam.ChangeTone, {
      mood: MoodParamType.Casual,
    });
    return true;
  },
  available: () => true,
};

const ToConfident: CommandItem = {
  id: "ToConfident",
  label: "Confident",
  type: "command",
  command: (view) => {
    startTask(view, AiPromptsWithParam.ChangeTone, {
      mood: MoodParamType.Confident,
    });
    return true;
  },
  available: () => true,
};

const ToFriendly: CommandItem = {
  id: "ToFriendly",
  label: "Friendly",
  type: "command",
  command: (view) => {
    startTask(view, AiPromptsWithParam.ChangeTone, {
      mood: MoodParamType.Friendly,
    });
    return true;
  },
  available: () => true,
};

const ToStraightForward: CommandItem = {
  id: "ToStraightForward",
  label: "StraightForward",
  type: "command",
  command: (view) => {
    startTask(view, AiPromptsWithParam.ChangeTone, {
      mood: MoodParamType.Straightforward,
    });
    return true;
  },
  available: () => true,
};

const ChangeTone: SubMenu = {
  id: PromptIcons.ChangeTone,
  label: "Change tone",
  type: "submenu",
  available: () => true,
  elements: [ToCasual, ToConfident, ToFriendly, ToStraightForward],
};

export const promptCommands = [
  MakeItShorter,
  MakeItLonger,
  Complete,
  ActionItems,
  Explain,
  Simplify,
  ChangeTone,
  Translate,
];
