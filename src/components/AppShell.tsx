"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-md px-4 pb-28 pt-8">{children}</div>
      <Nav />
    </div>
  );
}
