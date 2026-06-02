import * as React from "react";
import { cn } from "@/lib/utils";

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex rounded-lg border border-[#dfe5d8] bg-white p-1 shadow-soft", className)} {...props} />;
}

function TabsTrigger({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex-1 rounded-md px-3 py-2 text-sm font-semibold capitalize transition-colors tap-highlight",
        active ? "bg-ink text-white" : "text-[#586257] hover:bg-[#eef4e9] hover:text-ink",
        className
      )}
      {...props}
    />
  );
}

export { TabsList, TabsTrigger };
