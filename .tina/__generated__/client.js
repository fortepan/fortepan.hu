import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ url: 'http://localhost:4001/graphql', token: '7cf630f1ba919d1eeaa8ffb4200976a2c77e6453', queries });
export default client;
  