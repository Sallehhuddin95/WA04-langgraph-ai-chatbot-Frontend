import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenText,
  Cpu,
  ImagePlus,
  Lightbulb,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LandingActions } from "./_components/LandingActions";

export const metadata: Metadata = {
  title: "Singularity - Answers from your documents",
  description:
    "Singularity is a chat assistant that answers from your documents and shows its sources.",
};

export default function HomePage(): React.JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-10 px-4 py-12">
      <section aria-labelledby="landing-hero" className="flex flex-col gap-4">
        <h1
          id="landing-hero"
          className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Singularity
        </h1>
        <p className="text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          A chat assistant that answers from your documents and shows its
          sources.
        </p>
        <LandingActions />
      </section>

      <section aria-labelledby="landing-how" className="flex flex-col gap-4">
        <h2
          id="landing-how"
          className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          How it works
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          <li>
            <Card className="h-full">
              <CardContent className="flex flex-col gap-2">
                <MessageSquareText
                  aria-hidden="true"
                  className="size-5 text-blue-600 dark:text-blue-400"
                />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  1. Ask
                </p>
                <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Type a question. Short or casual, both work.
                </p>
              </CardContent>
            </Card>
          </li>
          <li>
            <Card className="h-full">
              <CardContent className="flex flex-col gap-2">
                <BookOpenText
                  aria-hidden="true"
                  className="size-5 text-blue-600 dark:text-blue-400"
                />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  2. Read grounded answers
                </p>
                <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Answers from your documents carry numbered markers like [1]
                  [2]. The source list sits under the reply.
                </p>
              </CardContent>
            </Card>
          </li>
          <li>
            <Card className="h-full">
              <CardContent className="flex flex-col gap-2">
                <Lightbulb
                  aria-hidden="true"
                  className="size-5 text-blue-600 dark:text-blue-400"
                />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  3. Take opinions as opinions
                </p>
                <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                  With no sources to cite, the reply says it has none. Check
                  it before you use it.
                </p>
              </CardContent>
            </Card>
          </li>
        </ol>
      </section>

      <section aria-labelledby="landing-models" className="flex flex-col gap-4">
        <h2
          id="landing-models"
          className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Pick a model
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <Cpu
              aria-hidden="true"
              className="size-5 text-blue-600 dark:text-blue-400"
            />
            <p className="text-[15px] leading-relaxed text-slate-900 dark:text-slate-100">
              Three models in one dropdown: DeepSeek V4 Flash, DeepSeek V4
              Flash Vision, and Muse Spark 1.3.
            </p>
            <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              The two vision models take images. Plain Flash answers text
              only.
            </p>
          </CardContent>
        </Card>
      </section>

      <section
        aria-labelledby="landing-images"
        className="flex flex-col gap-4"
      >
        <h2
          id="landing-images"
          className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Attach images
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <ImagePlus
              aria-hidden="true"
              className="size-5 text-blue-600 dark:text-blue-400"
            />
            <p className="text-[15px] leading-relaxed text-slate-900 dark:text-slate-100">
              Add an image to your question.
            </p>
            <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              Images only, up to 5 MB. Select a vision model first.
            </p>
          </CardContent>
        </Card>
      </section>

      <section
        aria-labelledby="landing-account"
        className="flex flex-col gap-4"
      >
        <h2
          id="landing-account"
          className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Your own account
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <ShieldCheck
              aria-hidden="true"
              className="size-5 text-blue-600 dark:text-blue-400"
            />
            <p className="text-[15px] leading-relaxed text-slate-900 dark:text-slate-100">
              Sign up to keep your chats in one place.
            </p>
            <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              Threads stay with your account. Log out from the header anytime.
            </p>
            <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              New here?{" "}
              <Link
                href="/signup"
                className="text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
              >
                Create an account
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
