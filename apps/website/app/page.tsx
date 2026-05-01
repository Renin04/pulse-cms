'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import Footer from './components/Footer';
import GlitchText from './components/GlitchText';
import HeroHeadline from './components/HeroHeadline';
import PulseStarButton from './components/PulseStarButton';
import SplashCursor from './components/SplashCursor';
import HowItWorks from './components/HowItWorks';
import AIFeatures from './components/AIFeatures';
import SEOFeatures from './components/SEOFeatures';
import DeveloperFeatures from './components/DeveloperFeatures';
import DynamicCTA from './components/DynamicCTA';
import ProblemSection from './components/ProblemSection';
import FeaturePlayground from './components/FeaturePlayground';

export default function HomePage() {
  return (
    <>
      <SplashCursor
        BACK_COLOR={{ r: 0.14, g: 0.05, b: 0.05 }}
        DENSITY_DISSIPATION={4}
        VELOCITY_DISSIPATION={2.5}
        SPLAT_RADIUS={0.18}
        SPLAT_FORCE={5000}
        COLOR_UPDATE_SPEED={8}
      />


      {/* ─── HERO ─── */}
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[#fff9eb] to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[10%] h-[500px] w-[500px] rounded-full bg-[var(--pulse-red)]/5 blur-[120px]" />
          <div className="absolute right-[-5%] top-[20%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-jasmine)]/30 blur-[100px]" />
          <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-[var(--pulse-red)]/8 blur-[80px]" />
        </div>

        <div className="container relative flex min-h-screen flex-col justify-center pt-40 pb-16">
          <div className="mx-auto max-w-6xl text-center">
            <div className="flex flex-col items-center gap-4">
              <h1 className="flex items-baseline gap-4 text-5xl font-bold tracking-tight text-[var(--pulse-black)] sm:text-6xl lg:text-7xl xl:text-8xl">
                <span className="text-[var(--neutral-500)]">blogs are</span>
                <GlitchText text="dead" className="text-[var(--neutral-400)]" />
              </h1>
              <HeroHeadline className="text-5xl font-bold tracking-tight text-[var(--pulse-black)] sm:text-6xl lg:text-7xl xl:text-8xl" />
            </div>

            <p className="mx-auto mt-16 max-w-2xl text-xl leading-relaxed text-[var(--neutral-600)] sm:text-2xl">
              Most content gets skimmed and forgotten. Pulse helps you publish{' '}
              <span className="font-bold text-[var(--pulse-red)]">experiences</span> people actually{' '}
              <span className="font-bold text-[var(--pulse-red)]">interact</span> with.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-xl leading-relaxed text-[var(--neutral-600)] sm:text-2xl">
              This is the <span className="font-bold text-[var(--pulse-red)]">rebellion</span> against forgettable content.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <PulseStarButton href="/demo" innerClassName="px-8 py-4 text-base">
                <Sparkles className="w-5 h-5" />
                Join the rebellion
              </PulseStarButton>
              <Link
                href="/features"
                className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-[var(--pulse-black)] transition-colors hover:text-[var(--pulse-red)]"
              >
                See what&apos;s possible
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ProblemSection />

      <FeaturePlayground />

      <HowItWorks />

      <AIFeatures />

      <SEOFeatures />

      <DeveloperFeatures />

      <DynamicCTA />

      <Footer />
    </>
  );
}
