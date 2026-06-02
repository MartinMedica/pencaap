import Image from "next/image";
import { teamFlagUrl, teamName } from "@/lib/fixture";
import { cn } from "@/lib/utils";

type TeamLabelProps = {
  teamId: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-5 w-7",
  md: "h-7 w-10",
  lg: "h-10 w-14"
};

export function TeamLabel({ teamId, name = teamName(teamId), size = "md", className }: TeamLabelProps) {
  const flagUrl = teamFlagUrl(teamId);

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      {flagUrl ? (
        <Image
          className={cn("shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/10", sizes[size])}
          src={flagUrl}
          alt={`Bandera de ${name}`}
          width={80}
          height={56}
        />
      ) : (
        <span className={cn("shrink-0 rounded-sm bg-[#d8ded3] ring-1 ring-black/10", sizes[size])} />
      )}
      <span className="truncate">{name}</span>
    </span>
  );
}
