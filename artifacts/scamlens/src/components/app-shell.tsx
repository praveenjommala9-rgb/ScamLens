import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronDown, Clock3, LayoutDashboard, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useGetMe, useUpdateMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Brand, PageLoading, ErrorState } from '@/components/scamlens-ui';

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut, session } = useAuth();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const me = useGetMe();
  const updateMe = useUpdateMe();
  const queryClient = useQueryClient();
  const active = (path: string) => location === path;
  if (me.isLoading) return <div className="app-shell"><PageLoading label="Loading profile" /></div>;
  if (me.isError || !me.data) return <div className="app-shell"><div className="content"><ErrorState title="Profile unavailable" message="We could not verify your ScamLens profile." onRetry={() => void me.refetch()} /></div></div>;
  const profile = me.data;
  const initials = profile.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || session?.user.email?.slice(0, 1).toUpperCase() || 'S';
  const links = [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }, { href: '/history', label: 'Practice history', icon: Clock3 }];
  async function logout() { await signOut(); setLocation('/'); }
  return <div className="app-shell min-h-[100dvh]">
    <header className="app-nav">
      <div className="nav-inner">
        <div className="flex items-center gap-8"><Link href="/dashboard" className="inline-flex"><Brand /></Link><nav className="nav-links desktop-nav" aria-label="Workspace">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${active(href) ? 'active' : ''}`}><Icon size={16} />{label}</Link>)}</nav></div>
        <div className="relative flex items-center gap-2">
          <button className="hidden items-center gap-2 rounded-xl border border-slate-700/70 bg-[#111e31] p-1.5 pr-3 text-left sm:flex" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} data-testid="button-user-menu"><span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300/10 text-xs font-bold text-cyan-200">{initials}</span><span className="max-w-[138px]"><span className="block truncate text-xs font-semibold text-slate-200">{profile.full_name}</span><span className="block text-[10px] text-slate-500">{session?.user.email}</span></span><ChevronDown size={14} className="text-slate-500" /></button>
          <button className="mobile-menu btn btn-secondary min-h-10 px-3" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} data-testid="button-mobile-menu">{mobileOpen ? <X size={17} /> : <Menu size={17} />}</button>
          {menuOpen && <div className="absolute right-0 top-12 z-30 w-64 rounded-xl border border-slate-700 bg-[#111e31] p-3 shadow-2xl">
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Signed in as</p><p className="truncate px-2 text-sm font-semibold text-slate-100">{profile.full_name}</p><p className="truncate px-2 pt-1 text-xs text-slate-400">{session?.user.email}</p>
            <div className="my-3 border-t border-slate-700/70" />
            <label className="label px-2">Name</label><form className="flex gap-2 px-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get('name') || '').trim(); if (name) updateMe.mutate({ data: { full_name: name } }, { onSuccess: (updated) => { queryClient.setQueryData(getGetMeQueryKey(), updated); setMenuOpen(false); } }); }}><input name="name" aria-label="Profile name" defaultValue={profile.full_name} maxLength={100} required className="field min-w-0 px-2 py-2 text-xs" data-testid="input-profile-name" /><button className="btn btn-secondary min-h-9 px-2 text-xs" type="submit" disabled={updateMe.isPending} data-testid="button-save-profile">{updateMe.isPending ? 'Saving' : 'Save'}</button></form>
            {updateMe.isError && <p className="px-2 pt-2 text-[11px] text-rose-300" role="alert">Profile name could not be saved. Try again.</p>}
            <button className="btn btn-quiet mt-2 w-full justify-start text-xs" onClick={() => void logout()} data-testid="button-logout"><LogOut size={15} /> Sign out</button>
          </div>}
        </div>
      </div>
      {mobileOpen && <nav className="absolute left-0 right-0 top-[71px] z-20 border-b border-slate-700 bg-[#0c1728] px-4 py-3 shadow-xl md:hidden">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-link ${active(href) ? 'active' : ''}`}><Icon size={16} />{label}</Link>)}<div className="mt-2 border-t border-slate-800 px-3 pt-3"><p className="text-xs font-semibold text-slate-200">{profile.full_name}</p><p className="mt-1 truncate text-[11px] text-slate-500">{session?.user.email}</p><button className="btn btn-quiet mt-2 px-0 text-xs" onClick={() => void logout()} data-testid="button-mobile-logout"><LogOut size={14} /> Sign out</button></div></nav>}
    </header>
    <main>{children}</main>
    <footer className="border-t border-slate-800/70 py-5"><div className="mx-auto flex w-[min(1150px,calc(100% - 56px))] items-center justify-between text-[11px] text-slate-600"><span className="inline-flex items-center gap-2"><ShieldCheck size={13} /> Safe practice environment</span><span>ScamLens awareness training</span></div></footer>
  </div>;
}
