'use client';

import { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock3, Tag, User } from 'lucide-react';
import { getBlogFeaturedMedia } from '../../lib/blog-feature-media';
import { formatDisplayDate } from '../../lib/site-content';
import { useBackendBlogEntry } from '../../lib/use-backend-entries';
import type { AdaptedBlogEntry } from '../../lib/entry-adapter';
import { buildSandboxSrcdoc, buildPyodideSrcdoc, base64ToUtf8 } from '@pulse/blocks';
import { hydrateCarousels } from '../../lib/hydrate-carousels';
import { hydrateSpoilers } from '../../lib/hydrate-spoiler';
import { hydrateTabs } from '../../lib/hydrate-tabs';
import { hydrateDisclosures } from '../../lib/hydrate-disclosure';
import { hydrateSteppedEquations } from '../../lib/hydrate-stepped-equations';
import { hydrateAutoSolveEquations } from '../../lib/hydrate-auto-solve';
import { hydrateBranches } from '../../lib/hydrate-branches';
import { hydrateBranchGates } from '../../lib/hydrate-branch-gates';
import { hydrateMaps } from '../../lib/hydrate-maps';
import { hydrateBeforeAfter } from '../../lib/hydrate-before-after';
import { hydrateFlashcards } from '../../lib/hydrate-flashcards';
import { hydrateTimelines } from '../../lib/hydrate-timelines';
import { hydrateAnnotatedImages } from '../../lib/hydrate-annotated-images';

import SpotlightCard from '../components/SpotlightCard';
import ReadingProgress from '../components/ReadingProgress';
import TableOfContents from '../components/TableOfContents';
import ShareButtons from '../components/ShareButtons';
import ReadingModeControls from '../components/ReadingModeControls';
import RelatedPosts from '../components/RelatedPosts';
export default function BlogPostContent({
  slug,
  entry: serverEntry,
}: {
  slug?: string;
  entry?: AdaptedBlogEntry | null;
}) {
  const { entry: clientEntry, loading } = useBackendBlogEntry(slug ?? null);

  const entry = serverEntry ?? clientEntry;

  // Event delegation for code block tabs and run buttons
  useEffect(() => {
    if (!entry?.html) return;

    const article = document.getElementById('blog-article-body');
    if (!article) return;

    function hydrateDemoIframes(container: Element) {
      container.querySelectorAll('iframe[title="Code demo"]').forEach((iframe) => {
        const el = iframe as HTMLIFrameElement;
        if (el.srcdoc) return;
        const codeB64 = el.getAttribute('data-code');
        const language = el.getAttribute('data-language');
        if (codeB64 && language) {
          try {
            const code = base64ToUtf8(codeB64);
            el.srcdoc = buildSandboxSrcdoc(code, language);
          } catch (e) {
            console.error('[BlogPost] Failed to hydrate demo iframe:', e)
          }
        }
      });

      // Fallback: create missing demo iframes for blocks that don't have one
      container.querySelectorAll('.pulse-code-block[data-mode="demo"]').forEach((block) => {
        const nextEl = block.nextElementSibling;
        if (nextEl && nextEl.tagName === 'IFRAME' && nextEl.getAttribute('title') === 'Code demo') {
          return;
        }
        const codeB64 = block.getAttribute('data-code');
        const language = block.getAttribute('data-language');
        if (!codeB64 || !language) return;
        try {
          const code = base64ToUtf8(codeB64);
          const iframe = document.createElement('iframe');
          iframe.sandbox = 'allow-scripts';
          iframe.title = 'Code demo';
          iframe.srcdoc = buildSandboxSrcdoc(code, language);
          iframe.style.cssText = 'width:100%;min-height:200px;border:none;display:block;background:transparent;';
          iframe.setAttribute('data-language', language);
          iframe.setAttribute('data-code', codeB64);
          block.parentNode?.insertBefore(iframe, block.nextSibling);
        } catch (e) {
          console.error('[BlogPost] Failed to create demo iframe fallback:', e)
        }
      });
    }

    hydrateDemoIframes(article);

    // Hydrate video blocks: click-to-load for embeds and play button for HTML5
    function hydrateVideoBlocks(container: Element) {
      container.querySelectorAll('.pulse-video-clickload').forEach((el) => {
        const div = el as HTMLElement;
        if (div.dataset.hydrated) return;
        div.dataset.hydrated = 'true';
        div.addEventListener('click', (e) => {
          // Don't intercept clicks on the external link
          if ((e.target as HTMLElement).closest('.pulse-video-external-link')) return;
          const src = div.getAttribute('data-src');
          const title = div.getAttribute('data-title') || 'Video';
          if (!src) return;
          const iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.title = title;
          iframe.loading = 'lazy';
          iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
          iframe.allowFullscreen = true;
          iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;display:block;';
          div.parentNode?.replaceChild(iframe, div);
        });
      });
    }
    hydrateVideoBlocks(article);

    // Interactive block hydration (selectors match the actual block markup).
    // Self-healing: React can re-write the content div's innerHTML AFTER
    // hydration when the SSR-rendered markup and the client fiber's copy of
    // entry.html disagree. That wipes every listener and attribute the
    // hydrators attached — watch the article body and re-run them whenever
    // block content gets replaced.
    let disposeHydrators = () => {};
    const runHydrators = () => {
      disposeHydrators();
      const cleanups = [
        hydrateCarousels(article),
        hydrateSpoilers(article),
        hydrateTabs(article),
        hydrateDisclosures(article),
        hydrateSteppedEquations(article),
        hydrateAutoSolveEquations(article),
        // Branches first: restores the saved choice synchronously, then gates
        // mirror that restored state on their initial sync.
        hydrateBranches(article),
        hydrateBranchGates(article),
        hydrateMaps(article),
        hydrateBeforeAfter(article),
        hydrateFlashcards(article),
        hydrateTimelines(article),
        hydrateAnnotatedImages(article),
      ];
      disposeHydrators = () => cleanups.forEach((fn) => fn());
    };
    runHydrators();

    let rehydrateTimer: ReturnType<typeof setTimeout> | null = null;
    const rehydrateObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (
            node instanceof HTMLElement &&
            (node.hasAttribute('data-block-type') || node.querySelector('[data-block-type]'))
          ) {
            if (rehydrateTimer) clearTimeout(rehydrateTimer);
            rehydrateTimer = setTimeout(runHydrators, 50);
            return;
          }
        }
      }
    });
    rehydrateObserver.observe(article, { childList: true, subtree: true });

    // Use MutationObserver to catch iframes added by React after initial hydration
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (node.tagName === 'IFRAME' && node.getAttribute('title') === 'Code demo') {
              hydrateDemoIframes(article);
              return;
            }
            if (node.querySelector('iframe[title="Code demo"]')) {
              hydrateDemoIframes(article);
              return;
            }
            if (node.querySelector('.pulse-video-clickload')) {
              hydrateVideoBlocks(article);
              return;
            }
          }
        }
      }
    });
    observer.observe(article, { childList: true, subtree: true });

    function evaluateQuiz(quiz: HTMLElement) {
      const opts = quiz.querySelectorAll('.pulse-quiz-option');
      const res = quiz.querySelector('.pulse-quiz-result') as HTMLElement | null;
      const successMsg = quiz.getAttribute('data-success') || 'Correct!';
      const failureMsg = quiz.getAttribute('data-failure') || 'Some answers are incorrect. Try again.';

      opts.forEach((o) => {
        o.removeAttribute('data-evaluated');
        const ex = o.querySelector('.pulse-quiz-explanation') as HTMLElement | null;
        if (ex) ex.hidden = true;
      });

      const selected = quiz.querySelectorAll('input:checked');
      let allCorrect = true;
      let anySelected = false;

      selected.forEach((s) => {
        anySelected = true;
        const li = s.closest('li') as HTMLElement | null;
        if (!li) return;
        const isCorrect = li.getAttribute('data-correct') === 'true';
        if (isCorrect) {
          li.setAttribute('data-evaluated', 'correct');
        } else {
          li.setAttribute('data-evaluated', 'incorrect');
          allCorrect = false;
        }
      });

      // Show explanations for ALL correct answers (always)
      opts.forEach((o) => {
        const isCorrect = o.getAttribute('data-correct') === 'true';
        const ex = o.querySelector('.pulse-quiz-explanation') as HTMLElement | null;
        if (isCorrect && ex) {
          ex.hidden = false;
        }
      });

      // Also show explanations for selected incorrect answers
      selected.forEach((s) => {
        const li = s.closest('li') as HTMLElement | null;
        if (!li) return;
        const isCorrect = li.getAttribute('data-correct') === 'true';
        const ex = li.querySelector('.pulse-quiz-explanation') as HTMLElement | null;
        if (!isCorrect && ex) {
          ex.hidden = false;
        }
      });

      // Only the user's selected options get data-evaluated styling

      if (anySelected && res) {
        const correctCount = quiz.querySelectorAll('li[data-correct="true"]').length;
        const isFullyCorrect = allCorrect && selected.length === correctCount;
        res.className = isFullyCorrect ? 'pulse-quiz-result correct' : 'pulse-quiz-result incorrect';
        const textEl = res.querySelector('.pulse-quiz-result-text') as HTMLElement | null;
        if (textEl) textEl.textContent = isFullyCorrect ? successMsg : failureMsg;
        res.hidden = false;
      }

      // Show retract button after evaluation
      const retractBtn = quiz.querySelector('.pulse-quiz-retract') as HTMLElement | null;
      if (retractBtn) retractBtn.hidden = !anySelected;
    }

    function handleClick(e: Event) {
      const target = e.target as HTMLElement;

      // Alert dismiss with animation
      const dismissBtn = target.closest('[data-dismiss-alert]');
      if (dismissBtn) {
        const alertEl = dismissBtn.closest('.pulse-alert') as HTMLElement | null;
        if (alertEl) {
          e.preventDefault();
          e.stopPropagation();
          alertEl.setAttribute('data-dismissing', 'true');
          setTimeout(() => {
            alertEl.hidden = true;
            alertEl.removeAttribute('data-dismissing');
          }, 350);
        }
        return;
      }

      // Video play button (HTML5) — the overlay play btn has pointer-events:auto
      const playBtn = target.closest('.pulse-video-play-btn');
      if (playBtn) {
        const card = playBtn.closest('.pulse-video-card');
        if (!card) return;
        const video = card.querySelector('video');
        if (video) {
          e.preventDefault();
          e.stopPropagation();
          video.play();
        }
        return;
      }

      const tab = target.closest('.pulse-code-tab');
      if (tab) {
        const block = tab.closest('.pulse-code-block');
        if (!block) return;
        const tabName = tab.getAttribute('data-tab');
        block.setAttribute('data-active-tab', tabName || '');
        block.querySelectorAll('.pulse-code-tab').forEach((t) => {
          t.classList.toggle('active', t === tab);
        });
        return;
      }

      const runBtn = target.closest('[data-run]');
      if (runBtn) {
        const block = runBtn.closest('.pulse-code-block');
        if (!block) return;
        const iframe = block.querySelector('.pulse-code-panel[data-panel="output"] iframe') as HTMLIFrameElement | null;
        if (iframe) {
          const mode = block.getAttribute('data-mode');
          const language = block.getAttribute('data-language') || 'javascript';
          if (mode === 'sandbox') {
            const editor = block.querySelector('[data-sandbox-editor]') as HTMLTextAreaElement | null;
            const code = editor?.value || '';
            const isPython = language === 'python';
            iframe.srcdoc = isPython ? buildPyodideSrcdoc(code) : buildSandboxSrcdoc(code, language);
          } else {
            const codeB64 = iframe.getAttribute('data-code');
            if (codeB64) {
              try {
                const code = base64ToUtf8(codeB64);
                iframe.srcdoc = buildSandboxSrcdoc(code, language);
              } catch {
                // ignore
              }
            }
          }
        }
        block.setAttribute('data-active-tab', 'output');
        block.querySelectorAll('.pulse-code-tab').forEach((t) => {
          t.classList.toggle('active', t.getAttribute('data-tab') === 'output');
        });
        return;
      }

      // Quiz submit button
      const quizSubmit = target.closest('.pulse-quiz-submit');
      if (quizSubmit) {
        const quiz = quizSubmit.closest('.pulse-quiz');
        if (quiz) evaluateQuiz(quiz as HTMLElement);
        return;
      }

      // Quiz retract / reset
      const quizRetract = target.closest('.pulse-quiz-retract');
      if (quizRetract) {
        const quiz = quizRetract.closest('.pulse-quiz');
        if (!quiz) return;
        const opts = quiz.querySelectorAll('.pulse-quiz-option');
        opts.forEach((o) => {
          o.removeAttribute('data-evaluated');
          const input = o.querySelector('input') as HTMLInputElement | null;
          if (input) input.checked = false;
          const ex = o.querySelector('.pulse-quiz-explanation') as HTMLElement | null;
          if (ex) ex.hidden = true;
        });
        const res = quiz.querySelector('.pulse-quiz-result') as HTMLElement | null;
        if (res) res.hidden = true;
        (quizRetract as HTMLElement).hidden = true;
        return;
      }

      // Poll vote — with optimistic UI update
      const pollBtn = target.closest('.pulse-poll-btn');
      if (pollBtn) {
        const poll = pollBtn.closest('.pulse-poll');
        if (!poll) return;
        const li = pollBtn.closest('li');
        if (!li) return;
        const optionId = li.getAttribute('data-option-id');
        if (!optionId) return;

        // Prevent double-clicks while a request is in flight
        if ((poll as any).__voting) return;
        (poll as any).__voting = true;
        poll.setAttribute('data-voting', 'true');

        const isMultiple = poll.getAttribute('data-allow-multiple') === 'true';
        const pollHash = poll.getAttribute('data-poll-id');
        if (!pollHash || !entry?.id) {
          (poll as any).__voting = false;
          poll.removeAttribute('data-voting');
          return;
        }

        // Capture pre-click state for potential revert
        const preClickVotes: Record<string, number> = {};
        const preClickVoted = new Set<string>();
        poll.querySelectorAll('li').forEach((item) => {
          const oid = item.getAttribute('data-option-id');
          if (!oid) return;
          preClickVotes[oid] = parseInt(item.getAttribute('data-votes') || '0', 10);
          if (item.classList.contains('voted')) preClickVoted.add(oid);
        });

        // Optimistically compute new state
        const optimisticMyVotes = new Set(preClickVoted);
        if (isMultiple) {
          if (optimisticMyVotes.has(optionId)) {
            optimisticMyVotes.delete(optionId);
            preClickVotes[optionId] = Math.max(0, preClickVotes[optionId] - 1);
          } else {
            optimisticMyVotes.add(optionId);
            preClickVotes[optionId] = (preClickVotes[optionId] || 0) + 1;
          }
        } else {
          // Single choice: deselect all, select clicked
          optimisticMyVotes.forEach((oid) => {
            preClickVotes[oid] = Math.max(0, preClickVotes[oid] - 1);
          });
          optimisticMyVotes.clear();
          optimisticMyVotes.add(optionId);
          preClickVotes[optionId] = (preClickVotes[optionId] || 0) + 1;
        }

        // Apply optimistic update immediately
        updatePollBars(poll, {}, Array.from(optimisticMyVotes));

        const voteVoterId = getVoterId();
        fetch('/api/polls/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entryId: entry.id,
            pollHash,
            optionId,
            allowMultiple: isMultiple,
            voterId: voteVoterId,
          }),
        })
          .then(async (res) => {
            const payload = await res.json();
            if (!res.ok) {
              console.error('[Poll vote] API error:', res.status, payload);
              // Revert on API error
              updatePollBars(poll, {}, Array.from(preClickVoted));
              return;
            }
            const { counts, myVotes } = payload.data || {};
            // vote saved successfully
            if (entry?.id && pollHash) {
              savePollVoteBackup(entry.id, pollHash, myVotes || []);
            }
            updatePollBars(poll, counts || {}, myVotes || []);
          })
          .catch((err) => {
            console.error('[Poll vote] Network error:', err);
            // Revert on network error
            updatePollBars(poll, {}, Array.from(preClickVoted));
          })
          .finally(() => {
            (poll as any).__voting = false;
            poll.removeAttribute('data-voting');
          });
        return;
      }

      // Poll retract
      const pollRetract = target.closest('.pulse-poll-retract');
      if (pollRetract) {
        const poll = pollRetract.closest('.pulse-poll');
        if (!poll) return;
        const pollHash = poll.getAttribute('data-poll-id');
        if (!pollHash || !entry?.id) return;

        // Prevent double-clicks while a request is in flight
        if ((poll as any).__voting) return;
        (poll as any).__voting = true;
        poll.setAttribute('data-voting', 'true');

        // Capture pre-click state for potential revert
        const preClickVoted = new Set<string>();
        poll.querySelectorAll('li').forEach((item) => {
          const oid = item.getAttribute('data-option-id');
          if (oid && item.classList.contains('voted')) preClickVoted.add(oid);
        });

        // Optimistically clear all votes
        updatePollBars(poll, {}, []);

        const retractVoterId = getVoterId();
        fetch('/api/polls/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entryId: entry.id,
            pollHash,
            retractAll: true,
            voterId: retractVoterId,
          }),
        })
          .then(async (res) => {
            const payload = await res.json();
            if (!res.ok) {
              console.error('[Poll retract] API error:', res.status, payload);
              updatePollBars(poll, {}, Array.from(preClickVoted));
              return;
            }
            const { counts, myVotes } = payload.data || {};
            // vote retracted successfully
            if (entry?.id && pollHash) {
              savePollVoteBackup(entry.id, pollHash, myVotes || []);
            }
            updatePollBars(poll, counts || {}, myVotes || []);
          })
          .catch((err) => {
            console.error('[Poll retract] Network error:', err);
            updatePollBars(poll, {}, Array.from(preClickVoted));
          })
          .finally(() => {
            (poll as any).__voting = false;
            poll.removeAttribute('data-voting');
          });
        return;
      }
    }

    function handleChange(e: Event) {
      const target = e.target as HTMLElement;
      if (!target.matches('.pulse-quiz-label input')) return;
      const quiz = target.closest('.pulse-quiz');
      if (!quiz) return;
      const isMultiple = quiz.getAttribute('data-multiple') === 'true';
      if (!isMultiple) {
        evaluateQuiz(quiz as HTMLElement);
      }
    }

    function handleSubmit(e: Event) {
      const form = e.target as HTMLFormElement;
      const survey = form.closest('.pulse-survey');
      if (!survey || !entry?.id) return;
      e.preventDefault();

      const surveyHash = survey.getAttribute('data-survey-id');
      if (!surveyHash) return;

      const submitBtn = form.querySelector('.pulse-survey-submit') as HTMLButtonElement | null;
      const btnText = form.querySelector('.pulse-survey-submit-text') as HTMLElement | null;
      const spinner = form.querySelector('.pulse-survey-submit-spinner') as HTMLElement | null;
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.hidden = true;
      if (spinner) spinner.hidden = false;

      const answers: { questionId: string; answer: string }[] = [];
      const questions = survey.querySelectorAll('.pulse-survey-question');
      questions.forEach((q) => {
        const questionId = q.getAttribute('data-question-id');
        if (!questionId) return;
        const type = q.getAttribute('data-question-type');
        if (type === 'multi') {
          const checked = Array.from(q.querySelectorAll('input[type="checkbox"]:checked')).map((cb) => (cb as HTMLInputElement).value);
          if (checked.length > 0) answers.push({ questionId, answer: JSON.stringify(checked) });
        } else if (type === 'text') {
          const textarea = q.querySelector('textarea') as HTMLTextAreaElement | null;
          if (textarea && textarea.value.trim()) answers.push({ questionId, answer: textarea.value.trim() });
        } else {
          const checked = q.querySelector('input[type="radio"]:checked') as HTMLInputElement | null;
          if (checked) answers.push({ questionId, answer: checked.value });
        }
      });

      if (answers.length === 0) {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.hidden = false;
        if (spinner) spinner.hidden = true;
        return;
      }

      const surveyVoterId = getVoterId();
      const errorEl = form.querySelector('.pulse-survey-error') as HTMLElement | null;
      if (errorEl) errorEl.hidden = true;

      fetch('/api/surveys/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: entry.id, surveyHash, answers, voterId: surveyVoterId }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            console.error('[Survey submit] API error:', res.status, payload);
            if (submitBtn) submitBtn.disabled = false;
            if (btnText) btnText.hidden = false;
            if (spinner) spinner.hidden = true;
            if (errorEl) errorEl.removeAttribute('hidden');
            return;
          }
          // Show success state
          const questionsWrap = form.querySelector('.pulse-survey-questions');
          const actions = form.querySelector('.pulse-survey-actions');
          const success = form.querySelector('.pulse-survey-success');
          if (questionsWrap) questionsWrap.setAttribute('hidden', '');
          if (actions) actions.setAttribute('hidden', '');
          if (success) success.removeAttribute('hidden');
          // Mark as submitted in backup
          try {
            const raw = localStorage.getItem('pulse-survey-submitted');
            const submitted = raw ? JSON.parse(raw) as Record<string, string[]> : {};
            if (!submitted[entry.id]) submitted[entry.id] = [];
            if (!submitted[entry.id].includes(surveyHash)) submitted[entry.id].push(surveyHash);
            localStorage.setItem('pulse-survey-submitted', JSON.stringify(submitted));
          } catch { /* ignore */ }
        })
        .catch((err) => {
          console.error('[Survey submit] Network error:', err);
          if (submitBtn) submitBtn.disabled = false;
          if (btnText) btnText.hidden = false;
          if (spinner) spinner.hidden = true;
          if (errorEl) errorEl.removeAttribute('hidden');
        });
    }

    function restoreSurveyStates(container: Element) {
      if (!entry?.id) return;
      try {
        const raw = localStorage.getItem('pulse-survey-submitted');
        if (!raw) return;
        const submitted = JSON.parse(raw) as Record<string, string[]>;
        const hashes = submitted[entry.id] || [];
        container.querySelectorAll('.pulse-survey').forEach((survey) => {
          const surveyHash = survey.getAttribute('data-survey-id');
          if (!surveyHash || !hashes.includes(surveyHash)) return;
          const form = survey.querySelector('form');
          if (!form) return;
          const questionsWrap = form.querySelector('.pulse-survey-questions');
          const actions = form.querySelector('.pulse-survey-actions');
          const success = form.querySelector('.pulse-survey-success');
          if (questionsWrap) questionsWrap.setAttribute('hidden', '');
          if (actions) actions.setAttribute('hidden', '');
          if (success) success.removeAttribute('hidden');
        });
      } catch { /* ignore */ }
    }

    // Tooltip positioning for image figures (pseudo-elements can't follow mouse without CSS vars)
    function handleMouseMove(e: MouseEvent) {
      const figure = (e.target as HTMLElement).closest('.pulse-image-figure[data-tooltip]') as HTMLElement | null;
      if (!figure) return;
      const rect = figure.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      figure.style.setProperty('--tooltip-x', `${x}px`);
      figure.style.setProperty('--tooltip-y', `${y}px`);
    }
    function updatePollBars(poll: Element, counts: Record<string, number>, myVotes: string[]) {
      // React StrictMode or re-renders can detach the captured element.
      // If detached, look it up fresh in the DOM by data-poll-id.
      if (!(poll as any).isConnected) {
        const pollHash = poll.getAttribute('data-poll-id');
        if (pollHash) {
          const fresh = document.querySelector(`.pulse-poll[data-poll-id="${CSS.escape(pollHash)}"]`);
          if (fresh) poll = fresh;
        }
      }
      const lis = Array.from(poll.querySelectorAll('li'));
      let total = 0;
      lis.forEach((li) => {
        const optionId = li.getAttribute('data-option-id');
        const originalVotes = parseInt(li.getAttribute('data-original-votes') || '0', 10);
        const dbCount = optionId ? (counts[optionId] ?? 0) : 0;
        const displayVotes = originalVotes + dbCount;
        li.setAttribute('data-votes', String(displayVotes));
        if (optionId && myVotes.includes(optionId)) {
          li.classList.add('voted');
        } else {
          li.classList.remove('voted');
        }
        total += displayVotes;
      });
      lis.forEach((li) => {
        const v = parseInt(li.getAttribute('data-votes') || '0', 10);
        const pct = total > 0 ? Math.round((v / total) * 100) : 0;
        const bar = li.querySelector('.pulse-poll-bar') as HTMLElement | null;
        const pctLabel = li.querySelector('.pulse-poll-pct') as HTMLElement | null;
        if (bar) bar.style.width = pct + '%';
        if (pctLabel) pctLabel.textContent = pct + '%';
      });
      (poll as any).__votedOptions = new Set(myVotes);
      const retractEl = poll.querySelector('.pulse-poll-retract') as HTMLElement | null;
      if (retractEl) retractEl.hidden = myVotes.length === 0;
    }

    function savePollVoteBackup(entryId: string, pollHash: string, votedOptions: string[]) {
      try {
        const raw = localStorage.getItem('pulse-poll-voted-backup');
        const data = raw ? (JSON.parse(raw) as Record<string, Record<string, string[]>>) : {};
        if (!data[entryId]) data[entryId] = {};
        data[entryId][pollHash] = votedOptions;
        localStorage.setItem('pulse-poll-voted-backup', JSON.stringify(data));
      } catch { /* ignore */ }
    }

    function loadPollVoteBackup(entryId: string, pollHash: string): string[] {
      try {
        const raw = localStorage.getItem('pulse-poll-voted-backup');
        if (!raw) return [];
        const data = JSON.parse(raw) as Record<string, Record<string, string[]>>;
        return data[entryId]?.[pollHash] || [];
      } catch {
        return [];
      }
    }

    let __voterIdMemo: string | null = null;
    function getVoterId(): string {
      if (__voterIdMemo) return __voterIdMemo;
      try {
        let id = localStorage.getItem('pulse-voter-id');
        // localStorage read OK
        if (!id) {
          id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
          localStorage.setItem('pulse-voter-id', id);
          // generated new voterId
        }
        __voterIdMemo = id;
        return id;
      } catch (e) {
        const fallback = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        // localStorage failed, using fallback
        __voterIdMemo = fallback;
        return fallback;
      }
    }

    async function loadPollVotes(container: Element) {
      if (!entry?.id) return;
      const voterId = getVoterId();
      // loadPollVotes starting
      const polls = container.querySelectorAll('.pulse-poll');
      for (const poll of polls) {
        const pollHash = poll.getAttribute('data-poll-id');
        if (!pollHash) continue;
        try {
          const url = `/api/polls/votes?entryId=${encodeURIComponent(entry.id)}&pollHash=${encodeURIComponent(pollHash)}&voterId=${encodeURIComponent(voterId)}`;
          // fetching poll votes
          const res = await fetch(url);
          const payload = await res.json();
          if (!res.ok) {
            console.error('[Poll load] API error:', res.status, payload);
            continue;
          }
          const { counts, myVotes } = payload.data || {};
          // poll load response received
          let mergedMyVotes = myVotes || [];
          if (entry?.id && pollHash && mergedMyVotes.length === 0) {
            const backup = loadPollVoteBackup(entry.id, pollHash);
            // using backup myVotes
            mergedMyVotes = backup;
          }
          updatePollBars(poll, counts || {}, mergedMyVotes);
          // poll votes applied to DOM
        } catch (err) {
          console.error('[Poll load] Network error:', err);
        }
      }
    }

    loadPollVotes(article);
    restoreSurveyStates(article);

    article.addEventListener('mousemove', handleMouseMove);

    article.addEventListener('click', handleClick);
    article.addEventListener('change', handleChange);
    article.addEventListener('submit', handleSubmit);
    return () => {
      article.removeEventListener('click', handleClick);
      article.removeEventListener('change', handleChange);
      article.removeEventListener('submit', handleSubmit);
      article.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
      rehydrateObserver.disconnect();
      if (rehydrateTimer) clearTimeout(rehydrateTimer);
      disposeHydrators();
    };
  }, [entry?.html]);

  const featuredMedia = useMemo(() => (entry ? getBlogFeaturedMedia(entry as unknown as any) : null), [entry]);

  if (!serverEntry && loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center bg-[#f8f6f2]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--pulse-red)]" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] pt-28">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-[var(--neutral-300)] bg-white/60 p-10 text-center backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-[var(--pulse-black)]">Post not found</h1>
            <p className="mt-2 text-[var(--neutral-600)]">
              This post hasn&apos;t been published yet or doesn&apos;t exist.
            </p>
            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--pulse-black)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--pulse-red)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="blog-post-page" className="min-h-screen bg-[#f8f6f2]">
      <ReadingProgress />
      <ReadingModeControls />

      {/* Hero header */}
      <section id="blog-post-header" className="relative overflow-hidden border-b border-black/5 pt-28 pb-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[10%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-red)]/5 blur-[120px]" />
        </div>

        <div className="container relative">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <Link
                id="blog-back-link"
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--neutral-200)] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--neutral-600)] shadow-[0_12px_35px_-28px_rgba(17,24,39,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--pulse-red)]/35 hover:text-[var(--pulse-red)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to blog
              </Link>

              <div id="blog-eyebrow-chip" className="flex items-center gap-2 rounded-full border border-[var(--pulse-red)]/12 bg-[var(--pulse-red)]/8 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--pulse-red)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pulse-red)]">
                  {entry.eyebrow || 'Pulse Story'}
                </span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-[var(--pulse-black)] sm:text-4xl lg:text-5xl">
              {entry.title}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--neutral-600)]">
              {entry.excerpt}
            </p>

            <div id="blog-meta-row" className="mt-8 flex flex-wrap items-center gap-5 text-sm text-[var(--neutral-500)]">
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4" />
                {entry.author}
              </span>
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDisplayDate(entry.publishedAt ?? entry.updatedAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {entry.readTime}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-4 sm:pb-6">
        <div className="container">
          <div className="mx-auto max-w-[80rem]">
            {featuredMedia ? (
              <figure id="blog-feature-media" className="overflow-hidden rounded-[2rem]">
                <img
                  src={featuredMedia.src}
                  alt={featuredMedia.alt}
                  width={1200}
                  height={352}
                  loading="eager"
                  decoding="async"
                  className="h-[14rem] w-full object-cover sm:h-[18rem] lg:h-[22rem]"
                />
              </figure>
            ) : (
              <div
                id="blog-feature-media-fallback"
                className="relative overflow-hidden rounded-[2rem] px-8 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-20"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,40,0,0.96),rgba(255,83,51,0.92)_42%,rgba(255,230,149,0.84))]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_36%)]" />
                <div className="relative flex min-h-[12rem] flex-col justify-between gap-8 text-white">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/82">
                      {entry.eyebrow || 'Pulse Story'}
                    </span>
                    <span className="rounded-full border border-white/16 bg-black/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/72">
                      {entry.readTime}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-6">
                    <div className="max-w-3xl">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                        Featured visual
                      </p>
                      <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                        {entry.title}
                      </h2>
                    </div>
                    <span className="hidden text-7xl font-black leading-none text-white/18 sm:block lg:text-[7.5rem]">
                      {entry.title.charAt(0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="container">
          <div id="blog-content-shell" className="mx-auto max-w-[88rem]">
            <div id="blog-content-wrapper" className="grid gap-8 lg:gap-10">
              <aside id="blog-toc-sidebar" className="min-w-0">
                <div id="blog-toc-rail" className="sticky top-[7rem] space-y-4 self-start">
                  <TableOfContents />
                </div>
              </aside>

              <div id="blog-article-column" className="min-w-0 flex-1">
                <div id="blog-content-card" className="py-0">
                  <div id="blog-article-body">
                    <article className="studio-rendered prose prose-lg max-w-none" suppressHydrationWarning>
                      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: entry.html }} />
                    </article>
                  </div>
                </div>
              </div>

              <aside id="blog-sidebar" className="min-w-0">
                <div id="blog-sidebar-rail" className="space-y-4">
                  <ShareButtons title={entry.title} url={`/blog/${entry.slug}`} />
                  
                  <SpotlightCard
                    id="blog-tags-card"
                    className="blog-sidebar-surface rounded-[1.75rem] p-5"
                    spotlightColor="rgba(255, 40, 0, 0.06)"
                  >
                    <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--neutral-500)]">
                      Tags
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/blog?tag=${encodeURIComponent(tag)}`}
                          className="inline-flex items-center gap-1 rounded-full border border-black/8 bg-white/80 px-3 py-1.5 text-sm text-[var(--neutral-600)] transition-colors hover:border-[var(--pulse-red)]/30 hover:bg-[var(--pulse-red)]/6 hover:text-[var(--pulse-red)]"
                        >
                          <Tag className="h-3.5 w-3.5 text-[var(--pulse-red)]" />
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </SpotlightCard>

                  <div id="blog-written-card" className="blog-sidebar-surface rounded-[1.75rem] p-5">
                    <p id="blog-written-label" className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--pulse-red)]">
                      Written in Pulse
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--neutral-600)]">
                      This post was authored using the Pulse block editor and published from the admin studio.
                    </p>
                    <Link
                      href="/demo"
                      className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[var(--pulse-jasmine)] px-4 py-2.5 text-sm font-semibold text-[var(--pulse-black)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--pulse-red)] hover:!text-white"
                    >
                      Try the editor
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <RelatedPosts currentSlug={entry.slug} currentTags={entry.tags} />
    </div>
  );
}
