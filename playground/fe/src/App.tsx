import { useCallback, useEffect, useSyncExternalStore } from "react";
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

interface DemoEntry {
  label: string;
  component: React.ComponentType;
  group?: string;
}

const demos: Record<string, DemoEntry> = {
  fastDiffMerge: { label: "Fast Diff Merge", component: FastDiffMergeDemo },
  textMap: { label: "Text Map", component: TextMapDemo },
  imagePlugin: { label: "Image Plugin", component: ImagePluginDemo },
  linkPreview: { label: "Link Preview", component: LinkPreviewDemo },
  pasteLink: { label: "Paste Link", component: PasteLinkDemo },
  linkPlugin: { label: "AutoLink Plugin", component: LinkPluginDemo },
  slashMenuVanilla: { label: "Slash Menu (Vanilla)", component: SlashMenuVanillaDemo },
  slashMenuReact: { label: "Slash Menu (React)", component: SlashMenuReactDemo },
  blockRunner: { label: "Block Runner", component: BlockRunnerDemo },
  codeMirrorBlock: { label: "CodeMirror Block", component: CodeMirrorBlockDemo },
  whoWroteWhat: { label: "Who Wrote What", component: WhoWroteWhatDemo },
  suggestcat: { label: "Full Demo", component: SuggestcatDemo, group: "Suggestcat (AI)" },
  suggestcatGrammar: { label: "Grammar", component: SuggestcatGrammarDemo, group: "Suggestcat (AI)" },
  suggestcatAutoComplete: { label: "Autocomplete", component: SuggestcatAutoCompleteDemo, group: "Suggestcat (AI)" },
  suggestcatFix: { label: "AI Actions", component: SuggestcatFixDemo, group: "Suggestcat (AI)" },
};

type DemoKey = keyof typeof demos;
type PageKey = "welcome" | DemoKey;

function getPageFromHash(): PageKey {
  const hash = window.location.hash.replace("#", "");
  if (hash && hash in demos) return hash;
  return "welcome";
}

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashSnapshot() {
  return window.location.hash;
}

export function App() {
  const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot);
  const activePage = getPageFromHash();

  const navigateTo = useCallback((key: PageKey) => {
    window.location.hash = key === "welcome" ? "" : key;
  }, []);

  // Scroll main content to top on page change
  useEffect(() => {
    document.querySelector(".main-content")?.scrollTo(0, 0);
  }, [hash]);

  const ActiveComponent =
    activePage === "welcome"
      ? WelcomePage
      : demos[activePage].component;

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
              {ungrouped.map(([key, { label }]) => (
                <button
                  key={key}
                  className="sidebar-link"
                  data-active={activePage === key}
                  onClick={() => navigateTo(key)}
                >
                  <span className="sidebar-link-dot" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(groups).map(([groupName, entries]) => (
            <div key={groupName} className="sidebar-section">
              <div className="sidebar-section-label">{groupName}</div>
              <div className="sidebar-nav">
                {entries.map(([key, { label }]) => (
                  <button
                    key={key}
                    className="sidebar-link"
                    data-active={activePage === key}
                    onClick={() => navigateTo(key)}
                  >
                    <span className="sidebar-link-dot" />
                    {label}
                  </button>
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
