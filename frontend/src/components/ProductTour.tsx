import { createContext, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type TourContextValue = { startTour: () => void };

const TourContext = createContext<TourContextValue | null>(null);

const tourSteps = [
  {
    title: "Build your focused feed",
    description:
      "Follow the YouTube channels you care about. FocusTube gathers their latest videos in one place, so you can spend less time searching.",
    path: "/AddChannel",
  },
  {
    title: "Watch with fewer distractions",
    description:
      "Your Feed brings videos from followed channels together. Save something for later, or open it in the Study workspace to take notes while you watch.",
    path: "/Feed",
  },
  {
    title: "Keep videos for later",
    description:
      "Use Save on a video in your Feed. Find your bookmarks here whenever you’re ready to come back to them.",
    path: "/Saved",
  },
  {
    title: "Make the Study workspace yours",
    description:
      "Watch a lesson beside your notes. Create pages for each video, add timestamped key moments, and return to your note history later. Focus mode hides the extra panels and adds a study timer. Your playback position is remembered too.",
    path: "/Study",
  },
];

export function useProductTour() {
  const context = useContext(TourContext);
  if (!context) throw new Error("useProductTour must be used within ProductTourProvider");
  return context;
}

export function ProductTourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const step = stepIndex === null ? null : tourSteps[stepIndex];

  function goToStep(index: number) {
    setStepIndex(index);
    navigate(tourSteps[index].path);
  }

  return (
    <TourContext.Provider value={{ startTour: () => goToStep(0) }}>
      {children}
      {step && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
            className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 sm:p-8"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-700 dark:text-amber-400">
                FocusTube tour · {stepIndex! + 1} of {tourSteps.length}
              </p>
              <button type="button" onClick={() => setStepIndex(null)} className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
                Skip tour
              </button>
            </div>
            <h2 id="tour-title" className="text-2xl font-bold tracking-tight">{step.title}</h2>
            <p className="mt-3 leading-7 text-stone-600 dark:text-stone-300">{step.description}</p>
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToStep(stepIndex! - 1)}
                disabled={stepIndex === 0}
                className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium disabled:opacity-40 dark:border-stone-700"
              >
                Back
              </button>
              {stepIndex === tourSteps.length - 1 ? (
                <button type="button" onClick={() => setStepIndex(null)} className="rounded-lg bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800">
                  Finish tour
                </button>
              ) : (
                <button type="button" onClick={() => goToStep(stepIndex! + 1)} className="rounded-lg bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800">
                  Next
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </TourContext.Provider>
  );
}
