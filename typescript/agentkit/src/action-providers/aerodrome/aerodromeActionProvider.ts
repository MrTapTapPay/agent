import { z } from "zod";
import { ActionProvider } from "../actionProvider";
import { EvmWalletProvider } from "../../wallet-providers";
import { CreateAction } from "../actionDecorator";
import { Network } from "../../network";
import {
    AERODROME_SUPPORTED_NETWORKS,
  AERODROME_ROUTER,
  AERODROME_ROUTER_ABI,
  AERODROME_FACTORY,
} from "./constants";
import { AerodromeSwapInput } from "./schemas";
import { encodeFunctionData } from "viem";

export class AerodromeActionProvider extends ActionProvider<EvmWalletProvider> {
  constructor() {
    super("aerodrome", []);
  }

  @CreateAction({
    name: "swap_tokens",
    description: `
This tool can be used to swap tokens on Aerodrome DEX on Base fork.
Do not use this tool for any other purpose.

Inputs:
- Input token address
- Output token address
- Amount of input tokens (in wei)
- Minimum amount of output tokens to receive (in wei)

Important notes:
- All amounts are in wei
- Only supported on Base fork`,
    schema: AerodromeSwapInput,
  })
  async swapTokens(
    wallet: EvmWalletProvider,
    args: z.infer<typeof AerodromeSwapInput>,
  ): Promise<string> {
    try {
      const route = {
        from: args.tokenIn,
        to: args.tokenOut,
        stable: false,
        factory: AERODROME_FACTORY
      };

      const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes

      const data = encodeFunctionData({
        abi: AERODROME_ROUTER_ABI,
        functionName: "swapExactTokensForTokens",
        args: [
          BigInt(args.amountIn),
          BigInt(args.minAmountOut),
          [route],
          wallet.getAddress(),
          BigInt(deadline),
        ],
      });

      const txHash = await wallet.sendTransaction({
        to: AERODROME_ROUTER as `0x${string}`,
        data,
      });

      const receipt = await wallet.waitForTransactionReceipt(txHash);

      return `Swapped tokens on Aerodrome with transaction hash: ${txHash}, and receipt:\n${JSON.stringify(receipt)}`;
    } catch (error) {
      return `Error swapping tokens on Aerodrome: ${error}`;
    }
  }

  supportsNetwork = (network: Network) =>
    network.protocolFamily === "evm" && AERODROME_SUPPORTED_NETWORKS.includes(network.networkId!);
}