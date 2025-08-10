#!/usr/bin/env node

/**
 * Script to create a bot demo repo for VibeBot submissions
 * Run this once to create a repo that will be used for all bot submissions
 * 
 * Usage: node scripts/create-bot-repo.mjs
 */

import { config } from 'dotenv';
import { FreestyleSandboxes } from 'freestyle-sandboxes';

// Load environment variables
config({ path: '.env.local' });

async function createBotRepo() {
  try {
    const freestyle = new FreestyleSandboxes({
      apiKey: process.env.FREESTYLE_API_KEY,
    });

    console.log('Creating bot demo repository...');
    
    const { repoId } = await freestyle.createGitRepository({
      name: "VibeBot Demo Todo App",
      public: true,
      source: {
        url: process.env.FREESTYLE_TEMPLATE_URL || "https://github.com/freestyle-sh/freestyle-next",
        type: "git",
      },
    });

    console.log(`✅ Bot demo repo created successfully!`);
    console.log(`Repo ID: ${repoId}`);
    console.log('');
    console.log('Add this to your .env.local file:');
    console.log(`BOT_DEMO_REPO_ID=${repoId}`);
    
    return repoId;
  } catch (error) {
    console.error('❌ Failed to create bot repo:', error);
    process.exit(1);
  }
}

// Run the script
createBotRepo();