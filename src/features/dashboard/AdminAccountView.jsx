import { useEffect, useState } from "react";
import { KeyRound, UserRound } from "lucide-react";
import { requestJson } from "../../lib/api.js";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}
const inputClass = "mt-1.5 h-10 w-full rounded-md border border-white/10 bg-[#0e0e10] px-3 text-sm text-[#eeeae3] outline-none placeholder:text-[#69655f] focus:border-[#c9a954]/60";

export default function AdminAccountView({ onUserUpdated }) {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "", confirm_password: "" });

  useEffect(() => {
    let active = true;
    requestJson("admin_account.php").then((result) => {
      if (active) { setProfile({ name: result.user?.name || "", email: result.user?.email || "", phone: result.user?.phone || "" }); setPermissions(result.permissions || []); }
    }).catch((loadError) => { if (active) setError(loadError.message || "Could not load admin account."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function submit(action, payload) {
    setBusy(true); setError(""); setNotice("");
    try {
      const headers = await csrfHeaders();
      const result = await requestJson("admin_account.php", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ action, ...payload }) });
      setNotice(result.message || "Account updated.");
      if (action === "profile") onUserUpdated?.(result.user);
      else setPasswords({ current_password: "", new_password: "", confirm_password: "" });
    } catch (submitError) { setError(submitError.message || "Could not update account."); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9"><div className="mb-5"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">System</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Admin Account</h1><p className="mt-2 text-[13px] text-[#a09b93]">Manage your profile, password, and access permissions.</p></div>{error && <div role="alert" className="mb-4 rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]">{error}</div>}{notice && <div role="status" className="mb-4 rounded-md border border-[#42734a]/30 bg-[#42734a]/10 px-4 py-3 text-sm text-[#83bd8b]">{notice}</div>}<div className="grid gap-4 xl:grid-cols-2"><section className="rounded-xl border border-white/[.06] bg-[#131315] p-4 sm:p-5"><h2 className="mb-4 font-serif text-base text-[#e8e4dc]">Profile</h2><div className="mb-5 flex items-center gap-3"><span className="grid size-12 place-items-center rounded-full bg-[#28241c] text-sm font-semibold text-[#d0ad5e]">{(profile.name || "A").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div><p className="text-sm font-medium text-[#ded9d0]">{profile.name || "Admin"}</p><p className="text-xs text-[#77736d]">Administrator</p></div></div><form onSubmit={(e) => { e.preventDefault(); void submit("profile", profile); }} className="space-y-3.5"><label className="block text-xs text-[#aaa69f]">Full name<input className={inputClass} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} maxLength={255} required disabled={loading} /></label><label className="block text-xs text-[#aaa69f]">Email address<input className={inputClass} type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} maxLength={255} required disabled={loading} /></label><label className="block text-xs text-[#aaa69f]">Phone number<input className={inputClass} type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} maxLength={255} disabled={loading} /></label><label className="block text-xs text-[#aaa69f]">Role<input className={`${inputClass} text-[#88837b]`} value="Administrator" readOnly /></label><button disabled={busy || loading} className="h-10 rounded-md bg-[#c9a954] px-4 text-xs font-semibold text-[#17140e] disabled:opacity-50"><UserRound size={13} className="mr-1.5 inline" />{busy ? "Saving…" : "Save profile"}</button></form></section><div className="space-y-4"><section className="rounded-xl border border-white/[.06] bg-[#131315] p-4 sm:p-5"><h2 className="mb-4 flex items-center gap-2 font-serif text-base text-[#e8e4dc]"><KeyRound size={15} className="text-[#c9a954]" />Password</h2><form onSubmit={(e) => { e.preventDefault(); void submit("password", passwords); }} className="space-y-3"><label className="block text-xs text-[#aaa69f]">Current password<input className={inputClass} type="password" autoComplete="current-password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} required /></label><label className="block text-xs text-[#aaa69f]">New password<input className={inputClass} type="password" autoComplete="new-password" minLength={8} value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} required /></label><label className="block text-xs text-[#aaa69f]">Confirm new password<input className={inputClass} type="password" autoComplete="new-password" minLength={8} value={passwords.confirm_password} onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })} required /></label><button disabled={busy} className="h-10 rounded-md bg-[#c9a954] px-4 text-xs font-semibold text-[#17140e] disabled:opacity-50">{busy ? "Updating…" : "Update password"}</button></form></section><section className="rounded-xl border border-white/[.06] bg-[#131315] p-4 sm:p-5"><h2 className="mb-1 font-serif text-base text-[#e8e4dc]">Access permissions</h2><p className="mb-3 text-[10px] text-[#77736d]">Permissions follow the administrator role and cannot be changed per account.</p><div className="divide-y divide-white/[.05]">{permissions.map((permission) => <div key={permission.name} className="flex items-center justify-between gap-3 py-2.5 text-xs"><span className="text-[#c9c4bb]">{permission.name}</span><span className="rounded-full bg-[#42734a]/20 px-2.5 py-1 text-[10px] text-[#83bd8b]">{permission.access}</span></div>)}</div></section></div></div></main>;
}
