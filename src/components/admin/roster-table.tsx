"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/app/actions/admin";

interface Row {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
}

export function RosterTable({ rows }: { rows: Row[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggleRole(id: string, current: string) {
    startTransition(async () => {
      await setUserRole(id, current === "admin" ? "employee" : "admin");
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-ink-3">
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Email</th>
            <th className="pb-2 font-medium">Role</th>
            <th className="pb-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="py-2.5 text-ink">{r.full_name ?? "—"}</td>
              <td className="py-2.5 text-ink-2">{r.email}</td>
              <td className="py-2.5">
                <span className="rounded-full bg-paper-3 px-2 py-0.5 text-xs font-medium text-ink-2">{r.role}</span>
              </td>
              <td className="py-2.5 text-right">
                <button
                  disabled={pending}
                  onClick={() => toggleRole(r.id, r.role)}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  {r.role === "admin" ? "Make employee" : "Make admin"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
