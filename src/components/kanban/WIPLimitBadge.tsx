import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WIPLimitBadgeProps {
  count: number;
  limit: number | null;
  status: "normal" | "warning" | "exceeded";
}

export function WIPLimitBadge({ count, limit, status }: WIPLimitBadgeProps) {
  if (!limit) {
    return <Badge variant="outline">{count}</Badge>;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1 transition-colors",
        status === "warning" && "border-yellow-500 bg-yellow-500/10 text-yellow-600",
        status === "exceeded" && "border-destructive bg-destructive/10 text-destructive"
      )}
    >
      {status === "exceeded" && <AlertTriangle className="h-3 w-3" />}
      {count}/{limit}
    </Badge>
  );
}
