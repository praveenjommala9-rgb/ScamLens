import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Clock3, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { useListAttempts, type ListAttemptsParams } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';
import { EmptyState, ErrorState, formatDate, PageLoading, titleCase } from '@/components/scamlens-ui';

export default function HistoryPage() {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [category, setCategory] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [channel, setChannel] = useState('');
  const [sessionType, setSessionType] = useState('');
  const params = useMemo<ListAttemptsParams>(() => ({
    ...(query.trim() ? { search: query.trim() } : {}),
    ...(category ? { category } : {}),
    ...(channel ? { channel: channel as ListAttemptsParams['channel'] } : {}),
    ...(sessionType ? { session_type: sessionType as ListAttemptsParams['session_type'] } : {}),
    limit: 100,
  }), [query, category, channel, sessionType]);
  const attempts = useListAttempts(params);
  useEffect(() => {
    if (attempts.data) setCategoryOptions((current) => Array.from(new Set([...current, ...attempts.data.map((attempt) => attempt.category)])).sort());
  }, [attempts.data]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setQuery(draft.trim());
  }
  function reset() { setDraft(''); setQuery(''); setCategory(''); setChannel(''); setSessionType(''); }
  const hasFilters = Boolean(query || category || channel || sessionType);

  return <AppShell><div className="content">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow"><Clock3 size={14} /> Practice record</div><h1 className="mt-3 text-3xl font-semibold text-slate-50 sm:text-[38px]">Your learning history.</h1><p className="mt-2 max-w-xl text-sm text-slate-400">Review completed scenario responses and revisit what you learned.</p></div><span className="pill pill-cyan"><SlidersHorizontal size={12} /> Private to you</span></div>
    <section className="panel mb-5 p-4 sm:p-5">
      <form onSubmit={search} className="flex flex-col gap-3 md:flex-row">
        <label className="relative min-w-0 flex-1"><span className="sr-only">Search scenario title or category</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search title or category" className="field pl-10" maxLength={100} data-testid="input-history-search" /></label>
        <label className="min-w-0 flex-1"><span className="sr-only">Filter by channel</span><select className="field" value={channel} onChange={(event) => setChannel(event.target.value)} data-testid="select-channel-filter"><option value="">All channels</option>{['email', 'sms', 'chat', 'social', 'login'].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
        <label className="min-w-0 flex-1"><span className="sr-only">Filter by category</span><select className="field" value={category} onChange={(event) => setCategory(event.target.value)} data-testid="select-category-filter"><option value="">All categories</option>{categoryOptions.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
        <label className="min-w-0 flex-1"><span className="sr-only">Filter by session type</span><select className="field" value={sessionType} onChange={(event) => setSessionType(event.target.value)} data-testid="select-session-filter"><option value="">All session types</option>{['baseline', 'training', 'final'].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
        <div className="flex gap-2"><button className="btn btn-primary flex-1 md:flex-none" type="submit" data-testid="button-search-history"><Filter size={15} /> Apply filters</button>{hasFilters && <button className="btn btn-secondary" type="button" onClick={reset} data-testid="button-clear-filters">Clear</button>}</div>
      </form>
    </section>
    {attempts.isLoading && <PageLoading label="Loading practice history" />}
    {attempts.isError && <ErrorState title="History could not load" message="Your responses are still safe. Please retry the request." onRetry={() => void attempts.refetch()} />}
    {attempts.data && <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><div><p className="text-sm font-semibold text-slate-100">{attempts.data.length} {attempts.data.length === 1 ? 'response' : 'responses'}</p><p className="mt-1 text-xs text-slate-500">{hasFilters ? 'Matching your selected filters' : 'Most recent responses first'}</p></div><span className="pill pill-cyan">{attempts.data.length} shown</span></div>
      <div className="hidden grid-cols-[minmax(220px,1.7fr)_1fr_1fr_1fr_30px] gap-3 border-t border-slate-700/70 bg-slate-900/30 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid"><span>Scenario</span><span>Channel</span><span>Category</span><span>Session</span><span /></div>
      {attempts.data.length ? attempts.data.map((attempt) => <Link href={`/result/${attempt.id}`} key={attempt.id} className="table-row hover:bg-white/[.018]" data-testid={`row-attempt-${attempt.id}`}><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-200">{attempt.scenario_title}</span><span className="mt-1 block text-[11px] text-slate-500">{formatDate(attempt.created_at)}</span></span><span className="text-xs text-slate-400">{titleCase(attempt.channel)}</span><span className="hide-mobile text-xs text-slate-400">{titleCase(attempt.category)}</span><span className={`pill hide-mobile hidden sm:inline-flex ${attempt.session_type === 'training' ? 'pill-cyan' : 'pill-amber'}`}>{titleCase(attempt.session_type)}</span><ArrowRight size={15} className="text-slate-600" /></Link>) : <EmptyState icon={<Search size={19} />} title={hasFilters ? 'No responses match these filters' : 'Your practice history is waiting'}>{hasFilters ? 'Try a shorter search or clear one of the filters.' : 'When you submit a scenario response, your private practice record will appear here.'}{hasFilters && <button className="btn btn-secondary mt-4" onClick={reset} data-testid="button-empty-clear-filters">Clear filters</button>}</EmptyState>}
    </section>}
  </div></AppShell>;
}
