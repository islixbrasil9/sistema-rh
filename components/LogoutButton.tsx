"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();

    setLoading(false);
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <LogOut size={16} />
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}