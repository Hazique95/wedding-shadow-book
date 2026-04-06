import OpenAI from "openai";

import type { VendorReviewRecord, VendorRiskAiAnalysis } from "@/lib/risk/types";
import { clampNumber, roundTo } from "@/lib/risk/utils";

let openAIClient: OpenAI | null | undefined;

function getOpenAIClient() {
  if (openAIClient !== undefined) {
    return openAIClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    openAIClient = null;
    return openAIClient;
  }

  openAIClient = new OpenAI({ apiKey });
  return openAIClient;
}

function buildReviewPrompt(reviews: VendorReviewRecord[]) {
  return reviews
    .map(
      (review, index) =>
        `${index + 1}. Date: ${review.date}. Stored sentiment: ${review.sentiment.toFixed(2)}. Review: ${review.text}`
    )
    .join("\n");
}

function parseRiskAnalysisOutput(outputText: string): VendorRiskAiAnalysis {
  const parsed = JSON.parse(outputText) as Partial<{
    aiScore: number | string;
    explanation: string;
    topRisks: string[];
  }>;

  const explanation = parsed.explanation?.trim();
  const topRisks = Array.isArray(parsed.topRisks)
    ? parsed.topRisks.filter((value): value is string => typeof value === "string" && value.trim().length > 0).slice(0, 3)
    : [];

  if (!explanation || !topRisks.length) {
    throw new Error("OpenAI returned an invalid vendor risk analysis payload.");
  }

  return {
    aiScore: roundTo(clampNumber(Number(parsed.aiScore), 0, 10)),
    explanation,
    topRisks,
  };
}

export async function analyzeVendorReviewsWithOpenAI(reviews: VendorReviewRecord[]) {
  const client = getOpenAIClient();

  if (!client) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await client.responses.create({
    model: process.env.OPENAI_RISK_MODEL ?? "gpt-4o-mini",
    instructions:
      "You are a wedding operations analyst. Analyze vendor reliability, no-show risk, communication consistency, and delivery quality. Return strict JSON only.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "Analyze these 10 wedding vendor reviews for reliability, no-shows, quality.",
              "Return JSON with keys aiScore, explanation, topRisks.",
              "aiScore must be a number from 0 to 10 where 10 means extremely reliable.",
              "explanation must be a single concise paragraph.",
              "topRisks must contain 1 to 3 concise risk statements.",
              "Reviews:",
              buildReviewPrompt(reviews),
            ].join("\n\n"),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "vendor_risk_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            aiScore: {
              type: "number",
              minimum: 0,
              maximum: 10,
            },
            explanation: {
              type: "string",
              minLength: 1,
              maxLength: 500,
            },
            topRisks: {
              type: "array",
              minItems: 1,
              maxItems: 3,
              items: {
                type: "string",
                minLength: 1,
                maxLength: 160,
              },
            },
          },
          required: ["aiScore", "explanation", "topRisks"],
        },
      },
    },
    max_output_tokens: 300,
  });

  const outputText = response.output_text?.trim();

  if (!outputText) {
    throw new Error("OpenAI returned an empty risk analysis response.");
  }

  return parseRiskAnalysisOutput(outputText);
}

export function isOpenAIRateLimitError(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && Number((error as { status?: number }).status) === 429;
}