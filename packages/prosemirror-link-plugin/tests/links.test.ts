import { EditorState } from "prosemirror-state";

import { autoLinkingPlugin, linksKey } from "../src";
import { LinksMeta, LinksMetaType, SpecWithAlias } from "../src";
import defaultAliasDecoration from "../src/defaultAliasDecoration";

import builder from "./builder";

// @ts-ignore
const { doc, p } = builder;

type TestSpec = { id: number };

describe("Link plugin tests", () => {
  const aliases: Array<SpecWithAlias<TestSpec>> = [
    { alias: "test", id: 1 },
    { alias: "secondtest", id: 2 },
  ];

  it("doesn't have decorations on initial load if there's no match", () => {
    const testDoc = doc(p("nottest"));
    const initialState = EditorState.create({
      doc: testDoc,
      plugins: [autoLinkingPlugin(aliases, defaultAliasDecoration)],
    });
    const pluginState = linksKey.getState(initialState);
    expect(pluginState).toBeDefined();
    expect(pluginState?.decorations.find()).toHaveLength(0);
  });

  it("has one decoration on initial load if there's one match", () => {
    const testDoc = doc(p("test"));
    const initialState = EditorState.create({
      doc: testDoc,
      plugins: [autoLinkingPlugin(aliases, defaultAliasDecoration)],
    });
    const pluginState = linksKey.getState(initialState);
    expect(pluginState?.decorations.find()).toHaveLength(1);
  });

  it("has two decorations on initial load if there are two matches", () => {
    const testDoc = doc(p("test secondtest"));
    const initialState = EditorState.create({
      doc: testDoc,
      plugins: [autoLinkingPlugin(aliases, defaultAliasDecoration)],
    });
    const pluginState = linksKey.getState(initialState);
    expect(pluginState?.decorations.find()).toHaveLength(2);
  });

  it("adds decoration if the aliases list is updated, triggers onLinkAdd", () => {
    const testDoc = doc(p("test addedalias secondtest"));
    const onLinkAdd = jest.fn();
    const initialState = EditorState.create({
      doc: testDoc,
      plugins: [autoLinkingPlugin(aliases, defaultAliasDecoration, onLinkAdd)],
    });
    const pluginState = linksKey.getState(initialState);
    expect(pluginState?.decorations.find()).toHaveLength(2);
    const meta: LinksMeta<TestSpec> = {
      specs: [...aliases, { alias: "addedalias", id: 3 }],
      type: LinksMetaType.linkUpdate,
    };

    const stateUpdate = initialState.apply(
      initialState.tr.setMeta(linksKey, meta)
    );
    const pluginStateUpdate = linksKey.getState(stateUpdate);
    expect(pluginStateUpdate?.decorations.find()).toHaveLength(3);
    expect(pluginStateUpdate?.decorations.find()[1].spec).toMatchObject({
      id: 3,
    });
    expect(onLinkAdd.mock.calls).toHaveLength(1);
    expect(onLinkAdd.mock.calls[0]).toHaveLength(1);
    // A single link was removed
    expect(onLinkAdd.mock.calls[0][0]).toHaveLength(1);
    expect(onLinkAdd.mock.calls[0][0][0]).toMatchObject({
      alias: "addedalias",
      id: 3,
    });
  });

  it("removes decoration if the aliases list is updated, triggers onLinkRemove", () => {
    const onLinkAdd = jest.fn();
    const onLinkRemove = jest.fn();
    const testDoc = doc(p("test addedalias secondtest"));
    const initialState = EditorState.create({
      doc: testDoc,
      plugins: [
        autoLinkingPlugin(
          aliases,
          defaultAliasDecoration,
          onLinkAdd,
          onLinkRemove
        ),
      ],
    });
    const pluginState = linksKey.getState(initialState);
    expect(pluginState?.decorations.find()).toHaveLength(2);
    const meta: LinksMeta<TestSpec> = {
      specs: aliases.filter((item) => item.alias !== "test"),
      type: LinksMetaType.linkUpdate,
    };

    const stateUpdate = initialState.apply(
      initialState.tr.setMeta(linksKey, meta)
    );
    const pluginStateUpdate = linksKey.getState(stateUpdate);
    expect(pluginStateUpdate?.decorations.find()).toHaveLength(1);
    expect(pluginStateUpdate?.decorations.find()[0].spec).toMatchObject({
      id: 2,
    });
    expect(onLinkRemove.mock.calls).toHaveLength(1);
    expect(onLinkRemove.mock.calls[0]).toHaveLength(1);
    // A single link was removed
    expect(onLinkRemove.mock.calls[0][0]).toHaveLength(1);
    expect(onLinkRemove.mock.calls[0][0][0]).toMatchObject({
      alias: "test",
      id: 1,
    });
  });

  it("adds decoration if it's typed into the editor, triggers onLinkAdd", () => {
    const testDoc = doc(p("test"));
    const onLinkAdd = jest.fn();
    const onLinkRemove = jest.fn();
    const initialState = EditorState.create({
      doc: testDoc,
      plugins: [
        autoLinkingPlugin(
          aliases,
          defaultAliasDecoration,
          onLinkAdd,
          onLinkRemove
        ),
      ],
    });
    const pluginState = linksKey.getState(initialState);
    expect(pluginState?.decorations.find()).toHaveLength(1);
    const stateUpdate = initialState.apply(
      // insert text to the end
      initialState.tr.insertText(" secondtest", initialState.doc.nodeSize - 2)
    );
    const pluginStateUpdate = linksKey.getState(stateUpdate);
    expect(pluginStateUpdate?.decorations.find()).toHaveLength(2);
    expect(pluginStateUpdate?.decorations.find()[1].spec).toMatchObject({
      id: 2,
    });
    expect(onLinkAdd.mock.calls).toHaveLength(1);
    expect(onLinkRemove.mock.calls).toHaveLength(0);
    expect(onLinkAdd.mock.calls[0]).toHaveLength(1);
    // A single link was removed
    expect(onLinkAdd.mock.calls[0][0]).toHaveLength(1);
    expect(onLinkAdd.mock.calls[0][0][0]).toMatchObject({
      alias: "secondtest",
      id: 2,
    });
  });
  it("removes decoration if it's deleted from the editor, triggers onLinkRemove", () => {
    const testDoc = doc(p("test secondtest"));
    const onLinkAdd = jest.fn();
    const onLinkRemove = jest.fn();
    const initialState = EditorState.create({
      doc: testDoc,
      plugins: [
        autoLinkingPlugin(
          aliases,
          defaultAliasDecoration,
          onLinkAdd,
          onLinkRemove
        ),
      ],
    });
    const pluginState = linksKey.getState(initialState);
    expect(pluginState?.decorations.find()).toHaveLength(2);
    const stateUpdate = initialState.apply(
      // insert text to the end
      initialState.tr.delete(
        initialState.doc.nodeSize - (3 + "secondtest".length),
        initialState.doc.nodeSize - 3
      )
    );
    const pluginStateUpdate = linksKey.getState(stateUpdate);
    expect(pluginStateUpdate?.decorations.find()).toHaveLength(1);
    expect(pluginStateUpdate?.decorations.find()[0].spec).toMatchObject({
      id: 1,
    });
    expect(onLinkRemove.mock.calls).toHaveLength(1);
    expect(onLinkAdd.mock.calls).toHaveLength(0);
    expect(onLinkRemove.mock.calls[0]).toHaveLength(1);
    // A single link was removed
    expect(onLinkRemove.mock.calls[0][0]).toHaveLength(1);
    expect(onLinkRemove.mock.calls[0][0][0]).toMatchObject({
      alias: "secondtest",
      id: 2,
    });
  });
  it("works with empty alias list", () => {
    const testDoc = doc(p("Start typing!"));
    const initialState = EditorState.create({
      doc: testDoc,
      plugins: [autoLinkingPlugin([], defaultAliasDecoration)],
    });

    const meta: LinksMeta<TestSpec> = {
      specs: [],
      type: LinksMetaType.linkUpdate,
    };

    const pluginState = linksKey.getState(initialState);
    expect(pluginState).toBeDefined();
    expect(pluginState?.decorations.find()).toHaveLength(0);
    const stateUpdate = initialState.apply(
      initialState.tr.setMeta(linksKey, meta)
    );
    const pluginStateUpdate = linksKey.getState(stateUpdate);
    expect(pluginStateUpdate).toBeDefined();
    expect(pluginStateUpdate?.decorations.find()).toHaveLength(0);
  });
  it("decorations stay if the user types before it", () => {
    const testDoc = doc(p("first paragraph"), p("test"));
    const initialState = EditorState.create({
      doc: testDoc,
      plugins: [autoLinkingPlugin(aliases, defaultAliasDecoration)],
    });
    const pluginState = linksKey.getState(initialState);
    expect(pluginState?.decorations.find()).toHaveLength(1);
    const stateUpdate = initialState.apply(
      // insert text to the end
      initialState.tr.insertText("typed text ", 1)
    );
    const pluginStateUpdate = linksKey.getState(stateUpdate);
    expect(pluginStateUpdate?.decorations.find()).toHaveLength(1);
  });
});
