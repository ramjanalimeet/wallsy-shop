import type { SetupStatus } from "@/lib/setup";

const steps = [
  ["Open your project on Vercel", "Go to vercel.com, then open this project."],
  ["Add a free Postgres database", "Open the Storage tab, choose Create Database, then Neon, and connect it to this project."],
  ["Redeploy", "Open Deployments, click ⋯ on the latest one, then Redeploy. Your store sets itself up on the first visit."],
];

export function SetupScreen({ status }: { status: Exclude<SetupStatus, { ok: true }> }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <p className="font-serif text-3xl">
          Wallsy<span className="text-accent">.</span>
        </p>
        {status.reason === "no-database" ? (
          <>
            <h1 className="mt-6 text-xl font-semibold">Almost there: connect a database</h1>
            <p className="mt-2 text-muted">Your store is deployed. It needs a database to keep products, orders and settings.</p>
            <ol className="mt-6 space-y-4">
              {steps.map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">{i + 1}</span>
                  <span>
                    <span className="block font-medium">{title}</span>
                    <span className="text-sm text-muted">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-lg bg-sand p-3 text-sm">
              Also add <code className="font-semibold">ADMIN_PASSWORD</code> under Settings → Environment Variables so you can sign in to <code>/admin</code>.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-xl font-semibold">We can&apos;t reach the database</h1>
            <p className="mt-2 text-muted">
              A database is configured but the store couldn&apos;t connect to it. Check that the database still exists and is connected to this project on Vercel, then redeploy. The
              exact error is in the project&apos;s Logs tab.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
