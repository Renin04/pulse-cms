'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lightbulb,
  Zap,
  ArrowRight,
  RotateCcw,
  HelpCircle,
  CheckCircle2,
  Terminal,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import SpotlightCard from './SpotlightCard';
import ShinyText from './ShinyText';
import ScrollReveal from './ScrollReveal';
import StarBorder from './StarBorder';
import styles from './LivingDocument.module.css';

const branches = [
  {
    id: 'learn',
    label: 'I want to learn',
    icon: Lightbulb,
    color: 'var(--pulse-jasmine)',
    spotlight: 'rgba(255, 230, 149, 0.25)',
    content: {
      headline: 'Welcome to the rebellion.',
      body: 'You do not need to be a developer to build something unforgettable. Pulse turns every idea into an interactive experience — one block at a time. Start with a quiz, add a poll, then let your readers choose their own path.',
      cta: 'See how easy it is',
      demoType: 'quiz',
    },
  },
  {
    id: 'build',
    label: 'I want to build',
    icon: Zap,
    color: 'var(--pulse-red)',
    spotlight: 'rgba(255, 40, 0, 0.25)',
    content: {
      headline: 'Built for creators who refuse to settle.',
      body: 'Branching narratives. Live code playgrounds. Manga panels. AI-generated blocks. Pulse is not a blog — it is a publishing engine that adapts to your reader\'s intent, in real time.',
      cta: 'Explore the block universe',
      demoType: 'code',
    },
  },
];

function QuizDemo() {
  const [answered, setAnswered] = useState(false);
  return (
    <div className={styles.demoBox}>
      <div className={styles.demoHeader}>
        <HelpCircle className="w-4 h-4" />
        <span>Quick check</span>
      </div>
      <p className={styles.demoQuestion}>What is the average attention span on a static blog post?</p>
      <div className={styles.demoOptions}>
        {!answered ? (
          <>
            <button className={styles.demoOption} onClick={() => setAnswered(true)}>
              2 minutes
            </button>
            <button className={styles.demoOptionCorrect} onClick={() => setAnswered(true)}>
              8 seconds
            </button>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.demoResult}
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Correct. Most readers never make it past the headline.</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function CodeDemo() {
  return (
    <div className={styles.demoBox}>
      <div className={styles.demoHeader}>
        <Terminal className="w-4 h-4" />
        <span>Live block</span>
      </div>
      <div className={styles.codeBlock}>
        <pre>{`<Branch>
  <Choice label="Beginner" path="intro" />
  <Choice label="Advanced" path="deep-dive" />
</Branch>`}</pre>
        <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText('<Branch>\n  <Choice label="Beginner" path="intro" />\n  <Choice label="Advanced" path="deep-dive" />\n</Branch>')}>
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

interface LivingDocumentProps {
  onBranchSelect?: (branchId: string) => void;
}

export default function LivingDocument({ onBranchSelect }: LivingDocumentProps) {
  const [activeBranch, setActiveBranch] = useState<string | null>(null);
  const selected = branches.find((b) => b.id === activeBranch);

  const handleSelect = (branchId: string) => {
    setActiveBranch(branchId);
    onBranchSelect?.(branchId);
  };

  return (
    <section className={styles.section}>
      <div className="container relative">
        <div className={styles.kicker}>
          <ShinyText
            text="This is not a blog post. This is Pulse."
            color="#9ca3af"
            shineColor="#FF2800"
            speed={3}
            spread={90}
          />
        </div>

        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={styles.intro}
            >
              <div className={styles.headlineReveal}>
                <ScrollReveal
                  className={styles.scrollRevealHeadline}
                  textClassName={styles.scrollRevealText}
                >
                  Most readers scroll. But what if they could choose?
                </ScrollReveal>
              </div>

              <p className={styles.lead}>
                Below is a living document. It adapts based on what you want. No walls of text. No
                endless scrolling. Just the experience you asked for.
              </p>

              <div className={styles.choiceGrid}>
                {branches.map((branch, index) => {
                  const Icon = branch.icon;
                  return (
                    <motion.div
                      key={branch.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.4 + index * 0.15,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                    >
                      <SpotlightCard
                        className={styles.choiceCard}
                        spotlightColor={branch.spotlight}
                      >
                        <button
                          className={styles.choiceBtn}
                          onClick={() => handleSelect(branch.id)}
                          style={{ '--accent': branch.color } as React.CSSProperties}
                        >
                          <span className={styles.choiceIcon}>
                            <Icon className="w-6 h-6" />
                          </span>
                          <span className={styles.choiceLabel}>{branch.label}</span>
                          <ArrowRight className={styles.choiceArrow} />
                        </button>
                      </SpotlightCard>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={styles.content}
            >
              <motion.div
                className={styles.documentPaper}
                initial={{ y: 40 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className={styles.accentLine}
                  style={{ backgroundColor: selected.color }}
                />
                <h3 className={styles.contentHeadline}>{selected.content.headline}</h3>
                <p className={styles.contentBody}>{selected.content.body}</p>

                {selected.content.demoType === 'quiz' && <QuizDemo />}
                {selected.content.demoType === 'code' && <CodeDemo />}

                <div className={styles.contentFooter}>
                  <Link href="/demo" className={styles.ctaLink}>
                    <StarBorder
                      as="span"
                      color={selected.color}
                      speed="4s"
                      thickness={2}
                      className={styles.starCta}
                      innerClassName={styles.starCtaInner}
                      style={{ backgroundColor: selected.color }}
                    >
                      <span className={styles.starCtaContent}>
                        {selected.content.cta}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </StarBorder>
                  </Link>

                  <button
                    className={styles.resetBtn}
                    onClick={() => {
                      setActiveBranch(null);
                      onBranchSelect?.('');
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Choose again
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
