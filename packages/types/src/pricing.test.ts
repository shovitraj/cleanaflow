import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateEstimate, BED_RATE_CENTS, BATH_RATE_CENTS, ADDON_PRICING_CENTS } from "./pricing";

describe("Pricing Engine - calculateEstimate()", () => {
  it("calculates basic 1-bed 1-bath clean with no add-ons (One-Time)", () => {
    const breakdown = calculateEstimate({
      basePriceCents: 12000,
      bedrooms: 1,
      bathrooms: 1,
      plan: "ONE_TIME"
    });

    // 12000 (base) + 2500 (1 bed) + 3000 (1 bath) = 17500 ($175.00)
    assert.strictEqual(breakdown.subtotalCents, 17500);
    assert.strictEqual(breakdown.discountPercent, 0);
    assert.strictEqual(breakdown.discountCents, 0);
    assert.strictEqual(breakdown.firstCleanTotalCents, 17500);
    assert.strictEqual(breakdown.platformFeeCents, Math.round(17500 * 0.30));
    assert.strictEqual(breakdown.cleanerPayoutCents, 17500 - breakdown.platformFeeCents);
  });

  it("applies 30% discount for Weekly subscription", () => {
    const breakdown = calculateEstimate({
      basePriceCents: 12000,
      bedrooms: 2,
      bathrooms: 2,
      plan: "WEEKLY"
    });

    // 12000 + 5000 (2 bed) + 6000 (2 bath) = 23000
    assert.strictEqual(breakdown.subtotalCents, 23000);
    assert.strictEqual(breakdown.discountPercent, 30);
    // 30% of 23000 = 6900
    assert.strictEqual(breakdown.discountCents, 6900);
    assert.strictEqual(breakdown.firstCleanTotalCents, 16100);
    assert.strictEqual(breakdown.recurringCleanTotalCents, 23000);
  });

  it("applies 20% discount for Bi-Weekly subscription", () => {
    const breakdown = calculateEstimate({
      basePriceCents: 10000,
      bedrooms: 3,
      bathrooms: 2,
      plan: "BIWEEKLY"
    });

    // 10000 + 7500 (3 bed) + 6000 (2 bath) = 23500
    assert.strictEqual(breakdown.subtotalCents, 23500);
    assert.strictEqual(breakdown.discountPercent, 20);
    assert.strictEqual(breakdown.discountCents, 4700);
    assert.strictEqual(breakdown.firstCleanTotalCents, 18800);
  });

  it("applies 10% discount for Monthly subscription", () => {
    const breakdown = calculateEstimate({
      basePriceCents: 12000,
      bedrooms: 1,
      bathrooms: 1,
      plan: "MONTHLY"
    });

    // 12000 + 2500 + 3000 = 17500
    // 10% discount = 1750
    assert.strictEqual(breakdown.discountPercent, 10);
    assert.strictEqual(breakdown.discountCents, 1750);
    assert.strictEqual(breakdown.firstCleanTotalCents, 15750);
  });

  it("correctly includes all add-on pricing", () => {
    const breakdown = calculateEstimate({
      basePriceCents: 12000,
      bedrooms: 2,
      bathrooms: 1,
      addOns: {
        fridge: true,  // 3500
        oven: true,    // 3500
        windows: true, // 4000
        laundry: true  // 3000
      },
      plan: "ONE_TIME"
    });

    const expectedAddOns = 3500 + 3500 + 4000 + 3000; // 14000
    assert.strictEqual(breakdown.addOnTotalCents, expectedAddOns);
    // Base 12000 + 5000 + 3000 + 14000 = 34000 ($340.00)
    assert.strictEqual(breakdown.subtotalCents, 34000);
    assert.strictEqual(breakdown.firstCleanTotalCents, 34000);
  });
});
