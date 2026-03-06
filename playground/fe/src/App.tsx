import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { PackageManagerProvider } from "./components/PackageManagerContext";
import { WelcomePage } from "./demos/WelcomePage";
import { LinkPreviewDemo } from "./demos/LinkPreviewDemo";
import { TextMapDemo } from "./demos/TextMapDemo";
import { SlashMenuVanillaDemo } from "./demos/SlashMenuVanillaDemo";
import { SlashMenuReactDemo } from "./demos/SlashMenuReactDemo";
import { FastDiffMergeDemo } from "./demos/FastDiffMergeDemo";
import { ImagePluginDemo } from "./demos/ImagePluginDemo";
import { CodeMirrorBlockDemo } from "./demos/CodeMirrorBlockDemo";
import { PasteLinkDemo } from "./demos/PasteLinkDemo";
import { LinkPluginDemo } from "./demos/LinkPluginDemo";
import { SuggestcatDemo } from "./demos/SuggestcatDemo";
import { SuggestcatGrammarDemo } from "./demos/SuggestcatGrammarDemo";
import { SuggestcatAutoCompleteDemo } from "./demos/SuggestcatAutoCompleteDemo";
import { SuggestcatFixDemo } from "./demos/SuggestcatFixDemo";
import { BlockRunnerDemo } from "./demos/BlockRunnerDemo";
import { WhoWroteWhatDemo } from "./demos/WhoWroteWhatDemo";
import { MultiEditorDiffDemo } from "./demos/MultiEditorDiffDemo";
import { WhoWroteWhatDocs } from "./demos/WhoWroteWhatDocs";
import { TextMapDocs } from "./demos/TextMapDocs";
import { FastDiffMergeDocs } from "./demos/FastDiffMergeDocs";
import { PasteLinkDocs } from "./demos/PasteLinkDocs";
import { BlockRunnerDocs } from "./demos/BlockRunnerDocs";
import { MultiEditorDiffDocs } from "./demos/MultiEditorDiffDocs";
import { CodeMirrorBlockDocs } from "./demos/CodeMirrorBlockDocs";
import { SlashMenuDocs } from "./demos/SlashMenuDocs";
import { SlashMenuReactDocs } from "./demos/SlashMenuReactDocs";
import { SuggestcatDocs } from "./demos/SuggestcatDocs";
import { LinkPluginDocs } from "./demos/LinkPluginDocs";
import { LinkPreviewDocs } from "./demos/LinkPreviewDocs";
import { ImagePluginDocs } from "./demos/ImagePluginDocs";

interface DemoEntry {
  label: string;
  component: React.ComponentType;
  docsComponent?: React.ComponentType;
  group?: string;
}

const demos: Record<string, DemoEntry> = {
  fastDiffMerge: { label: "Fast Diff Merge", component: FastDiffMergeDemo, docsComponent: FastDiffMergeDocs },
  textMap: { label: "Text Map", component: TextMapDemo, docsComponent: TextMapDocs },
  imagePlugin: { label: "Image Plugin", component: ImagePluginDemo, docsComponent: ImagePluginDocs },
  linkPreview: { label: "Link Preview", component: LinkPreviewDemo, docsComponent: LinkPreviewDocs },
  pasteLink: { label: "Paste Link", component: PasteLinkDemo, docsComponent: PasteLinkDocs },
  linkPlugin: { label: "AutoLink Plugin", component: LinkPluginDemo, docsComponent: LinkPluginDocs },
  slashMenuVanilla: { label: "Slash Menu (Vanilla)", component: SlashMenuVanillaDemo, docsComponent: SlashMenuDocs },
  slashMenuReact: { label: "Slash Menu (React)", component: SlashMenuReactDemo, docsComponent: SlashMenuReactDocs },
  blockRunner: { label: "Block Runner", component: BlockRunnerDemo, docsComponent: BlockRunnerDocs },
  codeMirrorBlock: { label: "CodeMirror Block", component: CodeMirrorBlockDemo, docsComponent: CodeMirrorBlockDocs },
  whoWroteWhat: { label: "Who Wrote What", component: WhoWroteWhatDemo, docsComponent: WhoWroteWhatDocs },
  multiEditorDiff: { label: "Multi-Editor Diff", component: MultiEditorDiffDemo, docsComponent: MultiEditorDiffDocs },
  suggestcat: { label: "Full Demo", component: SuggestcatDemo, docsComponent: SuggestcatDocs, group: "Suggestcat (AI)" },
  suggestcatGrammar: { label: "Grammar", component: SuggestcatGrammarDemo, group: "Suggestcat (AI)" },
  suggestcatAutoComplete: { label: "Autocomplete", component: SuggestcatAutoCompleteDemo, group: "Suggestcat (AI)" },
  suggestcatFix: { label: "AI Actions", component: SuggestcatFixDemo, group: "Suggestcat (AI)" },
};

type DemoKey = keyof typeof demos;
type PageKey = "welcome" | DemoKey;
type SubPage = "demo" | "docs";

function getPageFromHash(): { page: PageKey; subPage: SubPage } {
  const hash = window.location.hash.replace("#", "");
  const [key, sub] = hash.split("/");
  if (key && key in demos) {
    return { page: key, subPage: sub === "docs" ? "docs" : "demo" };
  }
  return { page: "welcome", subPage: "demo" };
}

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashSnapshot() {
  return window.location.hash;
}

function SidebarItem({
  demoKey,
  entry,
  activePage,
  subPage,
  navigateTo,
}: {
  demoKey: string;
  entry: DemoEntry;
  activePage: PageKey;
  subPage: SubPage;
  navigateTo: (key: string) => void;
}) {
  const isActive = activePage === demoKey;
  const [expanded, setExpanded] = useState(isActive);

  // Auto-expand when this item becomes active
  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  const handleClick = () => {
    if (isActive) {
      setExpanded((prev) => !prev);
    } else {
      navigateTo(demoKey);
      setExpanded(true);
    }
  };

  const hasSubNav = !!entry.docsComponent;

  return (
    <div className="sidebar-item">
      <button
        className="sidebar-link"
        data-active={isActive}
        onClick={handleClick}
      >
        {hasSubNav ? (
          <span
            className="sidebar-link-chevron"
            data-expanded={expanded}
          />
        ) : (
          <span className="sidebar-link-dot" />
        )}
        {entry.label}
      </button>
      {hasSubNav && expanded && (
        <div className="sidebar-sub-nav">
          <button
            className="sidebar-sub-link"
            data-active={isActive && subPage === "demo"}
            onClick={() => navigateTo(demoKey)}
          >
            Demo
          </button>
          <button
            className="sidebar-sub-link"
            data-active={isActive && subPage === "docs"}
            onClick={() => navigateTo(`${demoKey}/docs`)}
          >
            Dev Docs
          </button>
        </div>
      )}
    </div>
  );
}

export function App() {
  const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot);
  const { page: activePage, subPage } = getPageFromHash();

  const navigateTo = useCallback((key: string) => {
    window.location.hash = key === "welcome" ? "" : key;
  }, []);

  // Scroll main content to top on page change
  useEffect(() => {
    document.querySelector(".main-content")?.scrollTo(0, 0);
  }, [hash]);

  let ActiveComponent: React.ComponentType;
  if (activePage === "welcome") {
    ActiveComponent = WelcomePage;
  } else {
    const entry = demos[activePage];
    ActiveComponent =
      subPage === "docs" && entry.docsComponent
        ? entry.docsComponent
        : entry.component;
  }

  // Group demos: ungrouped first, then grouped
  const ungrouped = Object.entries(demos).filter(([, d]) => !d.group);
  const groups = Object.entries(demos).reduce<Record<string, [string, DemoEntry][]>>(
    (acc, entry) => {
      const group = entry[1].group;
      if (group) {
        (acc[group] ??= []).push(entry);
      }
      return acc;
    },
    {},
  );

  return (
    <PackageManagerProvider>
      <div className="app-layout">
        <nav className="sidebar">
          <div
            className="sidebar-header"
            onClick={() => navigateTo("welcome")}
          >
            <img
              src="https://emergence-engineering.com/ee-icon-4848.png"
              alt="Emergence Engineering"
              className="sidebar-logo-img"
            />
            <div>
              <div className="sidebar-title">ProseMirror Tools</div>
              <div className="sidebar-subtitle">Plugin Playground</div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Demos</div>
            <div className="sidebar-nav">
              {ungrouped.map(([key, entry]) => (
                <SidebarItem
                  key={key}
                  demoKey={key}
                  entry={entry}
                  activePage={activePage}
                  subPage={subPage}
                  navigateTo={navigateTo}
                />
              ))}
            </div>
          </div>

          {Object.entries(groups).map(([groupName, entries]) => (
            <div key={groupName} className="sidebar-section">
              <div className="sidebar-section-label">{groupName}</div>
              <div className="sidebar-nav">
                {entries.map(([key, entry]) => (
                  <SidebarItem
                    key={key}
                    demoKey={key}
                    entry={entry}
                    activePage={activePage}
                    subPage={subPage}
                    navigateTo={navigateTo}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="sidebar-footer">
            <a
              href="https://github.com/emergence-engineering/emergence-tools"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </nav>

        <main className="main-content">
          <ActiveComponent />
        </main>
      </div>
    </PackageManagerProvider>
  );
}
