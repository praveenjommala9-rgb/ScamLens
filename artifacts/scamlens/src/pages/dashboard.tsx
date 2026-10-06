import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Activity, ArrowRight, Award, BookOpenCheck, BrainCircuit, CircleCheck, Clock3, Crosshair, RotateCcw, ShieldCheck, Sparkles, Target, TrendingUp } from 'lucide-react';
import { getGetDashboardQueryKey, useCreateSession, useGetDashboard } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';
import { EmptyState, ErrorState, formatDate, PageLoading, titleCase } from '@/components/scamlens-ui';

function pct(value: number | null | undefined) { return value == null ? '—' : `${Math.round(value)}%`; }

export default function DashboardPage() {
  const dash = useGetDashboard();
  const createSession = useCreateSession();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  function start(type: 'baseline' | 'training' | 'final') {
    createSession.mutate({ data: { type } }, {
      onSuccess: (session) => {
        void queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setLocation(`/training/${session.id}`);
      },
    });
  }

  return <AppShell><div className="content">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><div className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Personal awareness</div><h1 className="mt-3 text-3xl font-semibold text-slate-50 sm:text-[38px]">Your practice, in focus.</h1><p className="mt-2 max-w-xl text-sm text-slate-400">A clear view of what you have learned—and a useful next step.</p></div>
      {dash.data?.active_session && <Link href={`/training/${dash.data.active_session.id}`} className="btn btn-primary" data-testid="link-resume-session"><RotateCcw size={15} /> Resume practice <ArrowRight size={15} /></Link>}
    </div>
    {dash.isLoading && <PageLoading label="Loading your awareness overview" />}
    {dash.isError && <ErrorState title="Your overview could not load" onRetry={() => void dash.refetch()} />}
    {dash.data && <>
      {!dash.data.has_baseline && <section className="panel mb-5 overflow-hidden p-5 sm:p-7">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div><div className="eyebrow"><Crosshair size={14} /> Start with a baseline</div><h2 className="mt-3 text-2xl font-semibold text-slate-50">Find your starting point.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">An eight-scenario assessment gives you a personal reference. You will see your full assessment summary after the last scenario—no answer-by-answer spoilers.</p></div>
          <button className="btn btn-primary" disabled={createSession.isPending} onClick={() => start('baseline')} data-testid="button-start-baseline"><BookOpenCheck size={16} /> {createSession.isPending ? 'Preparing…' : 'Take baseline'} <ArrowRight size={15} /></button>
        </div>
        {createSession.isError && <p role="alert" className="mt-4 text-xs text-rose-300">We could not start that session. Please try again.</p>}
      </section>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="panel metric"><p className="metric-label">Awareness score</p><div className="mt-3 flex items-end justify-between"><p className="metric-value text-slate-50">{pct(dash.data.awareness_score)}</p><ShieldCheck size={18} className="mb-1 text-cyan-300" /></div><p className="mt-2 text-[11px] text-slate-500">{dash.data.has_baseline ? 'Based on completed assessments' : 'Baseline not completed'}</p></article>
        <article className="panel metric"><p className="metric-label">Practice scenarios</p><div className="mt-3 flex items-end justify-between"><p className="metric-value text-slate-50">{dash.data.scenarios_completed}</p><Target size={18} className="mb-1 text-indigo-300" /></div><p className="mt-2 text-[11px] text-slate-500">Responses submitted</p></article>
        <article className="panel metric"><p className="metric-label">Overall accuracy</p><div className="mt-3 flex items-end justify-between"><p className="metric-value text-slate-50">{pct(dash.data.overall_accuracy)}</p><CircleCheck size={18} className="mb-1 text-emerald-300" /></div><p className="mt-2 text-[11px] text-slate-500">{dash.data.total_correct} correct responses</p></article>
        <article className="panel metric"><p className="metric-label">Assessment change</p><div className="mt-3 flex items-end justify-between"><p className="metric-value text-slate-50">{dash.data.improvement == null ? '—' : `${dash.data.improvement > 0 ? '+' : ''}${dash.data.improvement} pts`}</p><TrendingUp size={18} className="mb-1 text-cyan-300" /></div><p className="mt-2 text-[11px] text-slate-500">{dash.data.has_final ? 'Baseline to final' : 'Final assessment not completed'}</p></article>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
        <section className="panel p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><div className="eyebrow"><Activity size={14} /> Skill map</div><h2 className="mt-2 text-lg font-semibold text-slate-100">Category performance</h2></div><span className="rounded-lg bg-slate-800/60 p-2 text-cyan-200"><BrainCircuit size={17} /></span></div>
          {dash.data.category_performance.length ? <div className="mt-6 space-y-5">{dash.data.category_performance.map((item) => <div key={item.category} data-testid={`category-performance-${item.category}`}><div className="mb-2 flex justify-between gap-3 text-xs"><span className="text-slate-300">{titleCase(item.category)}</span><span className="font-mono text-slate-400">{Math.round(item.accuracy)}% <span className="text-slate-600">· {item.attempts}</span></span></div><div className="chart-bar"><span style={{ width: `${Math.min(100, Math.max(0, item.accuracy))}%` }} /></div></div>)}</div> : <EmptyState icon={<Activity size={19} />} title="Your skill map starts here">Category insight appears once you begin responding to scenarios.</EmptyState>}
          {!!dash.data.category_performance.length && <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">{dash.data.strengths.map((skill) => <span className="pill pill-green" key={`strength-${skill}`}><CircleCheck size={11} /> Strength: {titleCase(skill)}</span>)}{dash.data.weak_areas.map((skill) => <span className="pill pill-amber" key={`focus-${skill}`}><Target size={11} /> Focus: {titleCase(skill)}</span>)}</div>}
        </section>

        <section className="panel flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between"><div><div className="eyebrow"><Sparkles size={14} /> Choose a next step</div><h2 className="mt-2 text-lg font-semibold text-slate-100">Keep your instincts sharp.</h2></div></div>
          {dash.data.active_session ? <div className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-300/[.055] p-4"><span className="pill pill-cyan">Session in progress</span><p className="mt-3 text-sm font-semibold text-slate-100">{titleCase(dash.data.active_session.type)} assessment</p><p className="mt-1 text-xs text-slate-400">{dash.data.active_session.answered_questions} of {dash.data.active_session.total_questions} scenarios complete</p><div className="progress-track mt-3"><div className="progress-fill" style={{ width: `${dash.data.active_session.total_questions ? 100 * dash.data.active_session.answered_questions / dash.data.active_session.total_questions : 0}%` }} /></div><Link href={`/training/${dash.data.active_session.id}`} className="btn btn-primary mt-4 w-full" data-testid="link-continue-session">Continue session <ArrowRight size={15} /></Link></div> : <div className="mt-5 flex flex-1 flex-col gap-3">
            <button className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-900/30 p-4 text-left transition hover:border-cyan-300/30" disabled={createSession.isPending} onClick={() => start('training')} data-testid="button-start-training"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200"><BrainCircuit size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-100">Adaptive practice</span><span className="mt-1 block text-xs leading-5 text-slate-400">Focused coaching after every answer.</span></span><ArrowRight size={15} className="text-slate-500" /></button>
            {dash.data.has_baseline && !dash.data.has_final && <button className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-900/30 p-4 text-left transition hover:border-indigo-300/30" disabled={createSession.isPending} onClick={() => start('final')} data-testid="button-start-final"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-300/10 text-indigo-200"><Award size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-100">Final assessment</span><span className="mt-1 block text-xs leading-5 text-slate-400">Eight scenarios to measure progress.</span></span><ArrowRight size={15} className="text-slate-500" /></button>}
            <p className="mt-auto flex items-center gap-2 pt-2 text-[11px] text-slate-500"><Clock3 size={13} /> Practice at your own pace. Your answers stay private.</p>
          </div>}
          {createSession.isError && <p role="alert" className="mt-3 text-xs text-rose-300">Session could not be created. Please try again.</p>}
        </section>
      </div>

      <section className="panel mt-5 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6"><div><div className="eyebrow"><Clock3 size={13} /> Recent activity</div><h2 className="mt-2 text-lg font-semibold text-slate-100">Your latest scenarios</h2></div><Link className="btn btn-secondary min-h-9 px-3 text-xs" href="/history" data-testid="link-all-history">View history <ArrowRight size={14} /></Link></div>
        {dash.data.recent_attempts.length ? <div>{dash.data.recent_attempts.slice(0, 5).map((attempt) => <Link href={`/result/${attempt.id}`} className="table-row hover:bg-white/[.018]" key={attempt.id} data-testid={`row-recent-attempt-${attempt.id}`}><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-200">{attempt.scenario_title}</span><span className="mt-1 block text-[11px] text-slate-500">{titleCase(attempt.category)} · {formatDate(attempt.created_at)}</span></span><span className="text-xs text-slate-400">{titleCase(attempt.channel)}</span><span className="hide-mobile text-xs text-slate-400">{titleCase(attempt.session_type)}</span><span className={`pill hide-mobile hidden sm:inline-flex ${attempt.result_label === 'correct' ? 'pill-green' : attempt.result_label === 'incorrect' ? 'pill-amber' : 'pill-cyan'}`}>{titleCase(attempt.result_label)}</span><ArrowRight size={15} className="text-slate-600" /></Link>)}</div> : <EmptyState icon={<BookOpenCheck size={19} />} title="No scenarios completed yet">After your first response, your recent practice will show here.</EmptyState>}
      </section>
    </>}
  </div></AppShell>;
}
