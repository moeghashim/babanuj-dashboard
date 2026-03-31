/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as channelMetrics from "../channelMetrics.js";
import type * as customerInvites from "../customerInvites.js";
import type * as customers from "../customers.js";
import type * as financeShared from "../financeShared.js";
import type * as invoices from "../invoices.js";
import type * as memberships from "../memberships.js";
import type * as payments from "../payments.js";
import type * as reportingPeriods from "../reportingPeriods.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  channelMetrics: typeof channelMetrics;
  customerInvites: typeof customerInvites;
  customers: typeof customers;
  financeShared: typeof financeShared;
  invoices: typeof invoices;
  memberships: typeof memberships;
  payments: typeof payments;
  reportingPeriods: typeof reportingPeriods;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
