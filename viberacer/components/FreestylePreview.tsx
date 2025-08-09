"use client";

import * as React from "react";
async function fetchPreview(repoId: string): Promise<string> {
  const res = await fetch(`/api/devserver?repoId=${encodeURIComponent(repoId)}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Failed with ${res.status}`);
  }
  const data = (await res.json()) as { ephemeralUrl: string };
  return data.ephemeralUrl;
}

type FreestylePreviewProps = {
  repoId: string;
  className?: string;
};

export function FreestylePreview({ repoId, className }: FreestylePreviewProps) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function ensureDevServer() {
      try {
        setLoading(true);
        const ephemeralUrl = await fetchPreview(repoId);
        if (!isMounted) return;
        setUrl(ephemeralUrl);
        setError(null);
      } catch (e) {
        if (!isMounted) return;
        setError(e instanceof Error ? e.message : "Failed to start preview");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    ensureDevServer();
    const id = setInterval(ensureDevServer, 30_000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [repoId]);

  if (loading && !url) {
    return (
      <div className={className}>
        <div className="flex h-full items-center justify-center text-sm text-zinc-500">
          Starting preview…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex h-full items-center justify-center text-sm text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {url ? (
        <iframe
          src={url}
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      ) : null}
    </div>
  );
}

export default FreestylePreview;

