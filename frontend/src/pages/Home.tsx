import { Header } from "../components/header";
import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-100">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Your attention. Your choice.
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-stone-900 sm:text-6xl">
            Watch what you came for.
            <span className="block text-stone-500">
              Nothing else.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            FocusTube lets you follow the channels you choose and watch
            their videos without recommendations, endless feeds, or
            algorithmic distractions.
          </p>

          <div className="mt-10">
            <Link
              to="/register"
              className="inline-flex rounded-lg bg-amber-700 px-6 py-3 text-sm font-medium text-stone-50 transition hover:bg-amber-800 shadow-sm"
            >
              Get started
            </Link>
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-stone-200 bg-stone-200/30">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-amber-700">
                The problem
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                You came to watch one video.
              </h2>

              <p className="mt-5 text-lg leading-8 text-stone-600">
                Then another video appeared. Then a Short. Then another
                recommendation. Before you know it, the reason you opened
                YouTube is gone.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-3">
              <Feature
                number="01"
                title="No recommendations"
                description="We don't decide what you should watch next."
              />

              <Feature
                number="02"
                title="Follow your channels"
                description="Your feed contains videos from channels you chose."
              />

              <Feature
                number="03"
                title="Know when you're done"
                description="When you're caught up, there's nothing else to pull you in."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wider text-amber-700">
              How it works
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              You control the feed.
            </h2>
          </div>

          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            <Step
              number="01"
              title="Choose"
              description="Follow the channels you actually want to watch."
            />

            <Step
              number="02"
              title="Watch"
              description="See videos from those channels without algorithmic recommendations."
            />

            <Step
              number="03"
              title="Leave"
              description="When you're done, you're done. FocusTube doesn't keep pulling you back."
            />
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-stone-200 bg-stone-200/20">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Take back control of your feed.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600">
              Follow the channels you trust. Watch what they publish.
              Nothing more.
            </p>

            <Link
              to="/register"
              className="mt-8 inline-flex rounded-lg bg-amber-700 px-7 py-3 text-sm font-medium text-stone-50 transition hover:bg-amber-800 shadow-sm"
            >
              Get started
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
      <span className="text-sm font-medium text-amber-700">{number}</span>
      <h3 className="mt-8 text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="text-sm font-medium text-amber-700">{number}</span>
      <h3 className="mt-5 text-xl font-semibold text-stone-900">{title}</h3>
      <p className="mt-3 leading-7 text-stone-600">{description}</p>
    </div>
  );
}