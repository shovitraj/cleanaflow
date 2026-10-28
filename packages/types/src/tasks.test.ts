import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateTaskPrice, clampTaskHours, isTaskCategory } from "./tasks";

describe("Task pricing - calculateTaskPrice()", () => {
  it("prices a 2-hour task at $50/hr with trust fee and commission", () => {
    const p = calculateTaskPrice(5000, 2);
    assert.strictEqual(p.subtotalCents, 10000);
    assert.strictEqual(p.trustFeeCents, 1500);
    assert.strictEqual(p.totalCents, 11500);
    assert.strictEqual(p.taskerPayoutCents, 9000);
    assert.strictEqual(p.platformRevenueCents, 2500);
  });

  it("clamps hours to the allowed range", () => {
    assert.strictEqual(clampTaskHours(0), 1);
    assert.strictEqual(clampTaskHours(99), 12);
    assert.strictEqual(clampTaskHours(NaN), 1);
    assert.strictEqual(clampTaskHours(2.5), 2.5);
  });

  it("customer total equals tasker payout plus platform revenue", () => {
    const p = calculateTaskPrice(4333, 3.5);
    assert.strictEqual(p.totalCents, p.taskerPayoutCents + p.platformRevenueCents);
  });

  it("validates categories", () => {
    assert.strictEqual(isTaskCategory("MOVING_HELP"), true);
    assert.strictEqual(isTaskCategory("NOPE"), false);
  });
});
