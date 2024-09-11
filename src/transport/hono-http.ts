import type { z, ZodObject } from "zod";
import type { APIShape, TransportService, typedInterfaceComponents } from "../tcom";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

type EndpointHandler = { [func: string]: z.ZodFunction<z.ZodTuple<[z.ZodObject<any, any, any>]>, any> }

export class HonoHTTPTransport implements TransportService {

  private server: OpenAPIHono;

  constructor(api: ReturnType<typeof typedInterfaceComponents>, openAPITitle: string) {
    this.server = this.createHonoRouter(api.apiInterface, api.implementation, openAPITitle);
  }

  listen(port: number) {
    return {
      fetch: this.server.fetch,
      port
    }
  }

  private createHonoRouter<T extends ZodObject<any, any, any>>(apiInterface: T, implementation: APIShape<z.infer<T>>, openAPITitle: string = "OpenAPI Spec"): OpenAPIHono {
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
}

