import {
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  pythActionProvider,
  telegramActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { Telegraf } from "telegraf";

dotenv.config();

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

/**
 * Validate required environment variables
 */
function validateConfig() {
  const required = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    CDP_API_KEY_NAME: process.env.CDP_API_KEY_NAME,
    CDP_API_KEY_PRIVATE_KEY: process.env.CDP_API_KEY_PRIVATE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  if (!process.env.NETWORK_ID) {
    console.warn("Warning: NETWORK_ID not set, defaulting to base-sepolia");
  }
}

/**
 * Initialize the agent with CDP Agentkit and Telegram
 */
async function initialize() {
  console.log("Initializing agent...");
  
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0.7,
    });

    let walletDataStr: string | null = null;

    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
        console.log("Loaded existing wallet data");
      } catch (error) {
        console.error("Error reading wallet data:", error);
      }
    }

    // Configure CDP Wallet Provider
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME!,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    console.log("Configuring wallet provider...");
    const walletProvider = await CdpWalletProvider.configureWithWallet(config);

    // Initialize AgentKit with all providers
    console.log("Initializing AgentKit...");
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        telegramActionProvider(),
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider(config),
        cdpWalletActionProvider(config),
      ],
    });

    const tools = await getLangChainTools(agentkit);
    const memory = new MemorySaver();

    // Create React Agent
    console.log("Creating React Agent...");
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are TapTapPay Bot, a helpful crypto assistant that can manage wallets and execute DeFi transactions through Telegram.
        You can:
        1. Create and manage wallets
        2. Check balances
        3. Send and receive tokens
        4. Interact with WETH (wrap/unwrap ETH)
        5. Get token prices from Pyth
        6. Request testnet tokens from faucet (on base-sepolia network)

        When users interact with you:
        1. Always check wallet status first
        2. If on base-sepolia, offer to get testnet tokens
        3. Guide them through transactions securely
        4. Warn about security best practices
        5. Never ask for sensitive information in group chats

        If there's a 5XX error, ask the user to try again later.
        If asked about features you don't have, explain your current capabilities and note their interest.
        Be concise and security-conscious with your responses.
      `,
    });

    // Save wallet data after initialization
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));
    console.log("Saved wallet data");

    return { agent };
  } catch (error) {
    console.error("Initialization error:", error);
    throw error;
  }
}

/**
 * Start the Telegram bot
 */
async function startBot() {
  try {
    const { agent } = await initialize();
    
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!, {
      handlerTimeout: 90000,
      telegram: {
        apiRoot: 'https://api.telegram.org',
        webhookReply: false,
      },
    });

    // Handle /start command
    bot.command("start", async (ctx) => {
      try {
        console.log(`Processing /start from chat ${ctx.chat.id}`);
        await ctx.reply("Starting up TapTapPay Bot... 🚀");
        
        const stream = await agent.stream(
          { 
            messages: [new HumanMessage("/start")],
          },
          { 
            configurable: { 
              thread_id: `telegram_${ctx.chat.id}`,
              network_id: process.env.NETWORK_ID || 'base-sepolia'
            } 
          }
        );

        for await (const chunk of stream) {
          if ("agent" in chunk) {
            await ctx.reply(chunk.agent.messages[0].content);
          } else if ("tools" in chunk) {
            console.log("Tool output:", chunk.tools.messages[0].content);
          }
        }
      } catch (error) {
        console.error("Error handling /start:", error);
        await ctx.reply("Sorry, I encountered an error. Please try again.");
      }
    });

    // Handle regular messages
    bot.on("text", async (ctx) => {
      try {
        console.log(`Processing message from chat ${ctx.chat.id}: ${ctx.message.text}`);
        
        // Log environment check
        console.log('Environment check:', {
          CDP_API_KEY_NAME: process.env.CDP_API_KEY_NAME ? '✓' : '✗',
          CDP_API_KEY_PRIVATE_KEY: process.env.CDP_API_KEY_PRIVATE_KEY ? '✓' : '✗',
          NETWORK_ID: process.env.NETWORK_ID || 'base-sepolia',
        });

        const stream = await agent.stream(
          { 
            messages: [new HumanMessage(ctx.message.text)],
          },
          { 
            configurable: { 
              thread_id: `telegram_${ctx.chat.id}`,
              network_id: process.env.NETWORK_ID || 'base-sepolia'
            } 
          }
        );

        for await (const chunk of stream) {
          if ("agent" in chunk) {
            await ctx.reply(chunk.agent.messages[0].content);
          } else if ("tools" in chunk) {
            console.log("Tool output:", chunk.tools.messages[0].content);
          }
        }
      } catch (err) {
        console.error("Error handling message:", err);
        // Type check for API error response
        if (err && typeof err === 'object' && 'response' in err) {
          console.error("API Response:", err.response);
        }
        await ctx.reply("Sorry, I encountered an error. Please try again.");
      }
    });

    // Clear webhooks and start bot
    try {
      console.log("Clearing webhooks...");
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      await bot.launch();
      console.log("🚀 Bot is running...");
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 
          'error_code' in err.response && err.response.error_code === 409) {
        console.log("Detected another bot instance, waiting 10 seconds and trying again...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        await bot.launch();
        console.log("🚀 Bot is running...");
      } else {
        throw err;
      }
    }

    // Enable graceful stop
    process.once("SIGINT", () => {
      console.log("Stopping bot...");
      bot.stop("SIGINT");
    });
    process.once("SIGTERM", () => {
      console.log("Stopping bot...");
      bot.stop("SIGTERM");
    });

  } catch (error) {
    console.error("Fatal error starting bot:", error);
    throw error;
  }
}

if (require.main === module) {
  console.log("Starting TapTapPay Bot...");
  
  try {
    // Validate config before starting
    validateConfig();
    
    startBot().catch((error) => {
      console.error("Fatal error in startBot:", error);
      if (error.response) {
        console.error("API Response:", error.response);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }
}