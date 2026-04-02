import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY],
    queryFn: async () => {
      const actor = await createActorWithConfig();
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      if (
        typeof (actor as unknown as Record<string, unknown>)
          ._initializeAccessControlWithSecret === "function"
      ) {
        await (
          actor as unknown as Record<string, (...args: unknown[]) => unknown>
        )._initializeAccessControlWithSecret(adminToken);
      }
      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
