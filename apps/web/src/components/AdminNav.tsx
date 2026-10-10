"use client";

import { createContext, useContext } from "react";

const AdminNavContext = createContext(false);

export function AdminNavProvider({
  isAdmin,
  children,
}: {
  readonly isAdmin: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <AdminNavContext.Provider value={isAdmin}>
      {children}
    </AdminNavContext.Provider>
  );
}

export function useAdminNav(): boolean {
  return useContext(AdminNavContext);
}
