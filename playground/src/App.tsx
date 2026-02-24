import { useState } from "react";
import { BasicEditor } from "./demos/BasicEditor";
import { TextMapDemo } from "./demos/TextMapDemo";

const demos = {
  textMap: { label: "Text Map", component: TextMapDemo },
  basic: { label: "Basic Editor", component: BasicEditor },
  // Add more demos here as packages are migrated:
  // imagePlugin: { label: "Image Plugin", component: ImagePluginDemo },
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