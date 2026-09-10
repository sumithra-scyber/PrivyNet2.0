import { useAuth } from "../auth/AuthContext";
import { AppLayout } from "../components/AppLayout";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <p
        className="mb-1 text-[22px] font-medium tracking-tight"
        style={{ color: "var(--pn-text)" }}
      >
        Welcome, {user?.full_name}
      </p>
      <p className="mb-6 text-sm" style={{ color: "var(--pn-text-muted)" }}>
        Here's a quick look at your account.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs" style={{ color: "var(--pn-text-muted)" }}>
            Email
          </p>
          <p className="text-[17px] font-medium" style={{ color: "var(--pn-text)" }}>
            {user?.email}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--pn-text-muted)" }}>
            Role
          </p>
          <p className="text-[17px] font-medium" style={{ color: "var(--pn-text)" }}>
            {user?.role}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
