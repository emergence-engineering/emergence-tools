import { DecorationSet } from "prosemirror-view";

export type SpecObject = Record<string, any>;
export type SpecWithAlias<Spec extends SpecObject> = Spec & { alias: string };
export interface LinksKeyState<Spec extends SpecObject = { alias: string }> {
  // TODO: Schema
  decorations: DecorationSet;
  regex: RegExp;
  aliasToSpec: Record<string, SpecWithAlias<Spec>>;
}

export enum LinksMetaType {
  linkUpdate = "linkUpdate",
}

export interface LinksUpdateMeta<Spec extends SpecObject> {
  type: LinksMetaType.linkUpdate;
  specs: Array<SpecWithAlias<Spec>>;
}

export type LinksMeta<Spec extends SpecObject> = LinksUpdateMeta<Spec>;
