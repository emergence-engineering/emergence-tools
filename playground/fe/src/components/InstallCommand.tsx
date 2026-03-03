import { useCallback, useRef, useState } from "react";
import { usePackageManager } from "./PackageManagerContext";

const PM_OPTIONS = ["npm", "pnpm", "yarn"] as const;

const INSTALL_VERBS: Record<string, string> = {
  npm: "install",
  pnpm: "add",
  yarn: "add",
};

interface InstallCommandProps {
  packageNames: string[];
}

export function InstallCommand({ packageNames }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const { packageManager, setPackageManager } = usePackageManager();

  const command = `${packageManager} ${INSTALL_VERBS[packageManager]} ${packageNames.join(" ")}`;

  const handleClick = useCallback(() => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <div className="install-command-wrapper">
      <div className="install-command-tabs">
        {PM_OPTIONS.map((pm) => (
          <button
            key={pm}
            type="button"
            className="install-command-tab"
            data-active={packageManager === pm}
            onClick={() => setPackageManager(pm)}
          >
            {pm}
          </button>
        ))}
      </div>
      <button className="install-command" onClick={handleClick} type="button">
        <span className="install-command-text">
          <span className="install-command-dollar">$</span> {command}
        </span>
        <span className="install-command-icon">
          {copied ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}
