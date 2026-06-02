import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-1 text-xs font-bold", {
  variants: {
    variant: {
      default: "bg-[#e8f3ec] text-pitch",
      destructive: "bg-coral text-white",
      subtle: "bg-white/10 text-[#d9efe7]"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
