import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Brand, BusyButton, InlineNotice } from '@/components/scamlens-ui';
import { useAuth } from '@/lib/auth';

export default function AuthPage() {
  const { client, session, ready } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  useEffect(() => { if (ready && session) setLocation('/dashboard'); }, [ready, session, setLocation]);
  if (ready && session) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setConfirmation(''); setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await client.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() } } });
        if (authError) throw authError;
        if (data.session) setLocation('/dashboard');
        else setConfirmation('Your account is ready. Check your inbox for a confirmation link, then sign in.');
      } else {
        const { error: authError } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        setLocation('/dashboard');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Authentication could not be completed. Please try again.');
    } finally { setBusy(false); }
  }

  return <main className="app-shell min-h-[100dvh] grid lg:grid-cols-[1fr_.9fr]">
    <section className="flex flex-col px-6 py-6 sm:px-10 lg:px-14">
      <div className="flex items-center justify-between"><Link href="/" className="inline-flex"><Brand /></Link><Link href="/" className="btn btn-quiet text-xs"><ArrowLeft size={14} /> Back to home</Link></div>
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-12 rise">
        <div className="eyebrow">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</div>
        <h1 className="mt-4 text-3xl font-semibold text-slate-50">{mode === 'signin' ? 'Continue your practice.' : 'Start building safer instincts.'}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{mode === 'signin' ? 'Your training history and progress are ready when you are.' : 'A private space for realistic, guided awareness practice.'}</p>
        <div className="mt-7 grid grid-cols-2 rounded-xl border border-slate-700/80 bg-[#0d192b] p-1">
          <button className={`rounded-lg py-2.5 text-sm font-semibold ${mode === 'signin' ? 'bg-[#213550] text-slate-100' : 'text-slate-400'}`} onClick={() => { setMode('signin'); setError(''); setConfirmation(''); }} data-testid="tab-signin">Sign in</button>
          <button className={`rounded-lg py-2.5 text-sm font-semibold ${mode === 'signup' ? 'bg-[#213550] text-slate-100' : 'text-slate-400'}`} onClick={() => { setMode('signup'); setError(''); setConfirmation(''); }} data-testid="tab-signup">Create account</button>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === 'signup' && <div><label htmlFor="full-name" className="label">Full name</label><input id="full-name" autoComplete="name" required maxLength={100} className="field" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" data-testid="input-full-name" /></div>}
          <div><label htmlFor="email" className="label">Email address</label><input id="email" type="email" autoComplete="email" required className="field" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" data-testid="input-email" /></div>
          <div><label htmlFor="password" className="label">Password</label><div className="relative"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={8} className="field pr-12" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" data-testid="input-password" /><button type="button" className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-200" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} data-testid="button-toggle-password">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
          {error && <InlineNotice>{error}</InlineNotice>}
          {confirmation && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.08] p-3 text-sm leading-6 text-emerald-200" role="status">{confirmation}</div>}
          <BusyButton type="submit" busy={busy} className="w-full mt-2" data-testid="button-auth-submit">{mode === 'signin' ? 'Sign in securely' : 'Create account'}</BusyButton>
        </form>
        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><LockKeyhole size={14} className="mt-0.5 shrink-0" /> Your account is secured with Supabase authentication. ScamLens never asks for your email password outside this sign-in form.</p>
      </div>
      <p className="text-center text-[11px] text-slate-600">Private practice. Real-world confidence.</p>
    </section>
    <aside className="relative hidden overflow-hidden border-l border-slate-800/80 bg-[#0d192c] p-12 lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(circle at 70% 35%, rgba(47,132,184,.18), transparent 32%), linear-gradient(140deg,transparent 54%,rgba(63,81,178,.09))' }} />
      <div className="relative"><span className="brand-mark mb-8" style={{ width: 48, height: 48 }}><ShieldCheck size={24} /></span><p className="eyebrow">Safer by practice</p><h2 className="mt-5 max-w-lg text-4xl leading-tight font-semibold text-slate-50">A moment of practice can change the moment that matters.</h2><p className="mt-5 max-w-md text-sm leading-7 text-slate-400">Build a habit of pausing, checking the context, and verifying requests through a channel you already trust.</p></div>
      <div className="relative grid grid-cols-2 gap-3">{[['01', 'Assess your baseline'], ['02', 'Practice adaptively'], ['03', 'Review useful signals'], ['04', 'Measure your progress']].map(([n, text]) => <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4" key={n}><span className="font-mono text-xs text-cyan-300">{n}</span><p className="mt-2 text-xs font-medium text-slate-300">{text}</p></div>)}</div>
    </aside>
  </main>;
}
