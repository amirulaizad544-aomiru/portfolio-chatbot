import { ChatBox } from "@/components/ChatBox";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ embed?: string }>;
}) {
  const { embed } = await searchParams;
  const isEmbed = embed === "1";

  if (isEmbed) {
    return (
      <div className="flex h-screen w-screen flex-col bg-background font-sans">
        <ChatBox embed />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-4 py-16 font-sans">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Amirul&apos;s Portfolio Assistant
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ask about my projects, skills, experience, and more.
        </p>
      </div>
      <ChatBox />
    </div>
  );
}
