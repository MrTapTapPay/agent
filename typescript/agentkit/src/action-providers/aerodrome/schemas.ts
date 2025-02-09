import { z } from "zod";
import { isAddress } from "viem";

const ethereumAddress = z.custom<`0x${string}`>(
  val => typeof val === "string" && isAddress(val),
  "Invalid address",
);

export const AerodromeSwapInput = z
  .object({
    tokenIn: ethereumAddress.describe("The input token address"),
    tokenOut: ethereumAddress.describe("The output token address"),
    amountIn: z
      .string()
      .regex(/^\d+$/, "Must be a valid wei amount")
      .describe("Amount of input tokens (in wei)"),
    minAmountOut: z
      .string()
      .regex(/^\d+$/, "Must be a valid wei amount")
      .describe("Minimum amount of output tokens to receive (in wei)"),
  })
  .strip()
  .describe("Instructions for swapping tokens on Aerodrome");