import { useCallback, useRef, useState } from "react";

interface InstallCommandProps {
  packageName: string;
}

export function InstallCommand({ packageName }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const command = `npm install ${packageName}`;

  const handleClick = useCallback(() => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <button className="install-command" onClick={handleClick} type="button">
      <span className="install-command-text">
        <span className="install-command-dollar">$</span> {command}
      </span>
      <span className="install-command-icon">{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}
