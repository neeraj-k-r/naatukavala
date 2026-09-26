import Link from "next/link";

export const metadata = {
  title: "Check your email",
};

export default function VerifyPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-12 text-center">
      <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl dark:bg-emerald-950">
          ✉️
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Check your email</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          We sent a confirmation link to your inbox. Click it to activate your
          account, then log in.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}