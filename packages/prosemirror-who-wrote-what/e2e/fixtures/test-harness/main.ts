import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { ySyncPlugin, ySyncPluginKey } from "y-prosemirror";
import * as Y from "yjs";

import {
  createWhoWroteWhatPlugin,
  whoWroteWhatPluginKey,
  setWhoWroteWhatVisibility,
  getDecorationSet,
  writeClientIdsToYDoc,
} from "@whoWroteWhat/index";
import type { UserMapEntry } from "@whoWroteWhat/types";

// --- Schema ---
const testSchema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

// --- Yjs setup ---
const ydoc = new Y.Doc();
const xmlFragment = ydoc.getXmlFragment("prosemirror");

// --- Plugin setup ---
const userId = "test-user-1";

const wwwPlugin = createWhoWroteWhatPlugin({
  userId,
  options: { userMapKey: "userMap" },
});

// --- Editor ---
const editorEl = document.getElementById("editor")!;

const state = EditorState.create({
  schema: testSchema,
  plugins: [ySyncPlugin(xmlFragment), wwwPlugin],
});

const view = new EditorView(editorEl, { state });

// --- Multi-user helpers ---

/**
 * Insert a paragraph as a different user by creating a secondary Y.Doc,
 * syncing state, inserting content, and syncing back. The userMap entry
 * is written on the main doc AFTER the content sync so that ySync's
 * binding is already up-to-date when computeDecorations fires.
 */
function insertAsUser(userIdToInsert: string, text: string) {
  const secondaryDoc = new Y.Doc();
  // Sync main → secondary
  Y.applyUpdate(secondaryDoc, Y.encodeStateAsUpdate(ydoc));

  const secondaryFragment = secondaryDoc.getXmlFragment("prosemirror");
  secondaryDoc.transact(() => {
    const p = new Y.XmlElement("paragraph");
    p.insert(0, [new Y.XmlText(text)]);
    secondaryFragment.insert(secondaryFragment.length, [p]);
  });

  const clientId = secondaryDoc.clientID;

  // Sync content to main doc (no userMap changes — avoids observer race)
  Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(secondaryDoc));

  // Now write userMap on main doc — binding is already updated from the sync above
  const userMap = ydoc.getMap<UserMapEntry>("userMap");
  userMap.set(clientId.toString(), {
    id: userIdToInsert,
    date: Date.now(),
  });
}

const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms));

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/**
 * Bulk-insert paragraphs in round-robin order across simulated users.
 * Uses a single secondary Y.Doc with rotating clientID — each transact
 * gets a different clientID, so items are genuinely attributed to different
 * users while preserving insertion order. Single sync to main at the end.
 *
 * Paragraph text format: "u{userId}-p{paragraphNo} sample text..."
 * e.g. "u001-p0001 sample text for performance testing."
 */
async function insertLargeDocMultiUser(
  paragraphCount: number,
  userCount: number,
  batchSize = 100,
) {
  const userIdWidth = String(userCount).length;
  const paraWidth = String(paragraphCount).length;

  // Assign stable clientIDs for each simulated user (offset from a base)
  const baseClientId = 100_000;
  const clientIds = Array.from({ length: userCount }, (_, u) => baseClientId + u);

  const secondaryDoc = new Y.Doc();
  const frag = secondaryDoc.getXmlFragment("prosemirror");

  for (let i = 0; i < paragraphCount; i++) {
    const userIdx = i % userCount;

    // Rotate clientID so this paragraph's items are tagged to the right user
    secondaryDoc.clientID = clientIds[userIdx];

    secondaryDoc.transact(() => {
      const p = new Y.XmlElement("paragraph");
      p.insert(0, [
        new Y.XmlText(
          `u${pad(userIdx + 1, userIdWidth)}-p${pad(i + 1, paraWidth)}`,
        ),
      ]);
      frag.insert(frag.length, [p]);
    });

    if ((i + 1) % batchSize === 0) await sleep(0);
  }

  // Hide editor to avoid layout thrashing during the big DOM update
  editorEl.style.display = "none";

  // Single sync to main doc
  Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(secondaryDoc));

  // Write userMap entries on main doc — binding is up-to-date after sync
  const userMap = ydoc.getMap<UserMapEntry>("userMap");
  for (let u = 0; u < userCount; u++) {
    userMap.set(clientIds[u].toString(), {
      id: `perf-user-${pad(u + 1, userIdWidth)}`,
      date: Date.now(),
    });
  }

  editorEl.style.display = "";
}

// --- Test Bridge ---

interface DecorationInfo {
  from: number;
  to: number;
  style: string;
}

interface TestBridge {
  getDecorationCount(): number;
  getDecorations(): DecorationInfo[];
  getPluginState(): { visible: boolean; decorationCount: number };
  getDocSize(): number;
  getDocText(): string;

  setVisibility(visible: boolean): void;
  typeText(text: string): void;
  insertAsUser(userId: string, text: string): void;

  insertLargeDoc(paragraphCount: number, userCount?: number): Promise<void>;
  measureDecorationTime(): number;
}

function getDecorationInfos(): DecorationInfo[] {
  const pluginState = whoWroteWhatPluginKey.getState(view.state);
  if (!pluginState) return [];
  const found = pluginState.decorations.find(0, view.state.doc.content.size);
  return found.map((d) => ({
    from: d.from,
    to: d.to,
    style: (d as any).type?.attrs?.style || "",
  }));
}

const bridge: TestBridge = {
  getDecorationCount() {
    const pluginState = whoWroteWhatPluginKey.getState(view.state);
    if (!pluginState) return 0;
    return pluginState.decorations.find(0, view.state.doc.content.size).length;
  },

  getDecorations() {
    return getDecorationInfos();
  },

  getPluginState() {
    const pluginState = whoWroteWhatPluginKey.getState(view.state);
    if (!pluginState) return { visible: true, decorationCount: 0 };
    return {
      visible: pluginState.visible,
      decorationCount: pluginState.decorations.find(
        0,
        view.state.doc.content.size,
      ).length,
    };
  },

  getDocSize() {
    return view.state.doc.content.size;
  },

  getDocText() {
    return view.state.doc.textContent;
  },

  setVisibility(visible: boolean) {
    setWhoWroteWhatVisibility(view, visible);
  },

  typeText(text: string) {
    const { from } = view.state.selection;
    const tr = view.state.tr.insertText(text, from);
    view.dispatch(tr);
  },

  insertAsUser(userIdToInsert: string, text: string) {
    insertAsUser(userIdToInsert, text);
  },

  async insertLargeDoc(paragraphCount: number, userCount = 1) {
    if (userCount <= 1) {
      // Single-user fast path
      ydoc.transact(() => {
        for (let i = 0; i < paragraphCount; i++) {
          const p = new Y.XmlElement("paragraph");
          p.insert(0, [
            new Y.XmlText(
              `Paragraph ${i + 1} with some sample text for performance testing.`,
            ),
          ]);
          xmlFragment.insert(xmlFragment.length, [p]);
        }
      });
      writeClientIdsToYDoc(ydoc, userId, "userMap");
    } else {
      await insertLargeDocMultiUser(paragraphCount, userCount);
    }
  },

  measureDecorationTime() {
    const ySyncState = ySyncPluginKey.getState(view.state);
    if (!ySyncState?.binding) return -1;
    const userMap = ydoc.getMap<UserMapEntry>("userMap");

    const start = performance.now();
    getDecorationSet(ySyncState.binding, view.state, userMap, {});
    const end = performance.now();
    return end - start;
  },
};

(window as any).__WWW_TEST__ = bridge;
(window as any).__editorView = view;

// --- UI Controls ---

const $ = (id: string) => document.getElementById(id)!;

const statVisible = $("stat-visible");
const statDecos = $("stat-decos");
const statDocSize = $("stat-doc-size");
const statTiming = $("stat-timing");

function updateStatus() {
  const ps = bridge.getPluginState();
  statVisible.textContent = `visible: ${ps.visible}`;
  statDecos.textContent = `decorations: ${ps.decorationCount}`;
  statDocSize.textContent = `doc size: ${bridge.getDocSize()}`;
}

// Poll status bar every 200ms
setInterval(updateStatus, 200);

// Visibility
$("btn-show").addEventListener("click", () => {
  bridge.setVisibility(true);
});
$("btn-hide").addEventListener("click", () => {
  bridge.setVisibility(false);
});

// Insert as user
$("btn-insert-as-user").addEventListener("click", () => {
  const uid = ($ ("input-user-id") as HTMLInputElement).value || "anonymous";
  const text = ($("input-user-text") as HTMLInputElement).value || "Some text";
  bridge.insertAsUser(uid, text);
});

// Bulk insert
$("btn-bulk-insert").addEventListener("click", async () => {
  const count = parseInt(($("input-para-count") as HTMLInputElement).value) || 500;
  const users = parseInt(($("input-user-count") as HTMLInputElement).value) || 1;
  statTiming.textContent = "inserting...";
  const start = performance.now();
  await bridge.insertLargeDoc(count, users);
  const elapsed = performance.now() - start;
  statTiming.textContent = `insert: ${elapsed.toFixed(1)}ms`;
});

// Measure decoration time
$("btn-measure").addEventListener("click", () => {
  const time = bridge.measureDecorationTime();
  statTiming.textContent = `decoration: ${time.toFixed(2)}ms`;
});

console.log("Who Wrote What test harness initialized");
