import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-[#d8ded3] bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-pitch disabled:cursor-not-allowed disabled:bg-[#f1f2ef]",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";

export { Select };
