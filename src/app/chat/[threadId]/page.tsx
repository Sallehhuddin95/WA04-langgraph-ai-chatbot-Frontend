import { RequireAuth } from "@/features/auth";
import { ChatView } from "@/features/chat";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}): Promise<React.JSX.Element> {
  const { threadId } = await params;
  return (
    <RequireAuth>
      <ChatView threadId={threadId} />
    </RequireAuth>
  );
}
