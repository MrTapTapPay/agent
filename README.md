# MRTAPTAP - A Base Chain Yield Optimization Bot (powered by Coinbase Agent Kit and Langchain)

## Overview
An intelligent Telegram bot that helps users find and execute the best yield strategies on Base blockchain using natural language. The bot abstracts away technical complexities of DeFi interactions, handling everything from token swaps to yield farming across multiple protocols.

## Key Features

### Natural Language Interface
- Users interact with the bot using plain English
- No need to understand complex DeFi terminology
- Automated handling of underlying technical operations

### Multi-Protocol Integration
1. **Pendle Protocol**
   - Yield token markets
   - Market pool interactions
   - APR comparisons and optimization

2. **Aerodrome**
   - Router swaps for optimal token pairs
   - Liquidity pool interactions
   - Automated path finding for best rates

### Automated Operations
- Token approvals and wrapping (ETH → WETH)
- Best route calculation for token swaps
- Pool entry and exit management
- Yield comparisons and recommendations
- Risk assessment and management

## Architecture

<img width="1534" alt="Screenshot 2025-02-08 at 6 44 04 PM" src="https://github.com/user-attachments/assets/f492c187-a595-4fed-a4a9-73a2446d9b72" />


### User Flow
1. User sends natural language request to bot
   ```
   Example: "I have 1000 USDC and want the best stable yield with low risk"
   ```

2. Bot analyzes request using LLM to:
   - Identify user's goals
   - Assess risk tolerance
   - Determine required actions

3. Bot executes required operations:
   - Token swaps if needed (via Aerodrome)
   - Pool entry/exit (via Pendle)
   - Position monitoring

### Technical Components

#### 1. Agent System
- Central coordinator for all operations
- Uses AgentKit for structured actions
- Manages multi-step operations
- Handles error recovery and retries

#### 2. Action Providers
```typescript
// Core providers
- PendleActionProvider
  - Yield pool interactions
  - APR comparisons
  - Position management

- AerodromeActionProvider
  - Token swaps
  - Router operations
  - Path optimization

- TokenActionProvider
  - ERC20 operations
  - WETH wrapping/unwrapping
```

#### 3. Smart Contract Integration
Key contracts:
```
Pendle:
- Market Factory: 0x59968008a703dC13E6beaECed644bdCe4ee45d13
- Router: 0x888888888889758F76e7103c6CbF23ABbF58F946
- PendleSwap: 0x313e7Ef7d52f5C10aC04ebaa4d33CDc68634c212

Aerodrome:
- Router contracts for token swaps
- Pool contracts for liquidity
```

## User Experience Examples

### Finding Best Yields
```
User: "What's the best yield for USDC right now?"

Bot: "I found these options:
1. Pendle USDC/WETH pool: 13.6% APR (Medium risk)
2. Aerodrome USDC/DAI pool: 8.2% APR (Low risk)
Would you like to enter any of these positions?"
```

### Managing Positions
```
User: "I want to exit half of my position if yields drop below 5%"

Bot: "I'll set up monitoring for your position:
- Current yield: 7.8%
- Exit trigger: 5%
- Amount: 50% of position
I'll notify you if the condition is met and handle the exit automatically."
```

## Development Setup

### Prerequisites
- Node.js 16+
- Telegram Bot API key
- Base RPC endpoint
- Coinbase Developer API key
- LLM API access (OpenAI/Claude)

### Installation
```bash
# Install dependencies
npm install
npm run build

cd agent/typescript/examples/langchain-mrtaptap-chatbot

# Configure environment
cp .env.example .env
# Add your API keys and endpoints (openai keys, cdp wallet keys)

# Start the bot
npm run start
```

## Note:
!! Product is still in heavy development phase.



### Adding New Protocols
1. Create new action provider
2. Define protocol ABIs and addresses
3. Implement core operations
4. Add to agent decision tree

