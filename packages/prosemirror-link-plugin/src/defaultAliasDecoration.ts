import { Decoration } from "prosemirror-view";

import { LinksKeyState } from "./types";

const defaultAliasDecoration = <Spec extends Record<string, any>>(
  start: number,
  end: number,
  alias: string,
  matchPos: number,
  pluginState: LinksKeyState<Spec>
) => {
  const spec = pluginState.aliasToSpec[alias];
  return Decoration.inline(
    start,
    end,
    {
      class: "autoLink",
    },
    spec
  );
};

export default defaultAliasDecoration;
