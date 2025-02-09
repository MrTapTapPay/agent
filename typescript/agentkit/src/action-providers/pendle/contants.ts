// Contract addresses
export const PENDLE_ADDRESSES = {
    MARKET_FACTORY: '0x59968008a703dC13E6beaECed644bdCe4ee45d13',
    YIELD_FACTORY: '0x963ddBB35c1AE44e2a159E3b5fb5177E0B32660d',
    PENDLE_SWAP: '0x313e7Ef7d52f5C10aC04ebaa4d33CDc68634c212',
    ROUTER: '0x888888888889758F76e7103c6CbF23ABbF58F946'
  } as const;
  
  // Market Factory ABI
  export const MARKET_FACTORY_ABI = [
    {
      inputs: [],
      name: "getAllMarkets",
      outputs: [{ type: "address[]" }],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [{ name: "marketAddress", type: "address" }],
      name: "getMarketInfo",
      outputs: [
        {
          components: [
            { name: "yieldToken", type: "address" },
            { name: "expiry", type: "uint256" },
            { name: "state", type: "uint8" }
          ],
          type: "tuple"
        }
      ],
      stateMutability: "view",
      type: "function"
    }
  ] as const;
  
  // Router ABI for market interactions
  export const ROUTER_ABI = [
    {
      inputs: [
        { name: "marketAddress", type: "address" },
        { name: "amount", type: "uint256" }
      ],
      name: "addLiquidity",
      outputs: [{ type: "uint256" }],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        { name: "marketAddress", type: "address" },
        { name: "amount", type: "uint256" }
      ],
      name: "removeLiquidity",
      outputs: [{ type: "uint256" }],
      stateMutability: "nonpayable",
      type: "function"
    }
  ] as const;
  
  // PendleSwap ABI for getting pool information
  export const PENDLE_SWAP_ABI = [
    {
      inputs: [{ name: "marketAddress", type: "address" }],
      name: "getPoolInfo",
      outputs: [
        {
          components: [
            { name: "totalSupply", type: "uint256" },
            { name: "virtualTotalSupply", type: "uint256" },
            { name: "currentYieldAPR", type: "uint256" }
          ],
          type: "tuple"
        }
      ],
      stateMutability: "view",
      type: "function"
    }
  ] as const;
  
  // Combined exports for the action provider
  export const PENDLE_ABI = {
    MarketFactory: MARKET_FACTORY_ABI,
    Router: ROUTER_ABI,
    PendleSwap: PENDLE_SWAP_ABI
  };
  
  // Export type for pool information
  export type PendlePool = {
    address: string;
    yieldToken: string;
    expiry: bigint;
    totalSupply: bigint;
    apr: bigint;
  };
  
  // Export interface for market info
  export interface MarketInfo {
    yieldToken: string;
    expiry: bigint;
    state: number;
  }