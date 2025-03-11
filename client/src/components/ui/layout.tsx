import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-background",
      "font-sans antialiased",
      className
    )}>
      <main className="flex min-h-screen flex-col">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {children}
        </div>
      </main>
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
