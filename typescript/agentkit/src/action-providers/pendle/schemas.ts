import { z } from "zod";

export const EnterPoolSchema = z
  .object({
    poolAddress: z.string().describe("The address of the Pendle pool to enter"),
    amount: z.string().describe("Amount to deposit into the pool in wei"),
  })
  .strip()
  .describe("Instructions for entering a Pendle yield pool");

export const CompareYieldsSchema = z
  .object({
    riskTolerance: z
      .enum(["low", "medium", "high"])
      .describe("User's risk tolerance level"),
  })
  .strip()
  .describe("Parameters for comparing yields across pools");

export const ExitPositionSchema = z
  .object({
    poolAddress: z.string().describe("The address of the pool to exit from"),
    amount: z.string().describe("Amount to withdraw from the pool in wei"),
    priceThreshold: z
      .string()
      .optional()
      .describe("Optional price threshold for conditional exit"),
  })
  .strip()
  .describe("Instructions for exiting a Pendle position");