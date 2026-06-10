import { type ReactNode, cloneElement, isValidElement } from "react";
import { useAuth, type AppRole } from "@/hooks/use-auth";

const RANK: Record<AppRole, number> = { reader: 1, editor: 2, admin: 3 };

type Props = {
  min?: AppRole;
  children: ReactNode;
  /** When user lacks role: 'disable' (default) wraps and disables buttons, 'hide' returns null */
  mode?: "disable" | "hide";
  fallbackTitle?: string;
};

/**
 * Gate UI by role. Default min is 'editor' so reader-only users see the UI but
 * controls are disabled. Admin always passes.
 */
export function RoleGate({ min = "editor", children, mode = "disable", fallbackTitle }: Props) {
  const { role } = useAuth();
  const ok = !!role && RANK[role] >= RANK[min];
  if (ok) return <>{children}</>;
  if (mode === "hide") return null;

  const title = fallbackTitle ?? `Hanya untuk ${min === "admin" ? "Admin" : "Editor/Admin"}`;

  // If single React element, clone with disabled
  if (isValidElement(children)) {
    return cloneElement(children as any, { disabled: true, title });
  }
  return (
    <span title={title} className="pointer-events-none opacity-60">
      {children}
    </span>
  );
}

export function useCanEdit() {
  const { canEdit } = useAuth();
  return canEdit;
}
