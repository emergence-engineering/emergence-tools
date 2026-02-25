import { useState } from "react";
import { WelcomePage } from "./demos/WelcomePage";
import { LinkPreviewDemo } from "./demos/LinkPreviewDemo";
import { TextMapDemo } from "./demos/TextMapDemo";
import { SlashMenuVanillaDemo } from "./demos/SlashMenuVanillaDemo";
import { SlashMenuReactDemo } from "./demos/SlashMenuReactDemo";
import { FastDiffMergeDemo } from "./demos/FastDiffMergeDemo";
import { ImagePluginDemo } from "./demos/ImagePluginDemo";
import { CodeMirrorBlockDemo } from "./demos/CodeMirrorBlockDemo";
import { PasteLinkDemo } from "./demos/PasteLinkDemo";

const demos = {
  fastDiffMerge: { label: "Fast Diff Merge", component: FastDiffMergeDemo },
  textMap: { label: "Text Map", component: TextMapDemo },
  linkPreview: { label: "Link Preview", component: LinkPreviewDemo },
  slashMenuVanilla: { label: "Slash Menu (Vanilla)", component: SlashMenuVanillaDemo },
  slashMenuReact: { label: "Slash Menu (React)", component: SlashMenuReactDemo },
  imagePlugin: { label: "Image Plugin", component: ImagePluginDemo },
  codeMirrorBlock: { label: "CodeMirror Block", component: CodeMirrorBlockDemo },
  pasteLink: { label: "Paste Link", component: PasteLinkDemo },
} as const;

type DemoKey = keyof typeof demos;
type PageKey = "welcome" | DemoKey;

export function App() {
  const [activePage, setActivePage] = useState<PageKey>("welcome");
  const ActiveComponent =
    activePage === "welcome"
      ? WelcomePage
      : demos[activePage].component;

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div
          className="sidebar-header"
          onClick={() => setActivePage("welcome")}
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
            {(
              Object.entries(demos) as [DemoKey, (typeof demos)[DemoKey]][]
            ).map(([key, { label }]) => (
              <button
                key={key}
                className="sidebar-link"
                data-active={activePage === key}
                onClick={() => setActivePage(key)}
              >
                <span className="sidebar-link-dot" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <a
            href="https://github.com/emergence-engineering/ee-prosemirror-tools"
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
  );
}
