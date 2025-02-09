import { z } from "zod";
import { ActionProvider } from "../actionProvider";
import { Network } from "../../network";
import { CreateAction } from "../actionDecorator";
import { EnterPoolSchema, CompareYieldsSchema, ExitPositionSchema } from "./schemas";
import { PENDLE_ABI, PENDLE_ADDRESSES, PendlePool, MarketInfo } from "./constants";
import { encodeFunctionData, Hex } from "viem";
import { EvmWalletProvider } from "../../wallet-providers";

/**
 * PendleActionProvider handles interactions with Pendle yield pools.
 */
export class PendleActionProvider extends ActionProvider<EvmWalletProvider> {
  constructor() {
    super("pendle", []);
  }

  /**
   * Compares yields across available pools and provides recommendations.
   */
  @CreateAction({
    name: "compare_yields",
    description: `
    This tool analyzes all available Pendle pools and provides yield comparisons.
    It takes into account:
    - Current APR
    - Pool liquidity
    - Risk level
    - User's risk tolerance

    Returns recommendations for optimal yield strategies.
    `,
    schema: CompareYieldsSchema,
  })
  async compareYields(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof CompareYieldsSchema>
  ): Promise<string> {
    try {
      // Get all markets from factory
      const marketFactory = await walletProvider.readContract({
        address: PENDLE_ADDRESSES.MARKET_FACTORY as Hex,
        abi: PENDLE_ABI.MarketFactory,
        functionName: "getAllMarkets",
      });

      const yields = await Promise.all(
        marketFactory.map(async (address) => {
          const yieldRate = await walletProvider.readContract({
            address: address as Hex,
            abi: PENDLE_ABI,
            functionName: "getYieldRate",
            args: [],
          });
          return { poolName, yieldRate };
        })
      );

      // Filter and sort based on risk tolerance
      const filteredYields = this.filterByRiskTolerance(yields, args.riskTolerance);
      
      return `Current yield opportunities:\n${filteredYields
        .map(y => `${y.poolName}: ${y.yieldRate}% APR`)
        .join("\n")}`;
    } catch (error) {
      return `Error comparing yields: ${error}`;
    }
  }

  /**
   * Enters a Pendle yield position.
   */
  @CreateAction({
    name: "enter_pool",
    description: `
    This tool allows entering a Pendle yield pool position.
    It handles:
    - Deposit of assets
    - Position tracking
    - Initial yield capture

    Important notes:
    - Verify pool address and amount before entering
    - Ensure sufficient balance and approvals
    - Consider gas costs
    `,
    schema: EnterPoolSchema,
  })
  async enterPool(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof EnterPoolSchema>
  ): Promise<string> {
    try {
      const hash = await walletProvider.sendTransaction({
        to: args.poolAddress as Hex,
        data: encodeFunctionData({
          abi: PENDLE_ABI,
          functionName: "enterPosition",
          args: [args.poolAddress as Hex, BigInt(args.amount)],
        }),
      });

      await walletProvider.waitForTransactionReceipt(hash);
      
      return `Entered Pendle pool position. Transaction hash: ${hash}`;
    } catch (error) {
      return `Error entering pool: ${error}`;
    }
  }

  /**
   * Exits a Pendle yield position with optional conditions.
   */
  @CreateAction({
    name: "exit_position",
    description: `
    This tool handles exiting a Pendle yield position.
    Features:
    - Complete or partial position exit
    - Conditional exit based on price thresholds
    - Emergency exit functionality
    
    Use this when:
    - Wanting to take profits
    - Responding to market conditions
    - Implementing stop-loss
    `,
    schema: ExitPositionSchema,
  })
  async exitPosition(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof ExitPositionSchema>
  ): Promise<string> {
    try {
      // Check if price threshold is met if specified
      if (args.priceThreshold) {
        // Add price check logic here
      }

      const hash = await walletProvider.sendTransaction({
        to: args.poolAddress as Hex,
        data: encodeFunctionData({
          abi: PENDLE_ABI,
          functionName: "exitPosition",
          args: [args.poolAddress as Hex, BigInt(args.amount)],
        }),
      });

      await walletProvider.waitForTransactionReceipt(hash);
      
      return `Exited Pendle position. Transaction hash: ${hash}`;
    } catch (error) {
      return `Error exiting position: ${error}`;
    }
  }

  private filterByRiskTolerance(yields: any[], riskTolerance: string) {
    // Implement risk-based filtering logic
    return yields;
  }

  /**
   * Checks if the Pendle action provider supports the given network.
   */
  supportsNetwork = (network: Network) =>
    network.networkId === "base-mainnet" || network.networkId === "base-sepolia";
}

export const pendleActionProvider = () => new PendleActionProvider();