import { createImplementation, createSchema, typedInterfaceComponents } from "../../src/tcom";
import { HonoHTTPTransport } from '../../src/transport/hono-http'
import { z } from 'zod';

export const schema = createSchema({
  /**
    * Add two numbers together!
    */
  add: z.function().args(z.object({
    num1: z.number(),
    num2: z.number()
  })).returns(z.promise(z.number()))
});

const app = createImplementation(schema, {
  add: async ({ num1, num2 }) => {
    return num1 + num2
  }
});

const server = new HonoHTTPTransport(typedInterfaceComponents(schema, app), "Test API");

export default server.listen(3000);
