import type { backendInterface } from "./backend";
import { createActorWithConfig } from "./config";

let actorInstance: backendInterface | null = null;

async function getActor(): Promise<backendInterface> {
  if (!actorInstance) {
    actorInstance = await createActorWithConfig();
  }
  return actorInstance;
}

export const backend: backendInterface = new Proxy({} as backendInterface, {
  get(_target, prop: string) {
    return (...args: unknown[]) =>
      getActor().then((actor) =>
        (actor as unknown as Record<string, (...a: unknown[]) => unknown>)[
          prop
        ](...args),
      );
  },
});
