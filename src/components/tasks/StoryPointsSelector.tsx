import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Hash } from "lucide-react";

interface StoryPointsSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

// Fibonacci sequence for story points
const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];

export function StoryPointsSelector({
  value,
  onChange,
  disabled,
}: StoryPointsSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5",
            value && "bg-primary/10 border-primary/50"
          )}
          disabled={disabled}
        >
          <Hash className="h-3.5 w-3.5" />
          {value ?? "SP"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground px-2 pb-1">
            Story Points
          </p>
          <div className="flex gap-1">
            {STORY_POINTS.map((points) => (
              <Button
                key={points}
                variant={value === points ? "default" : "outline"}
                size="sm"
                className="w-9 h-9 p-0"
                onClick={() => onChange(points)}
              >
                {points}
              </Button>
            ))}
          </div>
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 text-xs"
              onClick={() => onChange(null)}
            >
              Remover
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
