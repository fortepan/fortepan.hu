import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ url: 'http://localhost:4001/graphql', token: 'ebb20c574667a9ccbad5fc85104e4cf4a3171ac0', queries });
export default client;
  