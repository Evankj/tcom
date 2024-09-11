import { createImplementation, getClient, createHonoRouter, createSchema } from './tcom'
import { z } from 'zod';
import {mock} from 'bun:test'

const schema = createSchema({
  /**
    * SOME DOCUMENTATION
    * @example ```ts 
    * console.log(x)
    * ```
    */
  test: z.function().args(z.object({ str: z.string() })).returns(z.promise(z.boolean()))
})

const app = createImplementation(schema, {
  test: async (_, req) => {
    return req.headers.get("Authorization") ? true : false
  }
})

const server = createHonoRouter(schema, app, "")

const client = getClient({
  schema,
  url: ""
});

const x = await client.test({
  str: "beans"
});
