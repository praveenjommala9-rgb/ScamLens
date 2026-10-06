import { useLocation, Link } from 'wouter';
import { Activity, ArrowDownRight, ArrowRight, BrainCircuit, Check, ChevronRight, CircleCheck, Fingerprint, LockKeyhole, MailWarning, Shield, ShieldCheck, Target, Zap } from 'lucide-react';
import { Brand } from '@/components/scamlens-ui';
import { useAuth } from '@/lib/auth';

const signals = [
  { n: '01', title: 'Context, not trivia', copy: 'Practice with realistic messages that mirror the decisions you make at work and at home.' },
  { n: '02', title: 'A clear reason why', copy: 'Short, specific coaching explains the signal you noticed—and the one worth slowing down for next time.' },
  { n: '03', title: 'Progress you can trust', copy: 'Baseline and final assessments measure change without giving away answers along the way.' },
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const auth = useAuth();
  return <main className="landing-shell">
    <header className="container topbar">
      <Link href="/" className="inline-flex"><Brand /></Link>
      <nav className="flex items-center gap-2" aria-label="Main navigation">
        <Link href="/auth" className="btn btn-quiet hidden sm:inline-flex">Sign in</Link>
        <button className="btn btn-primary" onClick={() => setLocation(auth.session ? '/dashboard' : '/auth')} data-testid="button-get-started">Start learning <ArrowRight size={16} /></button>
      </nav>
    </header>

    <section className="container relative grid min-h-[610px] grid-cols-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
      <div className="relative z-10 max-w-[600px] rise">
        <div className="eyebrow mb-6"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Awareness, built for real life</div>
        <h1 className="max-w-[620px] text-[clamp(3.2rem,7vw,5.8rem)] leading-[.98] font-semibold text-slate-50">Pause. Look closer.<br /><span className="text-cyan-300">Stay safer.</span></h1>
        <p className="mt-7 max-w-[500px] text-[17px] leading-8 text-slate-300">ScamLens turns everyday phishing awareness into a practical skill—with realistic simulations and coaching that gets to the point.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <button className="btn btn-primary min-h-[50px] px-5" onClick={() => setLocation(auth.session ? '/dashboard' : '/auth')} data-testid="button-begin-training">Begin your practice <ArrowRight size={17} /></button>
          <a href="#approach" className="btn btn-secondary min-h-[50px]">How it works <ChevronRight size={16} /></a>
        </div>
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-300" /> Safe, contained simulations</span>
          <span className="inline-flex items-center gap-2"><LockKeyhole size={14} className="text-cyan-300" /> Private by design</span>
        </div>
      </div>
      <div className="relative mx-auto w-full max-w-[490px] rise" style={{ animationDelay: '.12s' }}>
        <div className="absolute -inset-12 rounded-full bg-cyan-500/[.08] blur-3xl" />
        <div className="panel relative overflow-hidden p-5 sm:p-7" style={{ background: 'linear-gradient(145deg,rgba(25,46,75,.92),rgba(13,27,48,.92))' }}>
          <div className="mb-6 flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div className="flex items-center gap-3"><span className="brand-mark"><MailWarning size={18} /></span><div><p className="text-sm font-semibold text-slate-100">Message review</p><p className="text-xs text-slate-400">Practice scenario · Email</p></div></div>
            <span className="pill pill-amber">Take a closer look</span>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-[#0d192b]/80 p-4 sm:p-5">
            <div className="flex justify-between gap-3 text-xs"><span className="text-slate-400">From</span><span className="text-right text-slate-200">Account Support &lt;notice@account-review.help&gt;</span></div>
            <div className="mt-3 flex justify-between gap-3 border-t border-slate-800 pt-3 text-xs"><span className="text-slate-400">Subject</span><span className="text-right text-slate-200">Action needed: review your recent activity</span></div>
            <p className="scenario-message mt-5 text-[13px]">We noticed a sign-in from a new device. To keep your account available, review this activity before the end of today.</p>
            <div className="mt-4 rounded-lg border border-cyan-300/10 bg-cyan-300/[.04] p-3 text-xs text-cyan-100/80"><span className="text-slate-500">Displayed address</span><p className="mt-1 font-mono break-all">secure-account-check.example.invalid</p></div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400">What would you do next?</span>
            <span className="flex gap-2"><span className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">Report message</span><span className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">Check independently</span></span>
          </div>
          <div className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Fingerprint size={16} /></div>
        </div>
        <div className="panel absolute -bottom-8 -left-5 hidden items-center gap-3 p-3.5 sm:flex"><span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-400/10 text-indigo-200"><BrainCircuit size={17} /></span><div><p className="text-xs font-semibold text-slate-200">A useful rule, not a scorecard</p><p className="mt-1 text-[10px] text-slate-400">One concise coaching point at a time</p></div></div>
      </div>
      <a href="#approach" className="absolute bottom-5 left-0 hidden items-center gap-2 text-xs text-slate-500 lg:flex"><ArrowDownRight size={15} /> Scroll to explore</a>
    </section>

    <section className="border-y border-slate-800/80 bg-[#0d182a]/65 py-7">
      <div className="container flex flex-wrap items-center justify-center gap-x-9 gap-y-4 text-xs text-slate-400 sm:justify-between">
        <span className="font-semibold uppercase tracking-[.12em] text-slate-500">Awareness through practice</span>
        <span className="flex items-center gap-2"><CircleCheck size={15} className="text-cyan-300" /> Learn to spot the pressure</span>
        <span className="flex items-center gap-2"><Target size={15} className="text-indigo-300" /> Build a repeatable check</span>
        <span className="flex items-center gap-2"><Activity size={15} className="text-emerald-300" /> See your progress</span>
      </div>
    </section>

    <section id="approach" className="container py-24 sm:py-32">
      <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
        <div><div className="eyebrow">A practical learning loop</div><h2 className="mt-5 max-w-md text-4xl leading-tight font-semibold text-slate-50 sm:text-5xl">Better instincts come from better practice.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">Not another awareness quiz. A focused way to rehearse the moment before you click, reply, or share.</p></div>
        <div className="divide-y divide-slate-800/80 border-y border-slate-800/80">
          {signals.map((item) => <article className="grid gap-3 py-6 sm:grid-cols-[54px_1fr]" key={item.n}><span className="font-mono text-xs text-cyan-300">{item.n}</span><div><h3 className="text-lg font-semibold text-slate-100">{item.title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{item.copy}</p></div></article>)}
        </div>
      </div>
    </section>

    <section className="container pb-24">
      <div className="panel relative overflow-hidden p-7 sm:p-10 lg:p-12">
        <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full bg-indigo-500/[.08] blur-3xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div><div className="eyebrow"><Zap size={13} /> Start with a baseline</div><h2 className="mt-4 max-w-2xl text-3xl leading-tight font-semibold text-slate-50 sm:text-4xl">Know where you are. Build from there.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">A short, eight-scenario assessment gives you a starting point. Then adaptive practice helps you sharpen the skills that matter.</p></div>
          <button className="btn btn-primary shrink-0" onClick={() => setLocation(auth.session ? '/dashboard' : '/auth')} data-testid="button-start-baseline">Get started <ArrowRight size={16} /></button>
        </div>
      </div>
    </section>
    <footer className="border-t border-slate-800/80 py-7"><div className="container flex flex-wrap justify-between gap-4 text-xs text-slate-500"><Brand /><span>Thoughtful practice. Safer decisions.</span><span>© ScamLens</span></div></footer>
  </main>;
}
