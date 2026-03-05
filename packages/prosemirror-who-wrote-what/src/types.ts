import { Decoration } from "prosemirror-view";

export const DEFAULT_COLORS: string[] = [
  "#bbdefb", // soft blue
  "#f8bbd0", // soft pink
  "#c8e6c9", // soft green
  "#ffe0b2", // soft orange
  "#d1c4e9", // soft purple
  "#fff9c4", // soft yellow
  "#b2dfdb", // soft teal
  "#ffccbc", // soft coral
  "#b3e5fc", // soft sky
  "#e1bee7", // soft lavender
  "#dcedc8", // soft lime
  "#f0f4c3", // soft chartreuse
  "#ffcdd2", // soft rose
  "#b2ebf2", // soft cyan
  "#d7ccc8", // soft taupe
  "#cfd8dc", // soft slate
];

export interface WhoWroteWhatOptions {
  /** Color palette for author highlights. Cycles through sequentially. */
  colors?: string[];
  /** Key used for the shared YMap storing clientID→userId mappings. Default: "userMap" */
  userMapKey?: string;
  /** Whether decorations are visible when the plugin initializes. Default: true */
  startVisible?: boolean;
  /**
   * Custom decoration factory. If not provided, creates inline decorations
   * with `background-color` style.
   */
  createDecoration?: (
    from: number,
    to: number,
    color: string,
    userId: string | number,
  ) => Decoration;
}

export interface UserMapEntry {
  id: string | number;
  date: number;
}
