import { useState } from "react";
import { BasicEditor } from "./demos/BasicEditor";
import { LinkPreviewDemo } from "./demos/LinkPreviewDemo";
import { TextMapDemo } from "./demos/TextMapDemo";
import { SlashMenuVanillaDemo } from "./demos/SlashMenuVanillaDemo";
import { SlashMenuReactDemo } from "./demos/SlashMenuReactDemo";
import { FastDiffMergeDemo } from "./demos/FastDiffMergeDemo";

const demos = {
  fastDiffMerge: { label: "Fast Diff Merge", component: FastDiffMergeDemo },
  textMap: { label: "Text Map", component: TextMapDemo },
  linkPreview: { label: "Link Preview", component: LinkPreviewDemo },
  slashMenuVanilla: { label: "Slash Menu (Vanilla)", component: SlashMenuVanillaDemo },
  slashMenuReact: { label: "Slash Menu (React)", component: SlashMenuReactDemo },
  basic: { label: "Basic Editor", component: BasicEditor },
} as const;

type DemoKey = keyof typeof demos;

export function App() {
  const [activeDemo, setActiveDemo] = useState<DemoKey>("textMap");
  const ActiveComponent = demos[activeDemo].component;

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">EE</div>
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
                data-active={activeDemo === key}
                onClick={() => setActiveDemo(key)}
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
