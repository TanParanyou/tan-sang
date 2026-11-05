/**
 * Functional Result Pattern for Enterprise Application Layer
 */

export type Result<T, E = Error> =
  | { ok: true; value: T; error?: never }
  | { ok: false; error: E; value?: never };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T; error?: never } {
  return result.ok === true;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E; value?: never } {
  return result.ok === false;
}
