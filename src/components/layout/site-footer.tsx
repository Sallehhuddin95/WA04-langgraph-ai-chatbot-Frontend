export function SiteFooter(): React.JSX.Element {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-10 w-full items-center justify-between px-4">
        <p className="text-[12px] text-slate-500 dark:text-slate-400">
          &copy; {year} Singularity
        </p>
        <p className="hidden text-[12px] text-slate-400 sm:block dark:text-slate-500">
          Answers from your documents.
        </p>
      </div>
    </footer>
  );
}
