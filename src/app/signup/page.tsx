import { RedirectWhenAuthenticated, SignupForm } from "@/features/auth";

export default function SignupPage(): React.JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-4 py-16">
      <RedirectWhenAuthenticated>
        <SignupForm />
      </RedirectWhenAuthenticated>
    </div>
  );
}
