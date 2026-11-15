import { AnthropicBedrockMantle } from "@anthropic-ai/bedrock-sdk";
import { betaRefusalFallbackMiddleware } from "@anthropic-ai/sdk";
import { env } from "../env";

let client: AnthropicBedrockMantle | null = null;

/**
 * Claude on Amazon Bedrock in Canada (Central). Credentials come from the
 * standard AWS chain (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY, or a role).
 * If the main model declines a request, the middleware retries it once on
 * the fallback model.
 */
export function claude(): AnthropicBedrockMantle {
  client ??= new AnthropicBedrockMantle({
    awsRegion: env.AWS_REGION,
    middleware: [betaRefusalFallbackMiddleware([{ model: env.BEDROCK_FALLBACK_MODEL_ID }])],
    // Story writing can take a minute; keep well inside the function timeout.
    timeout: 120_000,
    maxRetries: 2,
  });
  return client;
}
