import { LoginForm, RedirectWhenAuthenticated } from "@/features/auth";

export default function LoginPage(): React.JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-4 py-16">
      <RedirectWhenAuthenticated>
        <LoginForm />
      </RedirectWhenAuthenticated>
    </div>
  );
}
