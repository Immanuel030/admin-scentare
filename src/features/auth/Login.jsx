import { useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Brand from "../../components/Brand.jsx";
import { loginAdmin } from "./authApi.js";
function Login({ onLogin }) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <main className="grid min-h-screen bg-[#0b0b0c] lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img
          className="absolute inset-0 size-full object-cover opacity-65"
          src="https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1800&q=90"
          alt="Perfume bottle in warm light"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/15 to-black/25" />
        <div className="absolute left-14 top-12">
          <Brand />
        </div>
        <div className="absolute bottom-14 left-14">
          <p className="mb-4 text-[10px] uppercase tracking-[.28em] text-[#d4b36b]">
            The art of scent, thoughtfully made
          </p>
          <h1 className="font-serif text-5xl leading-[1.12] text-[#f4f0e8]">
            Every fragrance
            <br />
            has a story.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
            A considered view of the details that make Scentare unforgettable.
          </p>
          <div className="mt-9 h-px w-10 bg-[#c09b50]" />
        </div>
      </section>
      <section className="flex min-h-screen flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="mx-auto w-full max-w-[390px] py-14 lg:py-0">
          <div className="mb-11 hidden lg:block">
            <Brand />
          </div>
          <p className="mb-3 text-[10px] uppercase tracking-[.25em] text-[#b9954d]">
            Welcome back
          </p>
          <h2 className="font-serif text-[38px] leading-tight text-[#f0ece5]">
            Good to see you.
          </h2>
          <p className="mt-3 text-sm text-[#827f79]">
            Sign in to your Scentare admin account.
          </p>
          <form
            className="mt-9 space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              setSubmitting(true);
              try {
                onLogin(await loginAdmin(email, password));
              } catch (loginError) {
                const message = loginError instanceof TypeError || loginError instanceof SyntaxError
                  ? "Could not reach the sign-in service. Restart with npm run dev and make sure MySQL is running."
                  : loginError.message;
                setError(message || "Could not reach the sign-in service.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <label className="block text-xs text-[#c7c1b7]">
              Email address
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@scentare.com"
                className="mt-2.5 h-12 w-full rounded border border-white/10 bg-[#111113] px-4 text-sm outline-none placeholder:text-[#575550] focus:border-[#aa8848]"
              />
            </label>
            <label className="block text-xs text-[#c7c1b7]">
              Password
              <span className="relative mt-2.5 block">
                <input
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={visible ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded border border-white/10 bg-[#111113] px-4 pr-12 text-sm outline-none placeholder:text-[#575550] focus:border-[#aa8848]"
                />
                <button
                  type="button"
                  onClick={() => setVisible((value) => !value)}
                  aria-label={visible ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 text-[#77736d]"
                >
                  {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[#a29d94]">
                <input type="checkbox" className="size-3.5 accent-[#ba964f]" />{" "}
                Remember me
              </label>
              <button type="button" className="text-[#c1a15f]">
                Forgot password?
              </button>
            </div>
            {error && <p role="alert" className="text-xs text-[#e18b7e]">{error}</p>}
            <button disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded bg-[#b99a58] text-xs font-semibold text-[#17140e] transition hover:bg-[#cfb273] disabled:cursor-wait disabled:opacity-60">
              {submitting ? "Signing in…" : "Sign in"} <ArrowRight size={15} />
            </button>
          </form>
          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-[#68655f]">
            <ShieldCheck size={14} className="text-[#a48a55]" /> Secure access
            for Scentare team members
          </div>
        </div>
        <p className="text-center text-[10px] text-[#5d5a55] lg:text-left">
          © 2025 Scentare. All rights reserved.
        </p>
      </section>
    </main>
  );
}

export default Login;
