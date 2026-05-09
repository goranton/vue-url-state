import type { QueryParamDescriptor, QueryPrimitive } from './types';

type SerializedPrimitive = string | undefined;

function hasDefaultValue<T>(options: { defaultValue?: T }): options is { defaultValue: T } {
  return options.defaultValue !== undefined;
}

function firstQueryValue(value: QueryPrimitive): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function createParamDescriptor<T, HasDefault extends boolean>(
  meta: HasDefault extends true ? { defaultValue: T } : { defaultValue?: undefined },
  serialize: (value: T) => QueryPrimitive,
  deserialize: (value: QueryPrimitive) => T | undefined,
): QueryParamDescriptor<T, HasDefault> {
  return {
    meta,
    serialize,
    deserialize,
  };
}

export interface StringParamOptions {
  defaultValue?: string;
  empty?: 'remove' | 'keep';
  trim?: boolean;
}

export function stringParam(options: StringParamOptions & { defaultValue: string }): QueryParamDescriptor<string, true>;
export function stringParam(options?: StringParamOptions): QueryParamDescriptor<string, false>;
export function stringParam(options: StringParamOptions = {}): QueryParamDescriptor<string, boolean> {
  const empty = options.empty ?? 'remove';
  const trim = options.trim ?? false;

  const serialize = (value: string): SerializedPrimitive => {
    const normalized = trim ? value.trim() : value;

    if (normalized === '' && empty === 'remove') {
      return undefined;
    }

    return normalized;
  };

  const deserialize = (value: QueryPrimitive): string | undefined => {
    const raw = firstQueryValue(value);
    if (raw === undefined) {
      return undefined;
    }

    const normalized = trim ? raw.trim() : raw;
    if (normalized === '' && empty === 'remove') {
      return undefined;
    }

    return normalized;
  };

  if (hasDefaultValue(options)) {
    return createParamDescriptor<string, true>(
      { defaultValue: options.defaultValue },
      serialize,
      deserialize,
    );
  }

  return createParamDescriptor<string, false>({}, serialize, deserialize);
}

export interface NumberParamOptions {
  defaultValue?: number;
  integer?: boolean;
  min?: number;
  max?: number;
}

export function numberParam(options: NumberParamOptions & { defaultValue: number }): QueryParamDescriptor<number, true>;
export function numberParam(options?: NumberParamOptions): QueryParamDescriptor<number, false>;
export function numberParam(options: NumberParamOptions = {}): QueryParamDescriptor<number, boolean> {
  const serialize = (value: number): SerializedPrimitive => {
    if (!Number.isFinite(value)) {
      return undefined;
    }

    let normalized = options.integer ? Math.trunc(value) : value;

    if (options.min !== undefined && normalized < options.min) {
      normalized = options.min;
    }

    if (options.max !== undefined && normalized > options.max) {
      normalized = options.max;
    }

    return String(normalized);
  };

  const deserialize = (value: QueryPrimitive): number | undefined => {
    const raw = firstQueryValue(value);
    if (raw === undefined || raw.trim() === '') {
      return undefined;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }

    let normalized = options.integer ? Math.trunc(parsed) : parsed;

    if (options.min !== undefined && normalized < options.min) {
      return undefined;
    }

    if (options.max !== undefined && normalized > options.max) {
      return undefined;
    }

    return normalized;
  };

  if (hasDefaultValue(options)) {
    return createParamDescriptor<number, true>(
      { defaultValue: options.defaultValue },
      serialize,
      deserialize,
    );
  }

  return createParamDescriptor<number, false>({}, serialize, deserialize);
}

export interface BooleanParamOptions {
  defaultValue?: boolean;
  trueValue?: string;
  falseValue?: string;
}

export function booleanParam(options: BooleanParamOptions & { defaultValue: boolean }): QueryParamDescriptor<boolean, true>;
export function booleanParam(options?: BooleanParamOptions): QueryParamDescriptor<boolean, false>;
export function booleanParam(options: BooleanParamOptions = {}): QueryParamDescriptor<boolean, boolean> {
  const trueValue = options.trueValue ?? 'true';
  const falseValue = options.falseValue ?? 'false';

  const serialize = (value: boolean): SerializedPrimitive => (value ? trueValue : falseValue);

  const deserialize = (value: QueryPrimitive): boolean | undefined => {
    const raw = firstQueryValue(value);
    if (raw === undefined) {
      return undefined;
    }

    if (raw === trueValue) {
      return true;
    }

    if (raw === falseValue) {
      return false;
    }

    return undefined;
  };

  if (hasDefaultValue(options)) {
    return createParamDescriptor<boolean, true>(
      { defaultValue: options.defaultValue },
      serialize,
      deserialize,
    );
  }

  return createParamDescriptor<boolean, false>({}, serialize, deserialize);
}

export interface EnumParamOptions<TValue extends string> {
  defaultValue?: TValue;
}

export function enumParam<const TValues extends readonly [string, ...string[]]>(
  values: TValues,
  options: EnumParamOptions<TValues[number]> & { defaultValue: TValues[number] },
): QueryParamDescriptor<TValues[number], true>;
export function enumParam<const TValues extends readonly [string, ...string[]]>(
  values: TValues,
  options?: EnumParamOptions<TValues[number]>,
): QueryParamDescriptor<TValues[number], false>;
export function enumParam<const TValues extends readonly [string, ...string[]]>(
  values: TValues,
  options: EnumParamOptions<TValues[number]> = {},
): QueryParamDescriptor<TValues[number], boolean> {
  const allowed = new Set<string>(values);

  const serialize = (value: TValues[number]): SerializedPrimitive => {
    return allowed.has(value) ? value : undefined;
  };

  const deserialize = (value: QueryPrimitive): TValues[number] | undefined => {
    const raw = firstQueryValue(value);
    if (raw === undefined || !allowed.has(raw)) {
      return undefined;
    }

    return raw as TValues[number];
  };

  if (hasDefaultValue(options)) {
    return createParamDescriptor<TValues[number], true>(
      { defaultValue: options.defaultValue },
      serialize,
      deserialize,
    );
  }

  return createParamDescriptor<TValues[number], false>({}, serialize, deserialize);
}

export interface ArrayParamOptions<TItem> {
  defaultValue?: TItem[];
  empty?: 'remove' | 'keep';
}

export function arrayParam<TItem, HasDefault extends boolean>(
  itemParam: QueryParamDescriptor<TItem, HasDefault>,
  options: ArrayParamOptions<TItem> & { defaultValue: TItem[] },
): QueryParamDescriptor<TItem[], true>;
export function arrayParam<TItem, HasDefault extends boolean>(
  itemParam: QueryParamDescriptor<TItem, HasDefault>,
  options?: ArrayParamOptions<TItem>,
): QueryParamDescriptor<TItem[], false>;
export function arrayParam<TItem, HasDefault extends boolean>(
  itemParam: QueryParamDescriptor<TItem, HasDefault>,
  options: ArrayParamOptions<TItem> = {},
): QueryParamDescriptor<TItem[], boolean> {
  const empty = options.empty ?? 'remove';

  const serialize = (value: TItem[]): string[] | undefined => {
    const result: string[] = [];

    for (const item of value) {
      const serialized = itemParam.serialize(item);

      if (Array.isArray(serialized)) {
        result.push(...serialized.filter((entry) => entry !== undefined));
        continue;
      }

      if (serialized !== undefined) {
        result.push(serialized);
      }
    }

    if (result.length === 0 && empty === 'remove') {
      return undefined;
    }

    return result;
  };

  const deserialize = (value: QueryPrimitive): TItem[] | undefined => {
    const rawItems = Array.isArray(value) ? value : value === undefined ? [] : [value];
    const result: TItem[] = [];

    for (const raw of rawItems) {
      const item = itemParam.deserialize(raw);
      if (item !== undefined) {
        result.push(item);
      }
    }

    if (result.length === 0 && empty === 'remove') {
      return undefined;
    }

    return result;
  };

  if (hasDefaultValue(options)) {
    return createParamDescriptor<TItem[], true>(
      { defaultValue: options.defaultValue },
      serialize,
      deserialize,
    );
  }

  return createParamDescriptor<TItem[], false>({}, serialize, deserialize);
}
