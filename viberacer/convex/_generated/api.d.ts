/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as adminData from "../adminData.js";
import type * as auth from "../auth.js";
import type * as clearContestState from "../clearContestState.js";
import type * as clearWinners from "../clearWinners.js";
import type * as config from "../config.js";
import type * as contestConfig from "../contestConfig.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as myFunctions from "../myFunctions.js";
import type * as race from "../race.js";
import type * as seed from "../seed.js";
import type * as stageHandlers from "../stageHandlers.js";
import type * as stageMonitor from "../stageMonitor.js";
import type * as winners from "../winners.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminData: typeof adminData;
  auth: typeof auth;
  clearContestState: typeof clearContestState;
  clearWinners: typeof clearWinners;
  config: typeof config;
  contestConfig: typeof contestConfig;
  events: typeof events;
  http: typeof http;
  init: typeof init;
  myFunctions: typeof myFunctions;
  race: typeof race;
  seed: typeof seed;
  stageHandlers: typeof stageHandlers;
  stageMonitor: typeof stageMonitor;
  winners: typeof winners;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
