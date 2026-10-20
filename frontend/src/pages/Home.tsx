import { Header } from "../components/Header";
import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-100 transition-colors dark:bg-stone-950">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-6 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            Your attention. Your choice.
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-6xl">
            Watch what you came for.
            <span className="block text-stone-500 dark:text-stone-400">
              Nothing else.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 dark:text-stone-300">
            FocusTube lets you follow only the channels you choose, with no
            recommendations, no autoplay rabbit holes and no endless feed.
            Then it helps you learn from what you watch, with a study
            workspace that puts your notes right beside the video.
          </p>

          <div className="mt-10">
            <Link
              to="/register"
              className="inline-flex rounded-lg bg-amber-700 px-6 py-3 text-sm font-medium text-stone-50 shadow-sm transition hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              Get started
            </Link>
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-stone-200 bg-stone-200/30 dark:border-stone-800 dark:bg-stone-900/50">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
                The problem
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
                You came to watch one video.
              </h2>

              <p className="mt-5 text-lg leading-8 text-stone-600 dark:text-stone-300">
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
            <p className="text-sm font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
              How it works
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
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
              title="Watch and study"
              description="See videos from those channels with no recommendations, and take notes right beside the video."
            />

            <Step
              number="03"
              title="Leave"
              description="When you're done, you're done. FocusTube doesn't keep pulling you back."
            />
          </div>
        </section>

        {/* Study workspace */}
        <section className="border-y border-stone-200 bg-stone-200/30 dark:border-stone-800 dark:bg-stone-900/50">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Study workspace
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
                Turn watching into learning.
              </h2>

              <p className="mt-5 text-lg leading-8 text-stone-600 dark:text-stone-300">
                Open any video in the study workspace. The video sits beside a
                rich note editor, so you can write while you watch and keep
                what matters.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-3">
              <Feature
                number="01"
                title="Notes beside the video"
                description="Write in a rich editor next to the player. Your notes are saved to your account."
              />

              <Feature
                number="02"
                title="Timestamps that jump back"
                description="Mark key moments. Click a timestamp and the video jumps to that exact point."
              />

              <Feature
                number="03"
                title="Pick up where you left off"
                description="FocusTube remembers where you stopped, so you can come back and continue."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-stone-200 bg-stone-200/20 dark:border-stone-800 dark:bg-stone-900/50">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
              Take back control of your feed.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600 dark:text-stone-300">
              Follow the channels you trust. Watch what they publish. Learn
              from it.
            </p>

            <Link
              to="/register"
              className="mt-8 inline-flex rounded-lg bg-amber-700 px-7 py-3 text-sm font-medium text-stone-50 shadow-sm transition hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700"
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
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm transition-colors dark:border-stone-800 dark:bg-stone-900">
      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
        {number}
      </span>

      <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-stone-100">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
        {description}
      </p>
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
      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
        {number}
      </span>

      <h3 className="mt-5 text-xl font-semibold text-stone-900 dark:text-stone-100">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-stone-600 dark:text-stone-300">
        {description}
      </p>
    </div>
  );
}