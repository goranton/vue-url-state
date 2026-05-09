export function isSameValue(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    for (let i = 0; i < left.length; i += 1) {
      if (!Object.is(left[i], right[i])) {
        return false;
      }
    }

    return true;
  }

  return Object.is(left, right);
}

export function cloneStateValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return [...value] as T;
  }

  return value;
}

export function cloneStateObject<T extends Record<string, unknown>>(state: T): T {
  const result = {} as T;

  for (const key of Object.keys(state) as Array<keyof T>) {
    result[key] = cloneStateValue(state[key]);
  }

  return result;
}
