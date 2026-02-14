import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MentionUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

/**
 * Extract @mentions from text. Matches @Name or @"Full Name"
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@"([^"]+)"|@(\S+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1] || match[2]);
  }
  return mentions;
}

/**
 * Create notifications for mentioned users
 */
export async function notifyMentions(
  text: string,
  users: MentionUser[],
  taskId: string,
  taskTitle: string,
  triggeredBy: string
) {
  const mentionedNames = extractMentions(text);
  if (mentionedNames.length === 0) return;

  const normalizedMentions = mentionedNames.map(n => n.toLowerCase());
  const mentionedUsers = users.filter(u => {
    const fullNameLower = u.full_name.toLowerCase();
    const firstName = fullNameLower.split(" ")[0];
    return normalizedMentions.some(m => fullNameLower === m || firstName === m);
  });

  // Don't notify yourself
  const toNotify = mentionedUsers.filter(u => u.id !== triggeredBy);
  if (toNotify.length === 0) return;

  const notifications = toNotify.map(u => ({
    user_id: u.id,
    type: "mention",
    title: "Você foi mencionado",
    message: `Você foi mencionado em um comentário na tarefa "${taskTitle}"`,
    task_id: taskId,
    triggered_by: triggeredBy,
  }));

  await supabase.from("notifications").insert(notifications);
}

export function useMentions(projectId?: string) {
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadUsers = async () => {
    if (loaded || !projectId) return;
    const { data } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId);

    if (data && data.length > 0) {
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      if (profiles) {
        setMentionUsers(profiles);
      }
    }
    setLoaded(true);
  };

  return { mentionUsers, loadUsers };
}
