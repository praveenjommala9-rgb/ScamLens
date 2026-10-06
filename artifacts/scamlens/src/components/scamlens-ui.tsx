import type { ReactNode } from 'react';
import { AlertCircle, ArrowRight, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="brand"><span className="brand-mark"><ShieldCheck size={19} strokeWidth={2.2} /></span>{!compact && <span>ScamLens</span>}</span>;
}

export function PageLoading({ label = 'Loading your workspace' }: { label?: string }) {
  return <main className="content" aria-label={label}><div className="skeleton" style={{ height: 20, width: 180, marginBottom: 20 }} /><div className="skeleton" style={{ height: 44, width: '48%', marginBottom: 26 }} /><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="skeleton" style={{ height: 138 }} /><div className="skeleton" style={{ height: 138 }} /><div className="skeleton" style={{ height: 138 }} /></div><div className="skeleton" style={{ height: 250, marginTop: 18 }} /></main>;
}

export function ErrorState({ title = 'We could not load this view', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return <div className="panel empty-state" role="alert"><span className="brand-mark" style={{ margin: '0 auto 16px', color: '#ff9b89' }}><AlertCircle size={19} /></span><h2 className="text-lg font-semibold text-slate-100">{title}</h2><p className="muted text-sm mt-2 max-w-lg mx-auto">{message || 'Something interrupted the request. Your progress is safe; try again in a moment.'}</p>{onRetry && <button className="btn btn-secondary mt-5" onClick={onRetry} data-testid="button-retry"><RefreshCw size={15} /> Try again</button>}</div>;
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><div className="brand-mark mx-auto mb-4" style={{ width: 46, height: 46 }}>{icon || <ShieldCheck size={20} />}</div><h3 className="text-lg font-semibold text-slate-100">{title}</h3><p className="muted text-sm mt-2 max-w-md mx-auto leading-6">{children}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function InlineNotice({ children }: { children: ReactNode }) {
  return <div className="notice flex items-start gap-2.5"><AlertCircle size={16} className="mt-0.5 shrink-0" />{children}</div>;
}

export function ActionLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">{children}<ArrowRight size={15} /></a>;
}

export function BusyButton({ busy, children, ...props }: { busy?: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} disabled={busy || props.disabled} className={`btn btn-primary ${props.className || ''}`}><>{busy ? <LoaderCircle size={16} className="animate-spin" /> : null}{children}</></button>;
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function titleCase(value?: string | null) {
  return value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '—';
}
