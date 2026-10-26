"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status, update } = useSession();

  const isCustomer = session?.user?.role === "CUSTOMER";
  const isCleaner = session?.user?.role === "CLEANER";
  const isAdmin = session?.user?.role === "ADMIN";
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  return {
    session,
    user: session?.user,
    role: session?.user?.role,
    cleanerProfileId: session?.user?.cleanerProfileId,
    isAuthenticated,
    isLoading,
    isCustomer,
    isCleaner,
    isAdmin,
    signIn,
    signOut,
    update
  };
}
