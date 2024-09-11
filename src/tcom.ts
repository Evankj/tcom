import { z, ZodFunction, ZodObject, ZodPromise } from 'zod'
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui';

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

type EndpointHandler = { [func: string]: z.ZodFunction<z.ZodTuple<[z.ZodObject<any, any, any>]>, any> }

export function createHonoRouter<T extends ZodObject<any, any, any>>(apiInterface: T, implementation: APIShape<z.infer<T>>, openAPITitle: string = "OpenAPI Spec"): OpenAPIHono {
  const server = new OpenAPIHono();
  const shape = apiInterface.shape;

  const endpoints = (shape as unknown as EndpointHandler);

  Object.keys(shape).forEach(endpoint => {
    const args = endpoints[endpoint]._def.args.items;
    const schema = args.length > 0 ? args[0] : {};
    server.openapi({
      path: endpoint,
      method: "post",
      request: {
        body: {
          content: {
            "application/json": {
              schema: schema
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: endpoints[endpoint].returnType().unwrap()
            }
          },
          description: "" // TODO: investigate if it's worth the boilerplate required for users to add custom "description" fields for endpoints
        }
      }
    }, async (c) => {

      console.log(await c.req.json())
      const args = await c.req.json();
      const res = await implementation[endpoint](args ?? {}, c.req.raw);
      return c.json(res);
    });
  });
  server.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "0.0.1",
      title: openAPITitle,
    },
  })
  server.get("/ui", swaggerUI({ url: "/doc" }));

  return server;
}
