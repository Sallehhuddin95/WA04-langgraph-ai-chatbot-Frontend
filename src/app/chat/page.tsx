import { RequireAuth } from "@/features/auth";
import { ChatView } from "@/features/chat";

export default function ChatPage(): React.JSX.Element {
  return (
    <RequireAuth>
      <ChatView threadId={null} />
    </RequireAuth>
  );
}
