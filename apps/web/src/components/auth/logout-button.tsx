"use client";

import { useRouter } from "next/navigation";

import { authCookieKeys } from "@/lib/auth/access";

function expireCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    expireCookie(authCookieKeys.username);
    expireCookie(authCookieKeys.displayName);
    expireCookie(authCookieKeys.role);
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-200 transition hover:border-stone-300 hover:bg-white/5"
    >
      Logout
    </button>
  );
}
