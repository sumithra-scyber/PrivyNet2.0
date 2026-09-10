import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
  { to: "/messages", icon: "ti-message", label: "Messages" },
  { to: "/files", icon: "ti-file", label: "Files" },
  { to: "/feedback", icon: "ti-speakerphone", label: "Feedback" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--pn-bg-soft)" }}>
      <aside
        className="flex w-16 shrink-0 flex-col items-center gap-4 border-r py-5"
        style={{ background: "var(--pn-bg-soft)", borderColor: "var(--pn-border)" }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-[10px]"
          style={{ background: "var(--pn-accent)" }}
        >
          <i className="ti ti-shield-check text-[17px] text-white" />
        </div>

        <nav className="mt-2 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-9 w-9 items-center justify-center rounded-[10px] text-[17px] ${
                  isActive ? "" : "hover:opacity-70"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: "#ffffff",
                      border: "0.5px solid var(--pn-accent-soft)",
                      color: "var(--pn-accent-strong)",
                    }
                  : { color: "#9db3af" }
              }
            >
              <i className={`ti ${item.icon}`} />
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header
          className="flex items-center justify-between border-b bg-white px-6 py-3"
          style={{ borderColor: "var(--pn-border)" }}
        >
          <span className="text-sm" style={{ color: "var(--pn-text-muted)" }}>
            Signed in as{" "}
            <span style={{ color: "var(--pn-text)" }}>{user?.full_name}</span>{" "}
            <span>({user?.role})</span>
          </span>
          <button
            onClick={logout}
            className="text-sm hover:opacity-70"
            style={{ color: "var(--pn-text-muted)" }}
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
