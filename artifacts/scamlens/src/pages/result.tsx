import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Check, CircleCheck, Lightbulb, MessageSquareText, ShieldAlert, Target, TriangleAlert } from 'lucide-react';
import { useGetAttempt, useUpdateAttempt } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';
import { EmptyState, ErrorState, formatDate, InlineNotice, PageLoading, titleCase } from '@/components/scamlens-ui';

function percent(value: number | null | undefined) { return value == null ? '—' : `${Math.round(value)}%`; }

export default function ResultPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId || '';
  const detail = useGetAttempt(attemptId);
  const update = useUpdateAttempt();
  const [, setLocation] = useLocation();
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);
  const [reflectionError, setReflectionError] = useState('');
  useEffect(() => {
    if (detail.data?.attempt.id === attemptId) setReflection(detail.data.attempt.reflection_note || '');
  }, [detail.data?.attempt.id, attemptId]);
  const isAssessment = detail.data?.session.type === 'baseline' || detail.data?.session.type === 'final';

  function saveReflection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setReflectionError(''); setSaved(false);
    update.mutate({ id: attemptId, data: { reflection_note: reflection.trim() || null } }, {
      onSuccess: () => setSaved(true),
      onError: (reason) => setReflectionError(reason instanceof Error ? reason.message : 'Your note could not be saved.'),
    });
  }

  return <AppShell><div className="content max-w-[990px]">
    <div className="mb-6 flex items-center justify-between gap-3"><Link href="/history" className="btn btn-quiet -ml-3 min-h-9 px-3 text-xs"><ArrowLeft size={14} /> Practice history</Link>{detail.data?.session.type === 'training' && detail.data.session.status === 'in_progress' ? <Link href={`/training/${detail.data.session.id}`} className="btn btn-secondary min-h-9 px-3 text-xs" data-testid="link-continue-after-coaching">Continue practice <ArrowRight size={14} /></Link> : <Link href="/dashboard" className="btn btn-secondary min-h-9 px-3 text-xs" data-testid="link-back-overview">Back to overview <ArrowRight size={14} /></Link>}</div>
    {detail.isLoading && <PageLoading label="Loading scenario review" />}
    {detail.isError && <ErrorState title="Review could not load" message="We could not retrieve this response. It may no longer be available." onRetry={() => void detail.refetch()} />}
    {detail.data && <>
      <header className="mb-6"><div className="eyebrow"><MessageSquareText size={14} /> {isAssessment ? `${titleCase(detail.data.session.type)} assessment` : 'Coaching review'}</div><h1 className="mt-3 text-3xl font-semibold text-slate-50">{detail.data.scenario.title}</h1><p className="mt-2 text-sm text-slate-400">{titleCase(detail.data.scenario.channel)} · {titleCase(detail.data.scenario.category)} · {formatDate(detail.data.attempt.created_at)}</p></header>
      {isAssessment ? <section className="space-y-5">
        {detail.data.assessment ? <div className="panel p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="eyebrow"><CircleCheck size={14} /> Assessment complete</div><h2 className="mt-3 text-2xl font-semibold text-slate-50">Your awareness report</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{detail.data.assessment.explanation}</p></div><div className="min-w-[120px] rounded-xl border border-cyan-300/15 bg-cyan-300/[.055] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{titleCase(detail.data.session.type)} score</p><p className="mt-1 text-3xl font-semibold text-cyan-200" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{percent(detail.data.assessment.final_score)}</p></div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-700/60 bg-slate-900/30 p-4"><p className="text-xs text-slate-500">{detail.data.session.type === 'baseline' ? 'Scenarios completed' : 'Baseline score'}</p><p className="mt-2 text-xl font-semibold text-slate-100">{detail.data.session.type === 'baseline' ? detail.data.assessment.scenarios_completed : percent(detail.data.assessment.baseline_score)}</p></div><div className="rounded-xl border border-slate-700/60 bg-slate-900/30 p-4"><p className="text-xs text-slate-500">{detail.data.session.type === 'baseline' ? 'Strongest category' : 'Change'}</p><p className="mt-2 text-xl font-semibold text-slate-100">{detail.data.session.type === 'baseline' ? titleCase(detail.data.assessment.strongest_category) : detail.data.assessment.improvement == null ? '—' : `${detail.data.assessment.improvement > 0 ? '+' : ''}${detail.data.assessment.improvement} pts`}</p></div><div className="rounded-xl border border-slate-700/60 bg-slate-900/30 p-4"><p className="text-xs text-slate-500">{detail.data.session.type === 'baseline' ? 'Focus category' : 'Scenarios'}</p><p className="mt-2 text-xl font-semibold text-slate-100">{detail.data.session.type === 'baseline' ? titleCase(detail.data.assessment.weakest_category) : detail.data.assessment.scenarios_completed}</p></div></div>
          {detail.data.assessment.category_performance.length > 0 && <div className="mt-6 border-t border-slate-800 pt-5"><h3 className="text-sm font-semibold text-slate-200">Performance by category</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{detail.data.assessment.category_performance.map((category) => <div key={category.category}><div className="mb-2 flex justify-between text-xs"><span className="text-slate-300">{titleCase(category.category)}</span><span className="font-mono text-slate-400">{Math.round(category.accuracy)}% <span className="text-slate-600">· {category.attempts}</span></span></div><div className="chart-bar"><span style={{ width: `${Math.min(100, Math.max(0, category.accuracy))}%` }} /></div></div>)}</div></div>}
          <div className="mt-5 flex flex-wrap gap-2">{detail.data.assessment.strongest_category && <span className="pill pill-green"><Check size={11} /> Strongest: {titleCase(detail.data.assessment.strongest_category)}</span>}{detail.data.assessment.weakest_category && <span className="pill pill-amber"><Target size={11} /> Focus: {titleCase(detail.data.assessment.weakest_category)}</span>}</div>
        </div> : <div className="panel"><EmptyState icon={<ShieldAlert size={20} />} title="Assessment item recorded">Assessment answers and item-level feedback stay private until all eight scenarios are complete. The full report will appear after the final response.</EmptyState></div>}
        <p className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-500"><ShieldAlert size={14} className="mt-0.5 shrink-0" /> To preserve a fair baseline and final comparison, ScamLens does not reveal individual assessment answers or explanations here.</p>
      </section> : <div className="grid items-start gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <article className="panel overflow-hidden">
          <div className="border-b border-slate-700/60 px-5 py-4"><p className="text-sm font-semibold text-slate-100">Your response</p><p className="mt-1 text-xs text-slate-500">Simulation content is displayed for review; addresses are not clickable.</p></div>
          <div className="space-y-3 p-5"><div className="rounded-xl border border-slate-700/60 bg-[#0d192b]/70 p-4">{detail.data.scenario.sender_name && <p className="text-xs text-slate-400">From <span className="ml-2 text-slate-200">{detail.data.scenario.sender_name}{detail.data.scenario.sender_address ? ` <${detail.data.scenario.sender_address}>` : ''}</span></p>}{detail.data.scenario.subject && <p className="mt-2 border-t border-slate-800 pt-2 text-xs text-slate-400">Subject <span className="ml-2 text-slate-200">{detail.data.scenario.subject}</span></p>}<p className="scenario-message mt-3 border-t border-slate-800 pt-3 text-[13px]">{detail.data.scenario.body}</p>{detail.data.scenario.displayed_url && <p className="mt-3 break-all border-t border-slate-800 pt-3 font-mono text-[11px] text-cyan-100/70">{detail.data.scenario.displayed_url}</p>}</div><div className="rounded-xl border border-slate-700/60 bg-slate-900/25 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your assessment</p><p className="mt-2 text-sm font-semibold text-slate-200">{titleCase(detail.data.answer)}</p>{detail.data.selected_red_flags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{detail.data.selected_red_flags.map((flag) => <span className="pill pill-cyan" key={flag}>{flag}</span>)}</div>}</div></div>
        </article>
        <div className="space-y-5">
          {detail.data.grading && <section className="panel p-5 sm:p-6"><div className="flex items-start gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${detail.data.grading.is_correct ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-200'}`}>{detail.data.grading.is_correct ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}</span><div><h2 className="text-lg font-semibold text-slate-100">{detail.data.grading.is_correct ? 'Good call' : 'A useful moment to learn'}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{detail.data.grading.explanation}</p></div></div>
            {detail.data.grading.detected_red_flags.length > 0 && <div className="mt-5 border-t border-slate-800 pt-4"><h3 className="text-xs font-semibold text-emerald-200">Signals you identified</h3><ul className="mt-2 space-y-2">{detail.data.grading.detected_red_flags.map((signal) => <li className="flex items-start gap-2 text-xs leading-5 text-slate-300" key={signal}><Check size={13} className="mt-0.5 shrink-0 text-emerald-300" />{signal}</li>)}</ul></div>}
            {detail.data.grading.missed_signals.length > 0 && <div className="mt-4 border-t border-slate-800 pt-4"><h3 className="text-xs font-semibold text-amber-200">Signals to look for next time</h3><ul className="mt-2 space-y-2">{detail.data.grading.missed_signals.map((signal) => <li className="flex items-start gap-2 text-xs leading-5 text-slate-300" key={signal}><Target size={13} className="mt-0.5 shrink-0 text-amber-200" />{signal}</li>)}</ul></div>}
          </section>}
          {detail.data.feedback ? <section className="panel p-5 sm:p-6"><div className="eyebrow"><Lightbulb size={14} /> Personal coaching</div><p className="mt-3 text-sm leading-6 text-slate-200">{detail.data.feedback.coaching_summary}</p>
            {detail.data.feedback.what_you_did_well.length > 0 && <div className="mt-4"><h3 className="text-xs font-semibold text-emerald-200">What you did well</h3><ul className="mt-2 space-y-2">{detail.data.feedback.what_you_did_well.map((line) => <li className="flex gap-2 text-xs leading-5 text-slate-300" key={line}><Check size={13} className="mt-0.5 shrink-0 text-emerald-300" />{line}</li>)}</ul></div>}
            {detail.data.feedback.missed_signals.length > 0 && <div className="mt-4"><h3 className="text-xs font-semibold text-slate-300">Missed signals</h3><ul className="mt-2 space-y-2">{detail.data.feedback.missed_signals.map((line) => <li className="flex gap-2 text-xs leading-5 text-slate-400" key={line}><Target size={13} className="mt-0.5 shrink-0 text-amber-200" />{line}</li>)}</ul></div>}
            <div className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-300/[.05] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">Keep this rule</p><p className="mt-2 text-sm leading-6 text-slate-200">{detail.data.feedback.next_rule}</p><p className="mt-2 text-[10px] text-slate-500">Focus area · {titleCase(detail.data.feedback.focus_category)}</p></div>
          </section> : detail.data.ai_status === 'unavailable' ? <section className="panel p-5"><p className="text-sm font-semibold text-slate-200">Coaching unavailable</p><p className="mt-2 text-xs leading-5 text-slate-400">No coaching response was returned for this attempt. We will not substitute generic guidance for your result.</p></section> : null}
          {!detail.data.grading && !detail.data.feedback && detail.data.ai_status !== 'unavailable' && <section className="panel"><EmptyState icon={<Lightbulb size={19} />} title="No coaching details available">This response does not include a coaching report.</EmptyState></section>}
        </div>
      </div>}

      <form className="panel mt-5 p-5 sm:p-6" onSubmit={saveReflection}>
        <div className="eyebrow"><MessageSquareText size={14} /> Reflection</div><h2 className="mt-2 text-lg font-semibold text-slate-100">What will you remember?</h2><p className="mt-1 text-xs text-slate-500">A short private note can help make one useful habit stick.</p>
        <textarea className="field mt-4 min-h-[94px] resize-y text-sm leading-6" value={reflection} onChange={(event) => { setReflection(event.target.value); setSaved(false); }} maxLength={1000} placeholder="Add a note for your future self…" data-testid="textarea-reflection" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-[10px] text-slate-600">{reflection.length}/1000</span><div className="flex items-center gap-3">{saved && <span className="text-xs text-emerald-300" role="status">Saved</span>}<button className="btn btn-secondary min-h-9 px-3 text-xs" type="submit" disabled={update.isPending} data-testid="button-save-reflection">{update.isPending ? 'Saving…' : 'Save reflection'}</button></div></div>
        {reflectionError && <div className="mt-3"><InlineNotice>{reflectionError}</InlineNotice></div>}
      </form>
    </>}
  </div></AppShell>;
}
