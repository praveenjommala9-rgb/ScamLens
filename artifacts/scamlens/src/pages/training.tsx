import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'wouter';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clock3, Mail, MessageCircle, MessageSquareText, ShieldAlert, ShieldCheck, Smartphone, Target, TriangleAlert } from 'lucide-react';
import { getGetDashboardQueryKey, getGetNextScenarioQueryKey, getGetSessionQueryKey, useGetNextScenario, useGetSession, useSubmitAttempt } from '@workspace/api-client-react';
import type { Answer } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';
import { ErrorState, InlineNotice, PageLoading, titleCase } from '@/components/scamlens-ui';

const answerOptions: { value: Answer; title: string; description: string }[] = [
  { value: 'phishing', title: 'Suspicious — likely phishing', description: 'Something about this message feels unsafe.' },
  { value: 'legitimate', title: 'Likely legitimate', description: 'The request and context appear expected.' },
  { value: 'unsure', title: 'I am not sure yet', description: 'I would pause and verify before acting.' },
];
const signalOptions = ['Unexpected urgency', 'Unfamiliar sender', 'Mismatched or unusual address', 'Sensitive information requested', 'Unexpected attachment or link', 'Unusual payment or account request'];
const channelIcon = { email: Mail, sms: Smartphone, chat: MessageCircle, social: MessageSquareText, login: ShieldCheck };

export default function TrainingPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId || '';
  const session = useGetSession(sessionId);
  const next = useGetNextScenario(sessionId);
  const submitAttempt = useSubmitAttempt();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [flags, setFlags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const startedAt = useRef(Date.now());
  const shownScenarioId = useRef<string | null>(null);
  useEffect(() => {
    const nextScenarioId = next.data?.scenario?.id;
    if (nextScenarioId && nextScenarioId !== shownScenarioId.current) {
      shownScenarioId.current = nextScenarioId;
      startedAt.current = Date.now();
      setAnswer(null); setFlags([]); setAdvancing(false);
    }
  }, [next.data?.scenario?.id]);

  const activeSession = next.data?.session || session.data;
  const scenario = next.data?.scenario;
  const assessment = activeSession?.type === 'baseline' || activeSession?.type === 'final';
  const ChannelIcon = scenario ? channelIcon[scenario.channel] : Mail;

  function toggleFlag(flag: string) {
    setFlags((current) => current.includes(flag) ? current.filter((item) => item !== flag) : current.length < 8 ? [...current, flag] : current);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scenario || !answer) return;
    setError('');
    submitAttempt.mutate({
      data: {
        session_id: sessionId,
        scenario_id: scenario.id,
        answer,
        selected_red_flags: flags,
        response_time_ms: Math.min(3_600_000, Math.max(0, Date.now() - startedAt.current)),
      },
    }, {
      onSuccess: (detail) => {
        void queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        if (detail.session.type === 'training') {
          setLocation(`/result/${detail.attempt.id}`);
        } else if (detail.session.status === 'completed') {
          setLocation(`/result/${detail.attempt.id}`);
        } else {
          setAdvancing(true);
          void queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey(sessionId) });
          void queryClient.invalidateQueries({ queryKey: getGetNextScenarioQueryKey(sessionId) });
        }
      },
      onError: (reason) => { setAdvancing(false); setError(reason instanceof Error ? reason.message : 'Your answer could not be saved. Please try again.'); },
    });
  }

  return <AppShell><div className="content max-w-[1060px]">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard" className="btn btn-quiet -ml-3 min-h-9 px-3 text-xs"><ArrowLeft size={14} /> Overview</Link><span className="inline-flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} className="text-emerald-300" /> Safe simulation · No message is sent</span></div>
    {(session.isLoading || next.isLoading) && <PageLoading label="Loading the next safe scenario" />}
    {(session.isError || next.isError) && <ErrorState title="Scenario unavailable" message="This practice item could not be loaded. Your session is still saved." onRetry={() => { void session.refetch(); void next.refetch(); }} />}
    {activeSession && scenario && !advancing && <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><div className="eyebrow"><Target size={14} /> {assessment ? `${titleCase(activeSession.type)} assessment` : 'Adaptive practice'}</div><h1 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">{scenario.title}</h1><p className="mt-2 text-sm text-slate-400">{assessment ? 'Your assessment results and explanations are held until all eight scenarios are complete.' : 'Take a moment to inspect the context before you decide.'}</p></div>
        <div className="min-w-[155px] rounded-xl border border-slate-700/70 bg-[#111e31] px-4 py-3"><div className="flex items-center justify-between gap-5"><span className="text-xs text-slate-400">{activeSession.answered_questions} of {activeSession.total_questions}</span><Clock3 size={14} className="text-slate-500" /></div><div className="progress-track mt-2.5"><div className="progress-fill" style={{ width: `${activeSession.total_questions ? activeSession.answered_questions / activeSession.total_questions * 100 : 0}%` }} /></div></div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <article className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="brand-mark"><ChannelIcon size={17} /></span><div><p className="text-sm font-semibold text-slate-100">{titleCase(scenario.channel)} message</p><p className="text-xs text-slate-500">{titleCase(scenario.category)} · {titleCase(scenario.difficulty)}</p></div></div><span className="pill pill-cyan">Simulation</span></div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="space-y-3 rounded-xl border border-slate-700/60 bg-[#0d192b]/70 p-4 sm:p-5">
              {scenario.sender_name && <div className="grid grid-cols-[68px_1fr] gap-3 text-xs"><span className="text-slate-500">From</span><span className="min-w-0 break-words text-slate-200">{scenario.sender_name}{scenario.sender_address ? <span className="ml-1 text-slate-400">&lt;{scenario.sender_address}&gt;</span> : null}</span></div>}
              {scenario.subject && <div className="grid grid-cols-[68px_1fr] gap-3 border-t border-slate-800/80 pt-3 text-xs"><span className="text-slate-500">Subject</span><span className="min-w-0 break-words font-medium text-slate-200">{scenario.subject}</span></div>}
              <p className="scenario-message border-t border-slate-800/80 pt-4">{scenario.body}</p>
              {scenario.displayed_url && <div className="rounded-lg border border-cyan-300/10 bg-cyan-300/[.035] p-3.5"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Displayed address</span><p className="mt-1.5 select-text break-all font-mono text-xs leading-5 text-cyan-100/80" data-testid="text-simulated-url">{scenario.displayed_url}</p></div>}
            </div>
            <p className="flex items-start gap-2 text-[11px] leading-5 text-slate-500"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-300" /> This is a contained learning simulation. Addresses are displayed as text and are not clickable.</p>
          </div>
        </article>

        <form className="panel p-5 sm:p-6" onSubmit={submit}>
          <div className="eyebrow"><ShieldAlert size={14} /> Make a considered call</div>
          <h2 className="mt-2 text-lg font-semibold text-slate-100">How would you handle this?</h2>
          <fieldset className="mt-4 space-y-2.5">
            <legend className="sr-only">Choose your assessment</legend>
            {answerOptions.map((option) => <button type="button" key={option.value} onClick={() => setAnswer(option.value)} aria-pressed={answer === option.value} className={`choice ${answer === option.value ? 'selected' : ''}`} data-testid={`choice-answer-${option.value}`}><span className="choice-dot" /><span><span className="block text-sm font-semibold text-slate-200">{option.title}</span><span className="mt-1 block text-xs text-slate-500">{option.description}</span></span>{answer === option.value && <Check size={16} className="ml-auto text-cyan-200" />}</button>)}
          </fieldset>
          <div className="mt-5 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-300">What caught your attention?</p><span className="text-[10px] text-slate-500">Optional · {flags.length}/8</span></div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">Select any signals you noticed. Your selection is part of your practice response.</p>
            <div className="mt-3 flex flex-wrap gap-2">{signalOptions.map((flag) => <button type="button" key={flag} aria-pressed={flags.includes(flag)} onClick={() => toggleFlag(flag)} className={`rounded-full border px-2.5 py-1.5 text-[10px] font-medium transition ${flags.includes(flag) ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100' : 'border-slate-700 bg-slate-900/30 text-slate-400 hover:border-slate-500'}`} data-testid={`toggle-signal-${signalOptions.indexOf(flag)}`}>{flags.includes(flag) && <Check size={11} className="mr-1 inline" />}{flag}</button>)}</div>
          </div>
          {assessment && <p className="mt-4 flex items-start gap-2 rounded-lg border border-indigo-300/10 bg-indigo-300/[.045] p-3 text-[11px] leading-5 text-indigo-100/75"><TriangleAlert size={14} className="mt-0.5 shrink-0" /> Assessment mode keeps correctness and coaching hidden until the final response.</p>}
          {!assessment && <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-slate-500"><AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-300" /> After you submit, you will receive one concise coaching note.</p>}
          {error && <div className="mt-4"><InlineNotice>{error}</InlineNotice></div>}
          <button type="submit" className="btn btn-primary mt-5 w-full" disabled={!answer || submitAttempt.isPending} data-testid="button-submit-answer">{submitAttempt.isPending ? 'Saving response…' : assessment ? 'Submit assessment response' : 'Submit and get coaching'} <ArrowRight size={15} /></button>
          {submitAttempt.isPending && <p className="mt-2 text-center text-[10px] text-slate-500">Saving your response securely</p>}
        </form>
      </div>
    </>}
    {advancing && <PageLoading label="Loading the next assessment scenario" />}
    {activeSession && !scenario && !next.isLoading && !advancing && <section className="panel mt-4"><div className="empty-state"><div className="brand-mark mx-auto mb-4"><ShieldCheck size={19} /></div><h2 className="text-xl font-semibold text-slate-100">This session is complete</h2><p className="muted mx-auto mt-2 max-w-md text-sm leading-6">Your practice session has no further scenarios. Return to your overview to review your progress.</p><Link href="/dashboard" className="btn btn-primary mt-5" data-testid="link-session-complete">Back to overview <ArrowRight size={15} /></Link></div></section>}
  </div></AppShell>;
}
