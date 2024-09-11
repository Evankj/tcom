import { z, ZodFunction, ZodObject, ZodPromise } from 'zod'

export type APIShape<T extends { [method: string]: (...args: any) => Promise<any> }> = {
  [K in keyof T]: (args: Parameters<T[K]>[0], request: Request) => ReturnType<T[K]>
};

export type ClientShape<T extends { [method: string]: (...args: any) => Promise<any> }> = {
  [K in keyof T]: (args: Parameters<T[K]>[0]) => ReturnType<T[K]>
};

type TCOMFunction = ZodFunction<any, ZodPromise<any>>;

export function createSchema<T extends {
  [func: string]: TCOMFunction
}>(functions: T) {
  const schema = z.object(functions);
  return schema
}

export function createImplementation<T extends ZodObject<any, any, any>>(_apiInterface: T, implementation: APIShape<z.infer<T>>): APIShape<z.infer<T>> {
  return implementation;
}

export function getClient<T extends ZodObject<any, any, any>>(config: {
  url: string,
  schema: T,
  fetchConfig?: RequestInit
}): ClientShape<z.infer<typeof config.schema>> {

  let client = {} as any;

  const fetcher = async (input: URL, init?: RequestInit) => {
    const response = await fetch(input, init);
    return response.json();
  }

  Object.keys(config.schema.shape).forEach((key) => {
    client[key] = async (args: any) => {
      const response = await fetcher(new URL(key, config.url), {
        ...config.fetchConfig,
        method: 'POST',
        body: JSON.stringify(args),
      });
      return response;
    }
  });

  return client;
}

export function typedInterfaceComponents<T extends ZodObject<any, any, any>>(apiInterface: T, implementation: APIShape<z.infer<T>>) {
  return {
    apiInterface,
    implementation
  }
}

export interface TransportService {
  listen: (port: number) => void;
}
