'use client';

import { motion } from 'motion/react';
import { Search, Zap, Map, BarChart3, Globe, CheckCircle2 } from 'lucide-react';

export default function SEOFeatures() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#fff9eb_100%)] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-10%] top-[10%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-red)]/5 blur-[120px]" />
        <div className="absolute bottom-[5%] left-[-5%] h-[300px] w-[300px] rounded-full bg-[var(--pulse-jasmine)]/20 blur-[100px]" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--pulse-red)]"
          >
            Search-First
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-[var(--pulse-black)] sm:text-4xl lg:text-5xl"
          >
            Built for discoverability.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-base text-[var(--neutral-600)] sm:text-lg"
          >
            Interactive does not mean invisible to search engines. Pulse ships with SEO baked into every block.
          </motion.p>
        </div>

        {/* Bento grid */}
        <div className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Large card — Structured Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative overflow-hidden rounded-3xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--pulse-red)]/20 hover:shadow-lg sm:col-span-2"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--pulse-red)]/5 blur-[60px] transition-all group-hover:bg-[var(--pulse-red)]/10" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--pulse-red)] to-[#ff6b4a] shadow-lg shadow-[var(--pulse-red)]/20">
                <Search className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[var(--pulse-black)]">Structured Data</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--neutral-600)]">
                Auto-generated JSON-LD for articles, FAQs, how-tos, and polls. Google reads every block as a rich result candidate.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Article', 'FAQ', 'HowTo', 'Breadcrumb'].map((tag) => (
                  <span key={tag} className="rounded-full border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-2.5 py-1 text-[10px] font-semibold text-[var(--neutral-600)]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Meta & Sitemap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative overflow-hidden rounded-3xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--pulse-jasmine)] hover:shadow-lg"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--pulse-jasmine)]/20 blur-[50px] transition-all group-hover:bg-[var(--pulse-jasmine)]/30" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--pulse-jasmine)] to-[#fff5cc] shadow-lg shadow-[var(--pulse-jasmine)]/30">
                <Map className="h-6 w-6 text-[var(--pulse-black)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--pulse-black)]">Meta & Sitemap</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--neutral-600)]">
                Dynamic OpenGraph tags, canonical URLs, and XML sitemaps generated at build time.
              </p>
            </div>
          </motion.div>

          {/* Core Web Vitals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative overflow-hidden rounded-3xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--pulse-red)]/20 hover:shadow-lg"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--pulse-red)]/5 blur-[50px] transition-all group-hover:bg-[var(--pulse-red)]/10" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--pulse-red)] to-[#ff6b4a] shadow-lg shadow-[var(--pulse-red)]/20">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[var(--pulse-black)]">Core Web Vitals</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--neutral-600)]">
                SSR-first architecture means fast LCP, zero layout shifts, and buttery INP scores.
              </p>
            </div>
          </motion.div>

          {/* Lighthouse score card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="group relative overflow-hidden rounded-3xl border border-[var(--neutral-200)] bg-gradient-to-br from-[var(--pulse-jasmine)]/30 to-[var(--pulse-jasmine)]/10 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--pulse-jasmine)] hover:shadow-lg sm:col-span-2"
          >
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[var(--pulse-black)]">100 / 100 Lighthouse</h3>
                  <p className="mt-1 text-sm text-[var(--neutral-600)]">
                    Performance, Accessibility, Best Practices, SEO — all green.
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-4 gap-2">
                {[
                  { label: 'Performance', score: 100 },
                  { label: 'Accessibility', score: 100 },
                  { label: 'Best Practices', score: 100 },
                  { label: 'SEO', score: 100 },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-white/60 p-2 text-center">
                    <div className="text-lg font-bold text-[var(--pulse-black)]">{item.score}</div>
                    <div className="text-[9px] font-semibold text-[var(--neutral-500)]">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Search Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="group relative overflow-hidden rounded-3xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--pulse-jasmine)] hover:shadow-lg sm:col-span-2 lg:col-span-2"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--pulse-jasmine)]/20 blur-[50px] transition-all group-hover:bg-[var(--pulse-jasmine)]/30" />
            <div className="relative flex h-full flex-col justify-between lg:flex-row lg:items-center lg:gap-6">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--pulse-jasmine)] to-[#fff5cc] shadow-lg shadow-[var(--pulse-jasmine)]/30">
                  <BarChart3 className="h-6 w-6 text-[var(--pulse-black)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--pulse-black)]">Search Analytics</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--neutral-600)]">
                  Built-in reporting for click-through rates, keyword performance, and index coverage — no third-party scripts required.
                </p>
              </div>
              <div className="mt-5 flex-1 lg:mt-0">
                <div className="space-y-3 rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
                  {[
                    { label: 'Avg. CTR', value: 8.4, color: 'bg-[var(--pulse-red)]' },
                    { label: 'Index coverage', value: 98, color: 'bg-green-500' },
                    { label: 'Keyword growth', value: 64, color: 'bg-[var(--pulse-jasmine)]' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-[var(--neutral-600)]">{stat.label}</span>
                        <span className="font-bold text-[var(--pulse-black)]">{stat.value}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--neutral-200)]">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${stat.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.6 }}
                          className={`h-full ${stat.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--neutral-600)]"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--neutral-200)] bg-white px-3 py-1.5 shadow-sm">
            <Globe className="h-3.5 w-3.5 text-green-500" />
            SSR-ready out of the box
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--neutral-200)] bg-white px-3 py-1.5 shadow-sm">
            <Zap className="h-3.5 w-3.5 text-[var(--pulse-red)]" />
            100/100 Lighthouse SEO
          </span>
        </motion.div>
      </div>
    </section>
  );
}
