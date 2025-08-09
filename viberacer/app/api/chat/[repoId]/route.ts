import { openai } from '@ai-sdk/openai';
import {
  streamText,
  UIMessage,
  experimental_createMCPClient as createMCPClient,
  convertToCoreMessages,
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

  const data: { messages: UIMessage[] } = await req.json();
  console.log(data);
  const result = streamText({
    stopWhen: ({ steps }) => {
      return false;
    },
    model: openai('gpt-5'),
    system: 'Your job is to help the user build a project of their choice. Use Next.js, Tailwind CSS, and Shadcn UI to build the project. Use the tools provided to read and edit the project files instead of asking the user for information. The user has an existing Next.js template project in /template folder.',
    messages: convertToCoreMessages(data.messages),
    tools,
  });
  return result.toUIMessageStreamResponse();
}