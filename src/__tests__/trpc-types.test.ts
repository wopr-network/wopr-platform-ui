import { describe, expect, it } from "vitest";
import type { AppRouter } from "@/lib/trpc-types";

/**
 * Type-level tests for the AppRouter stub.
 *
 * These verify that the type contract declared in trpc-types.ts
 * includes all router namespaces the UI depends on. If a namespace
 * is removed from the stub, these tests fail at type-check time
 * (tsc --noEmit / npm run check), catching the breakage before runtime.
 */
describe("trpc-types AppRouter contract", () => {
  it("declares all expected router namespaces", () => {
    type Router = AppRouter["_def"]["record"];
    type _PageContext = Router["pageContext"];
    type _Admin = Router["admin"];
    type _Billing = Router["billing"];
    type _Fleet = Router["fleet"];
    type _Promotions = Router["promotions"];
    type _RateOverrides = Router["rateOverrides"];
    type _Settings = Router["settings"];
    type _Capabilities = Router["capabilities"];
    type _AuthSocial = Router["authSocial"];
    // If we get here, the type compiles — all namespaces exist
    expect(true).toBe(true);
  });

  it("billing namespace has critical procedures", () => {
    type Billing = AppRouter["_def"]["record"]["billing"];
    type _CurrentPlan = Billing["currentPlan"];
    type _CreditsBalance = Billing["creditsBalance"];
    type _CreditsCheckout = Billing["creditsCheckout"];
    type _ApplyCoupon = Billing["applyCoupon"];
    type _PortalSession = Billing["portalSession"];
    type _AutoTopupSettings = Billing["autoTopupSettings"];
    type _AccountStatus = Billing["accountStatus"];
    expect(true).toBe(true);
  });

  it("fleet namespace has instance management procedures", () => {
    type Fleet = AppRouter["_def"]["record"]["fleet"];
    type _ListInstances = Fleet["listInstances"];
    type _GetInstance = Fleet["getInstance"];
    type _CreateInstance = Fleet["createInstance"];
    type _ControlInstance = Fleet["controlInstance"];
    type _GetInstanceHealth = Fleet["getInstanceHealth"];
    type _GetInstanceLogs = Fleet["getInstanceLogs"];
    type _GetInstanceMetrics = Fleet["getInstanceMetrics"];
    type _ListTemplates = Fleet["listTemplates"];
    expect(true).toBe(true);
  });

  it("promotions namespace has CRUD and coupon procedures", () => {
    type Promos = AppRouter["_def"]["record"]["promotions"];
    type _List = Promos["list"];
    type _Create = Promos["create"];
    type _Update = Promos["update"];
    type _Activate = Promos["activate"];
    type _Pause = Promos["pause"];
    type _Cancel = Promos["cancel"];
    type _GenerateCouponBatch = Promos["generateCouponBatch"];
    expect(true).toBe(true);
  });

  it("capabilities namespace has key and settings procedures", () => {
    type Caps = AppRouter["_def"]["record"]["capabilities"];
    type _StoreKey = Caps["storeKey"];
    type _TestKey = Caps["testKey"];
    type _ListCapabilitySettings = Caps["listCapabilitySettings"];
    type _ListCapabilityMeta = Caps["listCapabilityMeta"];
    expect(true).toBe(true);
  });

  it("admin namespace has inference and billingHealth", () => {
    type Admin = AppRouter["_def"]["record"]["admin"];
    type _Inference = Admin["inference"];
    type _BillingHealth = Admin["billingHealth"];
    expect(true).toBe(true);
  });
});
