import { useState } from "react";
import { BasicEditor } from "./demos/BasicEditor";

const demos = {
  basic: { label: "Basic Editor", component: BasicEditor },
  // Add more demos here as packages are migrated:
  // imagePlugin: { label: "Image Plugin", component: ImagePluginDemo },
} as const;

type DemoKey = keyof typeof demos;

export function App() {
  const [activeDemo, setActiveDemo] = useState<DemoKey>("basic");
  const ActiveComponent = demos[activeDemo].component;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <nav
        style={{
          width: 240,
          padding: 16,
          borderRight: "1px solid #ddd",
          overflowY: "auto",
        }}
      >
        <h2 style={{ margin: "0 0 16px" }}>Plugins</h2>
        {(Object.entries(demos) as [DemoKey, (typeof demos)[DemoKey]][]).map(
          ([key, { label }]) => (
            <button
              key={key}
              onClick={() => setActiveDemo(key)}
              style={{
                display: "block",
                width: "100%",
                padding: "8px 12px",
                marginBottom: 4,
                textAlign: "left",
                background: activeDemo === key ? "#e8f0fe" : "transparent",
                border: "1px solid transparent",
                borderRadius: 4,
                cursor: "pointer",
                fontWeight: activeDemo === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          ),
        )}
      </nav>
      <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        <ActiveComponent />
      </main>
    </div>
  );
}