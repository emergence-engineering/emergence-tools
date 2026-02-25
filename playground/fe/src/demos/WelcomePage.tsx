const REPO_URL =
  "https://github.com/emergence-engineering/ee-prosemirror-tools";
const DEMOS_URL = `${REPO_URL}/tree/main/playground/fe/src/demos`;
const EE_URL = "https://emergence-engineering.com";

const packages = [
  {
    name: "prosemirror-text-map",
    scoped: true,
    description:
      "Document-to-text conversion with precise position mapping between ProseMirror document positions and plain-text offsets.",
  },
  {
    name: "prosemirror-link-preview",
    scoped: true,
    description:
      "Rich link previews that fetch and display metadata for URLs pasted into the editor. Supports collaborative editing via Yjs.",
  },
  {
    name: "prosemirror-slash-menu",
    scoped: false,
    description:
      "Headless slash-command menu plugin. Provides the state machine and keyboard handling — bring your own UI.",
  },
  {
    name: "prosemirror-slash-menu-react",
    scoped: false,
    description:
      "React-based slash-command menu with built-in UI components and Popper positioning, ready to drop into any React + ProseMirror setup.",
  },
  {
    name: "fast-diff-merge",
    scoped: true,
    description:
      "Fast word-level text diffing that produces a Replace array — useful for merging concurrent edits or showing inline diffs.",
  },
  {
    name: "prosemirror-image-plugin",
    scoped: false,
    description:
      "Advanced image handling with drag & drop, clipboard paste, resize handles, and lazy loading.",
  },
  {
    name: "prosemirror-codemirror-block",
    scoped: false,
    description:
      "CodeMirror 6 code blocks with syntax highlighting for 100+ languages, language selection, and theme support.",
  },
];

export function WelcomePage() {
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <img
          src="https://emergence-engineering.com/ee-logo.svg"
          alt="Emergence Engineering"
          className="welcome-logo"
        />
        <h1 className="welcome-title">EE ProseMirror Tools</h1>
        <p className="welcome-subtitle">
          A collection of open-source ProseMirror plugins built and maintained by{" "}
          <a href={EE_URL} target="_blank" rel="noopener noreferrer">
            Emergence Engineering
          </a>
          . This monorepo contains independently published npm packages — use
          the sidebar to explore interactive demos for each one.
        </p>
      </div>

      <section className="welcome-section">
        <h2 className="welcome-section-title">Packages</h2>
        <div className="welcome-grid">
          {packages.map((pkg) => (
            <a
              key={pkg.name}
              href={`${REPO_URL}/tree/main/packages/${pkg.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="welcome-card"
            >
              <div className="welcome-card-name">
                {pkg.scoped && (
                  <span className="welcome-card-scope">@emergence-engineering/</span>
                )}
                {pkg.name}
              </div>
              <div className="welcome-card-desc">{pkg.description}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="welcome-section">
        <h2 className="welcome-section-title">Demo Source Code</h2>
        <p className="welcome-text">
          Every demo in this playground is a self-contained React component. The
          source is available on GitHub — check it out to see how each plugin is
          wired up:{" "}
          <a href={DEMOS_URL} target="_blank" rel="noopener noreferrer">
            playground/fe/src/demos/
          </a>
        </p>
      </section>

      <section className="welcome-section welcome-cta">
        <h2 className="welcome-section-title">Need Help With Your Editor?</h2>
        <p className="welcome-text">
          Emergence Engineering specialises in ProseMirror, Tiptap, and Yjs. If
          you're building or scaling a rich-text editor and need professional
          help — from architecture reviews to custom plugin development — we'd
          love to hear from you.
        </p>
        <a
          href={EE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="welcome-cta-button"
        >
          Get in touch
        </a>
      </section>
    </div>
  );
}
