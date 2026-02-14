import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { MentionUser } from "@/hooks/useMentions";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  users: MentionUser[];
  onFocus?: () => void;
  className?: string;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  users,
  onFocus,
  className,
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const checkForMention = useCallback(
    (text: string, cursorPos: number) => {
      // Look backwards from cursor for @
      const beforeCursor = text.slice(0, cursorPos);
      const lastAt = beforeCursor.lastIndexOf("@");

      if (lastAt === -1) {
        setShowSuggestions(false);
        return;
      }

      // Check if @ is at start or preceded by space/newline
      if (lastAt > 0 && !/[\s]/.test(beforeCursor[lastAt - 1])) {
        setShowSuggestions(false);
        return;
      }

      const query = beforeCursor.slice(lastAt + 1);
      // No space in query means still typing mention
      if (query.includes(" ") && query.length > 20) {
        setShowSuggestions(false);
        return;
      }

      const filtered = users.filter((u) =>
        u.full_name.toLowerCase().includes(query.toLowerCase())
      );

      setMentionQuery(query);
      setMentionStart(lastAt);
      setFilteredUsers(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    },
    [users]
  );

  const insertMention = (user: MentionUser) => {
    if (mentionStart === -1) return;
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + mentionQuery.length);
    const hasSpace = user.full_name.includes(" ");
    const mention = hasSpace ? `@"${user.full_name}"` : `@${user.full_name}`;
    const newValue = before + mention + " " + after;
    onChange(newValue);
    setShowSuggestions(false);

    // Focus back
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = before.length + mention.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredUsers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (filteredUsers[selectedIndex]) {
        e.preventDefault();
        insertMention(filteredUsers[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    checkForMention(newValue, e.target.selectionStart || 0);
  };

  const handleClick = () => {
    if (textareaRef.current) {
      checkForMention(value, textareaRef.current.selectionStart || 0);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onFocus={() => {
          onFocus?.();
          if (textareaRef.current) {
            checkForMention(value, textareaRef.current.selectionStart || 0);
          }
        }}
        placeholder={placeholder}
        className={`min-h-[60px] resize-none ${className || ""}`}
      />
      {showSuggestions && (
        <div className="absolute bottom-full left-0 mb-1 w-full bg-popover border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              type="button"
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${
                index === selectedIndex ? "bg-accent" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(user);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {user.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{user.full_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
