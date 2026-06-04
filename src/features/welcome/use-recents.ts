import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipc } from "@/lib/ipc";

const KEY = ["recents"] as const;

export function useRecents() {
  return useQuery({ queryKey: KEY, queryFn: ipc.listRecents });
}

export function useRecentMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });
  return {
    remove: useMutation({ mutationFn: ipc.removeRecent, onSuccess: invalidate }),
    clear: useMutation({ mutationFn: ipc.clearRecents, onSuccess: invalidate }),
  };
}
