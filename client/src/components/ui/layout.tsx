import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  // Semplificato per essere un wrapper di base, dato che AppNavigation ora gestisce la struttura principale.
  return (
    <div className={cn(
      "min-h-screen bg-background font-sans antialiased",
      className
    )}>
      {children}
    </div>
  );
}

export function PageHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between space-y-2", className)}>
      {children}
    </div>
  );
}

export function PageTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1 className={cn(
      "text-2xl font-semibold tracking-tight",
      className
    )}>
      {children}
    </h1>
  );
}
