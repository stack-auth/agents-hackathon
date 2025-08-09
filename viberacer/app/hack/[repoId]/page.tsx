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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";



export default function CompeteWithRepo() {
  const params = useParams<{ repoId: string }>();
  const [username, setUsername] = useState("");
  const [open, setOpen] = useState(false);
  const repoId = params?.repoId ?? "";
  const createSubmission = useMutation(api.submissions.createSubmission);
  const router = useRouter();

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/' + repoId,
    }),
  });

  const handleSubmit = () => {
    setOpen(true);
  };

  const handleDialogSubmit = async () => {
    if (!username.trim()) return;
    await createSubmission({ repoId, username: username.trim() });
    setOpen(false);
    router.push(`/judge/${repoId}`);
  };

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter a username</DialogTitle>
            <DialogDescription>
              We’ll show this on the leaderboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDialogSubmit} disabled={!username.trim()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

