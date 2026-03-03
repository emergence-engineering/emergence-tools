import { createContext, useContext, useState, type ReactNode } from "react";

type PackageManager = "npm" | "pnpm" | "yarn";

interface PackageManagerContextValue {
  packageManager: PackageManager;
  setPackageManager: (pm: PackageManager) => void;
}

const PackageManagerContext = createContext<PackageManagerContextValue>({
  packageManager: "npm",
  setPackageManager: () => {},
});

export function PackageManagerProvider({ children }: { children: ReactNode }) {
  const [packageManager, setPackageManager] = useState<PackageManager>(() => {
    const stored = localStorage.getItem("packageManager");
    return stored === "pnpm" || stored === "yarn" ? stored : "npm";
  });

  const set = (pm: PackageManager) => {
    setPackageManager(pm);
    localStorage.setItem("packageManager", pm);
  };

  return (
    <PackageManagerContext.Provider
      value={{ packageManager, setPackageManager: set }}
    >
      {children}
    </PackageManagerContext.Provider>
  );
}

export function usePackageManager() {
  return useContext(PackageManagerContext);
}
