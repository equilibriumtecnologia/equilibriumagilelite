import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useDowngradeQueue } from "@/hooks/useDowngradeQueue";

/**
 * Centralizes read-only enforcement for workspaces/projects
 * in the downgrade queue (grace_period or suspended).
 */
export function useReadOnly(projectId?: string) {
  const { currentWorkspace } = useWorkspace();
  const {
    isWorkspaceSuspended,
    isWorkspaceInGracePeriod,
    isProjectReadOnly: isProjectInQueue,
    queueItems,
    isLoading,
  } = useDowngradeQueue();

  const workspaceId = currentWorkspace?.id;

  const isWorkspaceReadOnly = workspaceId
    ? isWorkspaceSuspended(workspaceId) || isWorkspaceInGracePeriod(workspaceId)
    : false;

  const isProjectReadOnly = projectId ? isProjectInQueue(projectId) : false;

  // Either workspace-level or project-level restriction
  const isReadOnly = isWorkspaceReadOnly || isProjectReadOnly;

  const readOnlyReason = isWorkspaceReadOnly
    ? "Este workspace está em período de carência ou suspenso devido a um downgrade de plano."
    : isProjectReadOnly
    ? "Este projeto está em modo somente leitura devido a um downgrade de plano."
    : null;

  return {
    isReadOnly,
    isWorkspaceReadOnly,
    isProjectReadOnly,
    readOnlyReason,
    isLoading,
  };
}
