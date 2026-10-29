"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/session/logout", {
      method: "POST",
    });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-[#dce6e1] bg-white px-3 py-2 text-xs font-semibold text-[#354b45] transition hover:bg-[#f4faf7] sm:px-4 sm:text-sm"
    >
      Logout
    </button>
  );
}
