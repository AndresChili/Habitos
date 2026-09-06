"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-md flex-1 px-4 pb-4 pt-6">{children}</div>
      <Nav />
    </div>
  );
}
