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
import { Button } from "@/components/ui/button";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";



export default function CompeteWithRepo() {
    const params = useParams<{ repoId: string }>();
    const [input, setInput] = useState("");
    const repoId = params?.repoId ?? "";

    const chat = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat/' + repoId,
        }),
    });

    const handleSubmit = () => {
        console.log("submit");
    }

    const runtime = useAISDKRuntime(chat);

    return (
        <div className="h-[calc(100vh-0px)] w-full">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={30} minSize={20} className="border-r">
                    <AssistantRuntimeProvider runtime={runtime}>
                        <div className="h-full flex flex-col">
                            <div className="px-4 py-3 border-b flex justify-end">
                                <Button onClick={handleSubmit}>Submit Project</Button>
                            </div>
                            <div className="flex-grow h-0">
                                <Thread />
                            </div>
                        </div>
                    </AssistantRuntimeProvider>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={70} minSize={40}>
                    <FreestylePreview repoId={repoId} className="h-full w-full" />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

