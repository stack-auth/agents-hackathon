import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  streamText,
  UIMessage,
  experimental_createMCPClient as createMCPClient,
} from 'ai';
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { freestyle } from '@/lib/freestyle';


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const repoId = req.url.split('/').pop();
  const { mcpEphemeralUrl } = await freestyle.requestDevServer({
    repoId,
  });
  const devServerMcp = await createMCPClient({
    transport: new StreamableHTTPClientTransport(new URL(mcpEphemeralUrl)),
  });
  const tools = await devServerMcp.tools();

  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    stopWhen: ({ steps }) => {
      const lastStep = steps[steps.length - 1];
      if (lastStep.toolCalls.length > 0) {
        return false;
      }
      return true;
    },
    model: openai('gpt-4.1'),
    system: 'You are a helpful assistant.',
    messages: convertToModelMessages(messages),
    tools,
  });
  return result.toUIMessageStreamResponse();
}