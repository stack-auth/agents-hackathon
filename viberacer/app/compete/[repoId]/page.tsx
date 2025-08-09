"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import FreestylePreview from "@/components/FreestylePreview";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { DefaultChatTransport } from "ai";
import { Thread } from "@/components/assistant-ui/thread";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react"
import { useVercelUseChatRuntime } from "@assistant-ui/react-ai-sdk";



export default function CompeteWithRepo() {
    const params = useParams<{ repoId: string }>();
    const [input, setInput] = useState("");
    const repoId = params?.repoId ?? "";

    const chat = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat/' + repoId,
        }),
    });

    const runtime = useVercelUseChatRuntime(chat);

    return (
        <div className="h-[calc(100vh-0px)] w-full">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={30} minSize={20} className="border-r">
                    <div className="flex h-full flex-col">
                        <div className="px-4 py-3 border-b">
                            <h2 className="text-sm font-medium">Chat</h2>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-3">
                            {chat.messages.map(message => (
                                <div key={message.id}>
                                    {message.role === 'user' ? 'User: ' : 'AI: '}
                                    {message.parts.map((part, index) =>
                                        part.type === 'text' ? <span key={index}>{part.text}</span> : null,
                                    )}
                                </div>
                            ))}
                            {chat.error && <div className="text-red-500">{chat.error.message}</div>}
                        </div>
                        <div className="p-3 border-t">
                            <input
                                value={input}
                                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800"
                                placeholder="Send a message..."
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setInput("");
                                        chat.sendMessage({ text: input });
                                    }
                                }}
                            />
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={70} minSize={40}>
                    <FreestylePreview repoId={repoId} className="h-full w-full" />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

