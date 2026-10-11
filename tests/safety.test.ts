import { describe, it, expect } from "vitest";
import { validateOutdoorSafety } from "@/lib/safety/outdoor-safety";

describe("Outdoor Safety Validator", () => {
  it("approves safe outdoor observations", () => {
    const safeText = "Observe the difference in moisture along the north-facing brick wall.";
    const result = validateOutdoorSafety(safeText);
    expect(result.isSafe).toBe(true);
    expect(result.warnings.length).toBe(0);
    expect(result.mandatoryPrecautions.length).toBeGreaterThan(0);
  });

  it("flags instructions to ingest wild plants or fungi", () => {
    const toxicText = "Taste the small red berries to check for bitterness.";
    const result = validateOutdoorSafety(toxicText);
    expect(result.isSafe).toBe(false);
    expect(result.warnings.some((w) => w.includes("taste or ingest"))).toBe(true);
  });

  it("flags handling unknown mushrooms or toadstools", () => {
    const fungalText = "Touch the mushroom cap to feel its spore texture.";
    const result = validateOutdoorSafety(fungalText);
    expect(result.isSafe).toBe(false);
    expect(result.warnings.some((w) => w.includes("Observe fungi with your eyes"))).toBe(true);
  });

  it("flags trespassing or private land entry", () => {
    const trespassText = "Climb fence into private property behind the warehouse.";
    const result = validateOutdoorSafety(trespassText);
    expect(result.isSafe).toBe(false);
    expect(result.warnings.some((w) => w.includes("private property"))).toBe(true);
  });

  it("flags proximity to active vehicular traffic", () => {
    const trafficText = "Step near the busy road shoulder to observe ditch water runoff.";
    const result = validateOutdoorSafety(trafficText);
    expect(result.isSafe).toBe(false);
    expect(result.warnings.some((w) => w.includes("roadway"))).toBe(true);
  });

  it("flags disturbing animal nests or wildlife", () => {
    const wildlifeText = "Trap the bird or corner the animal to inspect its feather pattern.";
    const result = validateOutdoorSafety(wildlifeText);
    expect(result.isSafe).toBe(false);
    expect(result.warnings.some((w) => w.includes("wildlife"))).toBe(true);
  });
});
