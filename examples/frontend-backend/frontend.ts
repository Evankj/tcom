import { schema } from './backend'
import { getClient } from '../../src/tcom'

const client = getClient({
  schema,
  url: "http://localhost:3000",
});

const result = await client.add({
  num1: 5,
  num2: 6
});

console.log(result);
