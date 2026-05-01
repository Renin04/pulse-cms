'use client';

import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

import StarBorder from './StarBorder';
import styles from './DynamicCTA.module.css';

export default function DynamicCTA() {
  return (
    <section className={styles.section}>
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={styles.inner}
        >
          <p className={styles.kicker} style={{ color: 'var(--pulse-red)' }}>
            The Rebellion Starts Here
          </p>

          <h2 className={styles.headline}>
            Ready to start your{' '}
            <span className={styles.accentWord} style={{ color: 'var(--pulse-red)' }}>
              rebellion?
            </span>
          </h2>

          <p className={styles.subhead}>
            Stop publishing documents. Start building experiences that your readers actually want to finish.
          </p>

          <div className={styles.actions}>
            <Link href="/demo" className={styles.ctaLink}>
              <StarBorder
                as="span"
                color="var(--pulse-red)"
                speed="4s"
                thickness={2}
                className={styles.starCta}
                innerClassName={styles.starCtaInner}
                style={{ backgroundColor: 'var(--pulse-red)' }}
              >
                <span className={styles.starCtaContent}>
                  <Sparkles className="w-4 h-4" />
                  Start building for free
                  <ArrowRight className="w-4 h-4" />
                </span>
              </StarBorder>
            </Link>

            <Link
              href="/docs"
              className={styles.secondaryLink}
            >
              Read the docs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className={styles.finePrint}>
            No credit card required · Open source · Works with Next.js, Nuxt, Astro
          </p>
        </motion.div>
      </div>
    </section>
  );
}
