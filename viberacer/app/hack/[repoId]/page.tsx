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
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { useStackApp } from "@stackframe/stack";



export default function CompeteWithRepo() {
  const stack = useStackApp();
  const { id: userId } = stack.useUser({ or: "redirect" });
  const params = useParams<{ repoId: string }>();
  const [username, setUsername] = useState("");
  const [open, setOpen] = useState(false);
  const repoId = params?.repoId ?? "";
  const createSubmission = useMutation(api.submissions.createSubmission);
  const timeData = useQuery(api.adminData.getAdminData);
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
    await createSubmission({ repoId, userId });
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
              <div className="px-4 py-3 border-b flex justify-between">
                {timeData ? (
                  <span className="text-xl font-mono text-black">
                    {Math.floor(timeData.timeToNext / 60)}:{String(Math.floor(timeData.timeToNext % 60)).padStart(2, '0')}
                  </span>
                ) : (
                  <span />
                )}
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
            <DialogTitle>Ready to submit?</DialogTitle>
            <DialogDescription>
              You'll move on to the judging phase after submitting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDialogSubmit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

