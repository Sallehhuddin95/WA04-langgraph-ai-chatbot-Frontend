import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3 py-16">
      <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        This page was not found.
      </h1>
      <p className="text-[15px] text-slate-500 dark:text-slate-400">
        Check the address, or go back to chats.
      </p>
      <div>
        <Button asChild type="button">
          <Link href="/chat">Back to chats</Link>
        </Button>
      </div>
    </div>
  );
}
