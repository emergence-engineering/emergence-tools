import { Plugin, PluginKey, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import { Node } from "prosemirror-model";
import {
  LinksKeyState,
  LinksMeta,
  LinksMetaType,
  SpecObject,
  SpecWithAlias,
} from "./types";
import { generateRegex, getTransactionRange } from "./utils";
import decorationsUpdateInRange from "./decorationsUpdateInRange";

export const linksKey = new PluginKey<LinksKeyState<any>>("links");

export const autoLinkingPlugin = <T extends SpecObject>(
  aliasesWithSpec: Array<SpecWithAlias<T>>,
  createAliasDecoration: (
    start: number,
    end: number,
    alias: string,
    matchPos: number,
    pluginState: LinksKeyState<T>,
    doc: Node
  ) => Decoration,
  onLinkAdd?: (addedLinks: Array<SpecWithAlias<T>>) => void,
  onLinkRemove?: (removedLinks: Array<SpecWithAlias<T>>) => void,
  regexGenerator: (aliases: string[]) => RegExp = generateRegex
) => {
  const decorationMapper = (decorations: Decoration[]): SpecWithAlias<T>[] =>
    decorations.map((decoration: Decoration) => decoration.spec);
  return new Plugin<LinksKeyState<T>>({
    key: linksKey,
    state: {
      init(config, state) {
        const regex = regexGenerator(aliasesWithSpec.map((spec) => spec.alias));
        const decorations = DecorationSet.empty;
        const initialState: LinksKeyState<T> = {
          decorations,
          regex,
          aliasToSpec: aliasesWithSpec.reduce(
            (acc, curr) => ({ ...acc, [curr.alias]: curr }),
            {}
          ),
        };
        const update = decorationsUpdateInRange(
          0,
          state.doc.nodeSize,
          state.doc,
          initialState,
          createAliasDecoration
        );
        const newDecorations = initialState.decorations.add(
          state.doc,
          update.decorationsToAdd
        );
        return { ...initialState, decorations: newDecorations };
      },
      apply(tr: Transaction, value: LinksKeyState<T>): LinksKeyState<T> {
        const meta: LinksMeta<T> | undefined = tr.getMeta(linksKey);
        let { regex, aliasToSpec } = value;

        if (meta?.type === LinksMetaType.linkUpdate) {
          aliasToSpec = meta.specs.reduce(
            (acc, curr) => ({ ...acc, [curr.alias]: curr }),
            {}
          );
          regex = regexGenerator(
            meta.specs.map((specWithAlias) => specWithAlias.alias)
          );
          const { decorationsToAdd, decorationsToRemove } =
            decorationsUpdateInRange(
              0,
              tr.doc.nodeSize,
              tr.doc,
              {
                ...value,
                regex,
                aliasToSpec,
              },
              createAliasDecoration
            );
          if (decorationsToRemove.length && onLinkRemove) {
            onLinkRemove(decorationMapper(decorationsToRemove));
          }
          if (decorationsToAdd.length && onLinkAdd) {
            onLinkAdd(decorationMapper(decorationsToAdd));
          }
          const decorationsUpdate = value.decorations
            .remove(decorationsToRemove)
            .add(tr.doc, decorationsToAdd);
          return {
            decorations: decorationsUpdate,
            regex,
            aliasToSpec,
          };
        }
        // If there are no changes in the transaction do nothing
        if (!tr.mapping.maps.length) {
          return value;
        }
        const outMappedDecorations: SpecWithAlias<T>[] = [];
        const mappedDecorations = value.decorations.map(tr.mapping, tr.doc, {
          onRemove: (spec) => {
            outMappedDecorations.push(spec as SpecWithAlias<T>);
          },
        });
        const { start, end } = getTransactionRange(tr);
        const { decorationsToRemove, decorationsToAdd } =
          decorationsUpdateInRange(
            start,
            end,
            tr.doc,
            {
              ...value,
              decorations: mappedDecorations,
            },
            createAliasDecoration
          );
        const mergedRemovedDecorations = [
          ...outMappedDecorations,
          ...decorationMapper(decorationsToRemove),
        ];
        if (mergedRemovedDecorations.length && onLinkRemove) {
          onLinkRemove(mergedRemovedDecorations);
        }
        if (decorationsToAdd.length && onLinkAdd) {
          onLinkAdd(decorationMapper(decorationsToAdd));
        }
        const decorationsUpdate = mappedDecorations
          .remove(decorationsToRemove)
          .add(tr.doc, decorationsToAdd);

        return {
          decorations: decorationsUpdate,
          regex,
          aliasToSpec,
        };
      },
    },
    props: {
      decorations(state) {
        // TODO: linksKey.getState(state) should be okay, but decorations are removed after the editing ( in the next paragraph )
        return DecorationSet.create(
          state.doc,
          linksKey.getState(state)?.decorations.find() || []
        );
      },
    },
  });
};
