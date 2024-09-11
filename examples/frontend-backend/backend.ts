import { createHonoRouter, createImplementation, createSchema } from "../../src/tcom";
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

const router = createHonoRouter(schema, app);

export default router;
