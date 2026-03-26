const REPO_URL =
  "https://github.com/emergence-engineering/emergence-tools";
const DEMOS_URL = `${REPO_URL}/tree/main/playground/fe/src/demos`;
const EE_URL = "https://emergence-engineering.com";

const packages = [
  {
    name: "prosemirror-text-map",
    scoped: true,
    description:
      "Document-to-text conversion with precise position mapping between ProseMirror document positions and plain-text offsets.",
    demoKey: "textMap",
  },
  {
    name: "fast-diff-merge",
    scoped: true,
    description:
        "Fast word-level text diffing that produces a Replace array — useful for merging concurrent edits or showing inline diffs.",
    demoKey: "fastDiffMerge",
  },
  {
    name: "prosemirror-link-preview",
    scoped: false,
    description:
      "Rich link previews that fetch and display metadata for URLs pasted into the editor. Supports collaborative editing via Yjs.",
    demoKey: "linkPreview",
  },
  {
    name: "prosemirror-image-plugin",
    scoped: false,
    description:
      "Advanced image handling with drag & drop, clipboard paste, resize handles, and lazy loading.",
    demoKey: "imagePlugin",
  },
  {
    name: "prosemirror-paste-link",
    scoped: false,
    description:
      "Paste a URL with text selected to wrap the selection in a link, instead of replacing it with the URL text.",
    demoKey: "pasteLink",
  },
  {
    name: "prosemirror-link-plugin",
    scoped: false,
    description:
      "Automatically decorate words matching a configurable alias list — useful for auto-linking terms to pages or glossary entries.",
    demoKey: "linkPlugin",
  },
  {
    name: "prosemirror-codemirror-block",
    scoped: false,
    description:
        "CodeMirror 6 code blocks with syntax highlighting for 100+ languages, language selection, and theme support.",
    demoKey: "codeMirrorBlock",
  },
  {
    name: "prosemirror-slash-menu",
    scoped: false,
    description:
        "Headless slash-command menu plugin. Provides the state machine and keyboard handling — bring your own UI.",
    demoKey: "slashMenuVanilla",
  },
  {
    name: "prosemirror-slash-menu-react",
    scoped: false,
    description:
        "React-based slash-command menu with built-in UI components and Popper positioning, ready to drop into any React + ProseMirror setup.",
    demoKey: "slashMenuReact",
  },
  {
    name: "prosemirror-block-runner",
    scoped: true,
    description:
      "Generic task queue processor for ProseMirror — process document blocks through parallel workers with state management, retry logic, and decorations.",
    demoKey: "blockRunner",
  },
  {
    name: "prosemirror-suggestcat-plugin",
    scoped: false,
    description:
      "AI-powered grammar checking, text completion, and prompt-based editing for ProseMirror editors.",
    demoKey: "suggestcat",
  },
  {
    name: "prosemirror-suggestcat-plugin-react",
    scoped: false,
    description:
      "React UI components for prosemirror-suggestcat-plugin — grammar popups, suggestion overlays, and slash menu integration.",
    demoKey: "suggestcatFix",
  },
  {
    name: "prosemirror-who-wrote-what",
    scoped: true,
    description:
      "Track text authorship in collaborative ProseMirror editors using Yjs — highlights which user wrote which text with colored inline decorations.",
    demoKey: "whoWroteWhat",
    sponsor: true,
  },
  {
    name: "prosemirror-multi-editor-diff",
    scoped: true,
    description:
      "Multi-editor diff visualization — compare two ProseMirror editors side-by-side with inline diff decorations, spacer synchronization, and automatic node pairing.",
    demoKey: "multiEditorDiff",
    sponsor: true,
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
              href={pkg.demoKey ? `#${pkg.demoKey}` : `${REPO_URL}/tree/main/packages/${pkg.name}`}
              target={pkg.demoKey ? undefined : "_blank"}
              rel={pkg.demoKey ? undefined : "noopener noreferrer"}
              className="welcome-card"
            >
              <div className="welcome-card-name">
                {pkg.scoped && (
                  <span className="welcome-card-scope">@emergence-engineering/</span>
                )}
                {pkg.name}
              </div>
              <div className="welcome-card-desc">{pkg.description}</div>
              {pkg.sponsor && (
                <div style={{ marginTop: "auto", paddingTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Sponsored by{" "}
                  <img src="https://lex.page/apple-touch-icon.png" alt="Lex" width="12" height="12" style={{ verticalAlign: "middle", marginRight: 2 }} />
                  {" "}
                  <strong>Lex</strong> & <strong>Nathan Baschez</strong>
                </div>
              )}
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
