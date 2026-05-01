'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

const steps = [
  {
    question: "What's your content type?",
    options: [
      { label: 'Educational Course', emoji: '🎓', value: 'education' },
      { label: 'Interactive Story',  emoji: '📖', value: 'story' },
      { label: 'Product Docs',       emoji: '📋', value: 'docs' },
      { label: 'Technical Tutorial', emoji: '⚙️', value: 'tutorial' },
    ],
  },
  {
    question: 'Choose your engagement style',
    options: [
      { label: 'Quizzes & Tests',      emoji: '🎯', value: 'quizzes' },
      { label: 'Live Code Demos',      emoji: '⚡', value: 'code' },
      { label: 'Branching Narratives', emoji: '🌿', value: 'branching' },
      { label: 'Animated Reveals',     emoji: '🎬', value: 'animate' },
    ],
  },
  {
    question: 'How much AI involvement?',
    options: [
      { label: 'Full AI Author',   emoji: '✨', value: 'full-ai' },
      { label: 'AI Co-writer',     emoji: '🤝', value: 'co-ai' },
      { label: 'AI Suggestions',   emoji: '💡', value: 'suggest' },
      { label: 'Manual only',      emoji: '✍️', value: 'manual' },
    ],
  },
];

const outcomes: Record<string, Record<string, Record<string, string>>> = {
  education: {
    quizzes:   { 'full-ai': 'An AI-generated course with inline quizzes, instant feedback, and spaced repetition.', 'co-ai': 'A collaborative course where AI drafts quiz blocks while you guide the narrative.', suggest: 'Your course, enhanced with AI quiz suggestions after each section.', manual: 'A hand-crafted educational experience with custom quiz blocks.' },
    code:      { 'full-ai': 'A live coding course where AI writes interactive playgrounds from your topic description.', 'co-ai': 'AI-assisted code demos paired with your explanations.', suggest: 'AI helps you scaffold code blocks — you fill in the teaching.', manual: 'A fully manual coding tutorial with embedded live editors.' },
    branching: { 'full-ai': 'An adaptive learning path — AI builds branching based on quiz outcomes.', 'co-ai': 'AI drafts the branching structure, you customize each path.', suggest: 'Branching hints suggested by AI based on your content.', manual: 'A choose-your-own-path course you design entirely.' },
    animate:   { 'full-ai': 'AI generates scroll-triggered reveals for each concept, automatically paced.', 'co-ai': 'AI proposes animation moments, you approve and refine them.', suggest: 'Subtle AI-suggested animations to emphasize key learning moments.', manual: 'Custom scroll animations crafted exactly how you envision.' },
  },
  story: {
    quizzes:   { 'full-ai': 'An AI interactive story with reader polls that shape the plot direction.', 'co-ai': 'Co-authored story with AI-written quiz moments that influence outcomes.', suggest: 'Your story, with AI-suggested reader choice moments.', manual: 'A hand-written interactive narrative with reader polls.' },
    code:      { 'full-ai': 'A techno-thriller where code demos are part of the plot.', 'co-ai': 'AI writes the story scenes, you code the interactive demos.', suggest: 'AI suggests code blocks to embed in your technical story.', manual: 'A manually crafted story with live code experiments woven in.' },
    branching: { 'full-ai': 'A fully AI-authored choose-your-adventure story with dozens of paths.', 'co-ai': 'AI drafts branch points while you write the narrative voice.', suggest: 'AI recommends decision points based on your story beats.', manual: 'A classic choose-your-own-adventure story, built by hand.' },
    animate:   { 'full-ai': 'A cinematic story that animates each reveal as the reader scrolls deeper.', 'co-ai': 'AI designs the animation choreography, you write the scenes.', suggest: 'AI adds drama with suggested scroll-reveal moments.', manual: 'A visually crafted story with manually timed animations.' },
  },
  docs: {
    quizzes:   { 'full-ai': 'AI-generated docs with embedded comprehension checks after each section.', 'co-ai': 'You write the docs, AI adds knowledge-check quiz blocks.', suggest: 'AI suggests quiz points — you decide which ones to publish.', manual: 'Technical docs with hand-crafted assessment blocks.' },
    code:      { 'full-ai': 'Docs that write themselves from your API — with live code examples auto-generated.', 'co-ai': 'AI scaffolds code examples, you refine and annotate them.', suggest: 'AI recommends code snippets to illustrate each concept.', manual: 'Lovingly hand-crafted docs with live executable examples.' },
    branching: { 'full-ai': 'Adaptive docs: AI routes readers to the right path based on their role.', 'co-ai': 'AI builds the routing logic, you write each documentation path.', suggest: 'AI suggests branching for beginner vs advanced readers.', manual: 'Role-based documentation paths built entirely by you.' },
    animate:   { 'full-ai': 'Docs with AI-placed scroll reveals to surface key information progressively.', 'co-ai': 'AI choreographs which sections animate, you control the content.', suggest: 'AI highlights sections worth animating for emphasis.', manual: 'Documentation with precisely timed scroll animations.' },
  },
  tutorial: {
    quizzes:   { 'full-ai': 'An AI-built step-by-step tutorial with comprehension quizzes at every milestone.', 'co-ai': 'Your tutorial steps paired with AI-written quiz checkpoints.', suggest: 'AI suggests quiz moments between tutorial steps.', manual: 'A thorough tutorial with hand-built comprehension checks.' },
    code:      { 'full-ai': 'AI writes the entire tutorial + live code playground from your description.', 'co-ai': 'AI scaffolds the code demos, you add the teaching narrative.', suggest: 'AI recommends interactive code blocks to complement your steps.', manual: 'A fully manual deep-dive with embedded live coding environments.' },
    branching: { 'full-ai': 'AI builds beginner and advanced paths through your tutorial automatically.', 'co-ai': 'AI designs the branching structure, you author each learning path.', suggest: 'AI identifies where branching would serve different skill levels.', manual: 'A multi-path tutorial where each branch is hand-crafted.' },
    animate:   { 'full-ai': 'AI paces your tutorial reveals — each step appears exactly when needed.', 'co-ai': 'AI designs the reveal timing, you focus on the content quality.', suggest: 'AI highlights the best moments for scroll-triggered reveals.', manual: 'A tutorial where every animation beat is manually designed.' },
  },
};

function getOutcome(selections: string[]): string {
  const [content, engagement, ai] = selections;
  return outcomes[content]?.[engagement]?.[ai] ?? 'A uniquely interactive Pulse experience tailored to your vision.';
}

export default function BuildingPathStepper() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  const handleSelect = (value: string) => {
    const newSelections = [...selections.slice(0, currentStep), value];
    setSelections(newSelections);
    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      setTimeout(() => setCompleted(true), 300);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelections([]);
    setCompleted(false);
  };

  return (
    <div className="stepper-shell">
      <div className="step-progress">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`step-dot${i < currentStep || completed ? ' done' : i === currentStep && !completed ? ' active' : ''}`}
          />
        ))}
      </div>

      {completed ? (
        <div className="outcome-card">
          <CheckCircle className="outcome-check" size={40} strokeWidth={1.5} />
          <div className="outcome-tags">
            {selections.map((sel, i) => {
              const option = steps[i]?.options.find(o => o.value === sel);
              return option ? (
                <span key={i} className="outcome-tag">{option.emoji} {option.label}</span>
              ) : null;
            })}
          </div>
          <p className="outcome-text">{getOutcome(selections)}</p>
          <button className="reset-btn" onClick={handleReset}>↩ Start over</button>
        </div>
      ) : (
        <>
          <h3 className="step-question">{steps[currentStep].question}</h3>
          <div className="step-options">
            {steps[currentStep].options.map((opt) => (
              <button
                key={opt.value}
                className={`step-option-btn${selections[currentStep] === opt.value ? ' selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span className="step-option-emoji">{opt.emoji}</span>
                <span className="step-option-label">{opt.label}</span>
                <ArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.3, flexShrink: 0 }} />
              </button>
            ))}
          </div>
          {currentStep > 0 && (
            <div className="mt-4 text-center">
              <button
                className="reset-btn"
                onClick={() => {
                  setCurrentStep(currentStep - 1);
                  setSelections(selections.slice(0, currentStep - 1));
                }}
              >
                ← Back
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
