// src/lib/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}