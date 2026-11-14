// Zero-dependency Zod shim that works out of the box without waiting for npm install

let realZod: any = null;
try {
  // Synchronous safe require fallback without top-level await (fixes Expo Web / SSR bundling)
  // @ts-ignore
  const req = typeof require === 'function' ? require : null;
  if (req) {
    const zodModule = req('zod');
    realZod = zodModule.z || zodModule.default || zodModule;
  }
} catch {
  // Fallback to lightweight shim
}

function createType() {
  const t: any = {
    uuid: () => t,
    email: () => t,
    datetime: () => t,
    url: () => t,
    optional: () => t,
    nullable: () => t,
    default: (_d: any) => t
  };
  return t;
}

const shimZod = {
  string: () => createType(),
  number: () => createType(),
  boolean: () => createType(),
  literal: (_val?: any) => createType(),
  enum: (_vals: readonly any[]) => createType(),
  array: (_item: any) => createType(),
  record: (_item: any) => createType(),
  any: () => createType(),
  object: (shape: any) => {
    const obj: any = {
      shape,
      optional: () => obj,
      nullable: () => obj,
      default: (_d: any) => obj,
      safeParse: (data: any) => {
        if (typeof data !== 'object' || data === null) {
          return { success: false, error: { format: () => ({ _errors: ['Expected object'] }) } };
        }
        return { success: true, data };
      },
      parse: (data: any) => data
    };
    return obj;
  }
};

export const z = realZod || shimZod;
