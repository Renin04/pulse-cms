import Link from 'next/link';
import { ArrowRight, Blocks, Code2, PlaySquare } from 'lucide-react';
import Footer from '../components/Footer';

const examples = [
  {
    icon: Blocks,
    title: 'Editorial Storytelling',
    description: 'A long-form article that blends layouts, callouts, and media-rich storytelling blocks.',
  },
  {
    icon: PlaySquare,
    title: 'Interactive Product Post',
    description: 'A product launch page with embedded demos, comparison tables, and explorable media.',
  },
  {
    icon: Code2,
    title: 'Developer Docs Surface',
    description: 'A docs-first setup that combines structured content with code blocks and reusable snippets.',
  },
];

export default function ExamplesPage() {
  return (
    <>

      <main id="main-content" className="min-h-screen bg-[var(--neutral-50)] pt-28">
        <section className="bg-white">
          <div className="container py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="pulse-kicker mb-4">Examples</p>
              <h1 className="mb-6 text-5xl font-bold text-[var(--pulse-black)]">
                Reference experiences for the Pulse stack
              </h1>
              <p className="text-xl leading-relaxed text-[var(--neutral-600)]">
                PM4-10 focuses on a marketing site, demos, and a dogfooding content surface. These example directions frame what Pulse should make easy.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="grid gap-6 lg:grid-cols-3">
              {examples.map((example) => (
                <article
                  key={example.title}
                  className="rounded-3xl border border-[var(--neutral-200)] bg-white p-8 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-5 inline-flex rounded-2xl bg-[var(--pulse-jasmine-light)] p-3">
                    <example.icon className="h-6 w-6 text-[var(--pulse-red)]" />
                  </div>
                  <h2 className="mb-3 text-2xl font-bold text-[var(--pulse-black)]">
                    {example.title}
                  </h2>
                  <p className="text-[var(--neutral-600)]">{example.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-10 rounded-3xl bg-[var(--pulse-black)] p-8 text-white">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--pulse-jasmine)]">
                    Dogfooding track
                  </p>
                  <h2 className="mb-3 text-3xl font-bold">The next example is the real blog admin itself.</h2>
                  <p className="text-white/80">
                    PM4-11 will turn this website into the actual authoring and publishing loop for Pulse content.
                  </p>
                </div>
                <Link href="/blog" className="btn btn-secondary">
                  Explore blog structure
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
