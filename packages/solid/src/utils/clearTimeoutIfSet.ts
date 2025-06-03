import { MaybeAccessor } from "@solid-primitives/utils";

export function clearTimeoutIfSet(timeoutRef: number) {
  if (timeoutRef !== -1) {
    clearTimeout(timeoutRef);
    timeoutRef = -1;
  }
}
