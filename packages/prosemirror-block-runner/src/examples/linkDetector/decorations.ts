import { Decoration } from "prosemirror-view";
import {
  DecorationFactory,
  ProcessingUnit,
  ResultDecoration,
} from "../../types";
import { textPosToDocPos } from "../../utils";
import { LinkDetectorMetadata, LinkDetectorResponse } from "./types";

// Decoration factory for link detection
export const linkDetectorDecorationFactory: DecorationFactory<
  LinkDetectorResponse,
  LinkDetectorMetadata
> = (
  response: LinkDetectorResponse,
  unit: ProcessingUnit<LinkDetectorMetadata>
): ResultDecoration<LinkDetectorResponse>[] => {
  return response.map((link) => {
    const docFrom = unit.from + 1 + textPosToDocPos(link.from, unit.mapping);
    const docTo = unit.from + 1 + textPosToDocPos(link.to, unit.mapping);

    return Decoration.inline(
      docFrom,
      docTo,
      {
        class: "link-detected",
        style: "color: #0066cc; text-decoration: underline; cursor: pointer;",
      },
      {
        id: {},
        unitId: unit.id,
        originalText: link.url,
        response,
        url: link.url, // Store URL for click handling
      }
    ) as ResultDecoration<LinkDetectorResponse>;
  });
};
