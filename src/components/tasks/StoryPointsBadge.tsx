import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";

interface StoryPointsBadgeProps {
  points: number | null;
  size?: "sm" | "md";
}

export function StoryPointsBadge({ points, size = "sm" }: StoryPointsBadgeProps) {
  if (!points) return null;

  return (
    <Badge
      variant="outline"
      className={`bg-primary/10 border-primary/30 text-primary ${
        size === "sm" ? "text-xs px-1.5 py-0" : "text-sm px-2 py-0.5"
      }`}
    >
      <Hash className={size === "sm" ? "h-3 w-3 mr-0.5" : "h-3.5 w-3.5 mr-1"} />
      {points}
    </Badge>
  );
}
