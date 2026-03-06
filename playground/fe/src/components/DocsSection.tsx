import type { ReactNode } from "react";

interface DocsSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function DocsSection({
  title,
  defaultOpen = true,
  children,
}: DocsSectionProps) {
  return (
    <details className="docs-section" open={defaultOpen || undefined}>
      <summary className="docs-section-summary">{title}</summary>
      <div className="docs-section-content">{children}</div>
    </details>
  );
}
