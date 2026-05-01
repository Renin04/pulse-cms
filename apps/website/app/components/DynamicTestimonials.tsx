'use client';

import { motion } from 'motion/react';
import { Code, GraduationCap, PenTool, TrendingUp, Quote } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import SpotlightCard from './SpotlightCard';
import styles from './DynamicTestimonials.module.css';

const testimonialsByPersona: Record<string, Array<{
  quote: string;
  name: string;
  role: string;
  icon: React.ReactNode;
  color: string;
  spotlight: string;
}>> = {
  learn: [
    {
      quote: 'I built an entire course inside Pulse. Students actually finish the lessons now because they are part of the story.',
      name: 'Dr. Sarah Miller',
      role: 'Course Creator',
      icon: <GraduationCap className="w-5 h-5" />,
      color: '#fbbf24',
      spotlight: 'rgba(251, 191, 36, 0.2)',
    },
    {
      quote: 'My readers went from skimming to spending 12+ minutes per article. The quiz blocks changed everything.',
      name: 'Marcus Johnson',
      role: 'Content Strategist',
      icon: <PenTool className="w-5 h-5" />,
      color: '#a78bfa',
      spotlight: 'rgba(167, 139, 250, 0.2)',
    },
  ],
  build: [
    {
      quote: 'Pulse turned our API docs into an interactive playground. Our dev community engagement went up 3x.',
      name: 'Alex Chen',
      role: 'Developer Advocate',
      icon: <Code className="w-5 h-5" />,
      color: '#60a5fa',
      spotlight: 'rgba(96, 165, 250, 0.2)',
    },
    {
      quote: 'We shipped a branching onboarding flow in one afternoon. It would have taken weeks with any other tool.',
      name: 'Emily Rodriguez',
      role: 'Product Engineer',
      icon: <TrendingUp className="w-5 h-5" />,
      color: '#f87171',
      spotlight: 'rgba(248, 113, 113, 0.2)',
    },
  ],
  default: [
    {
      quote: 'Finally, a publishing tool that respects the reader\'s time. Branching content is a game changer.',
      name: 'Marcus Johnson',
      role: 'Content Strategist',
      icon: <PenTool className="w-5 h-5" />,
      color: '#a78bfa',
      spotlight: 'rgba(167, 139, 250, 0.2)',
    },
    {
      quote: 'Our product launches went from static press releases to immersive experiences. The difference is night and day.',
      name: 'Emily Rodriguez',
      role: 'Product Marketer',
      icon: <TrendingUp className="w-5 h-5" />,
      color: '#f87171',
      spotlight: 'rgba(248, 113, 113, 0.2)',
    },
  ],
};

export default function DynamicTestimonials({ persona }: { persona: string }) {
  const items = testimonialsByPersona[persona] || testimonialsByPersona.default;
  const kicker = persona === 'learn'
    ? 'Educators who chose experiences'
    : persona === 'build'
    ? 'Builders who ship faster'
    : 'Rebels who switched';

  return (
    <section className={styles.section}>
      <div className="container relative">
        <p className={styles.kicker}>{kicker}</p>
        <div className={styles.headlineWrap}>
          <ScrollReveal className={styles.headline} textClassName={styles.headlineText}>
            They did not just read. They joined.
          </ScrollReveal>
        </div>

        <div className={styles.grid}>
          {items.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <SpotlightCard
                className={styles.card}
                spotlightColor={item.spotlight}
              >
                <div
                  className={styles.accentLine}
                  style={{ backgroundColor: item.color }}
                />
                <Quote className={styles.quoteIcon} style={{ color: item.color }} />
                <p className={styles.quoteText}>{item.quote}</p>
                <div className={styles.meta}>
                  <div
                    className={styles.avatar}
                    style={{ backgroundColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className={styles.name}>{item.name}</div>
                    <div className={styles.role}>{item.role}</div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
