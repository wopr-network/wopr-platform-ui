import { describe, expect, it } from "vitest";
import { capabilityMeta, mergeApiRates, pricingData } from "@/lib/pricing-data";

describe("pricing-data", () => {
  describe("pricingData", () => {
    it("matches snapshot", () => {
      expect(pricingData).toMatchSnapshot();
    });

    it("has expected bot price", () => {
      expect(pricingData.bot_price).toEqual({ amount: 5, period: "month" });
    });

    it("has expected signup credit", () => {
      expect(pricingData.signup_credit).toBe(5);
    });

    it("has expected number of capability categories", () => {
      expect(pricingData.capabilities).toHaveLength(4);
    });
  });

  describe("capabilityMeta", () => {
    it("matches snapshot", () => {
      expect(capabilityMeta).toMatchSnapshot();
    });

    it("maps all expected backend keys", () => {
      expect(Object.keys(capabilityMeta).sort()).toEqual(["image_gen", "llm", "sms", "stt", "tts"]);
    });
  });

  describe("mergeApiRates", () => {
    it("merges and orders known capabilities by category order", () => {
      const apiRates = {
        llm: [{ name: "TestLLM", unit: "1M tokens", price: 1.0 }],
        tts: [{ name: "TestTTS", unit: "1K chars", price: 0.1 }],
        stt: [{ name: "TestSTT", unit: "minute", price: 0.02 }],
        image_gen: [{ name: "TestImg", unit: "image", price: 0.03 }],
        sms: [{ name: "TestSMS", unit: "message", price: 0.01 }],
      };

      const result = mergeApiRates(apiRates);
      expect(result).toMatchSnapshot();

      // Verify ordering: Text Generation, Voice, Image Generation, Messaging
      expect(result.map((c) => c.category)).toEqual([
        "Text Generation",
        "Voice",
        "Image Generation",
        "Messaging",
      ]);
    });

    it("groups tts and stt into Voice category", () => {
      const apiRates = {
        tts: [{ name: "TTS", unit: "1K chars", price: 0.1 }],
        stt: [{ name: "STT", unit: "minute", price: 0.02 }],
      };

      const result = mergeApiRates(apiRates);
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("Voice");
      expect(result[0].models).toHaveLength(2);
    });

    it("falls back to capitalized key for unknown capabilities", () => {
      const apiRates = {
        custom_thing: [{ name: "Custom", unit: "call", price: 0.5 }],
      };

      const result = mergeApiRates(apiRates);
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("Custom Thing");
      expect(result[0].icon).toBe("bot");
    });

    it("sorts unknown capabilities after known ones", () => {
      const apiRates = {
        unknown_cap: [{ name: "Unknown", unit: "unit", price: 1.0 }],
        llm: [{ name: "LLM", unit: "1M tokens", price: 3.0 }],
      };

      const result = mergeApiRates(apiRates);
      expect(result[0].category).toBe("Text Generation");
      expect(result[1].category).toBe("Unknown Cap");
    });

    it("returns empty array for empty input", () => {
      expect(mergeApiRates({})).toEqual([]);
    });
  });
});
