import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Eye,
  EyeOff,
  Command,
  LockKeyhole,
  ShieldCheck,
  BookOpen,
  Activity,
  Wallet,
  LoaderCircle,
} from "lucide-react";
import { client, loadCloud, verifiedAdmin } from "./cloud-client.mjs";
export default function Login({ onReady }) {
  const [busy, setBusy] = useState("restoring"),
    [error, setError] = useState(""),
    [show, setShow] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await verifiedAdmin();
        if (user) {
          const cloud = await loadCloud();
          if (alive) onReady({ ...cloud, role: "admin", user });
        } else if (sessionStorage.getItem("rick-os2-guest") === "1") {
          const cloud = await loadCloud();
          if (alive) onReady({ ...cloud, role: "guest", user: null });
        }
      } catch {
      } finally {
        if (alive) setBusy("");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  async function enter(e, guest = false) {
    e?.preventDefault();
    setBusy(guest ? "guest" : "admin");
    setError("");
    try {
      let user = null;
      if (!guest) {
        const form = new FormData(e.currentTarget);
        const { error } = await client.auth.signInWithPassword({
          email: form.get("email"),
          password: form.get("password"),
        });
        if (error)
          throw Error("E-mail ou senha incorretos. Confira e tente novamente.");
        user = await verifiedAdmin();
        if (!user) {
          await client.auth.signOut();
          throw Error("Esta conta não tem acesso de administrador.");
        }
      } else await client.auth.signOut();
      const cloud = await loadCloud();
      if (guest) sessionStorage.setItem("rick-os2-guest", "1");
      else sessionStorage.removeItem("rick-os2-guest");
      onReady({ ...cloud, role: guest ? "guest" : "admin", user });
    } catch (err) {
      setError(err.message);
      setBusy("");
    }
  }
  return (
    <div className="login-page">
      <div className="login-glow" />
      <header className="login-header">
        <a href="/" className="login-brand">
          <span>
            <Command size={24} />
          </span>
          rick
          <span className="wordmark-os">
            os<span className="version-pill">2.0</span>
          </span>
        </a>
        <span className="login-topnote">
          <span className="live-dot" /> SEU UNIVERSO, EM EVOLUÇÃO
        </span>
      </header>
      <main className="login-layout">
        <section className="login-story">
          <div className="login-kicker">
            <span /> UM NOVO CAPÍTULO DO SEU OS
          </div>
          <h1>
            Sua vida.
            <br />
            Seu ritmo.
            <br />
            <em>Seu próximo nível.</em>
          </h1>
          <p>
            Conhecimento, movimento e conquistas.
            <br />
            Um espaço que acompanha quem você está se tornando.
          </p>
          <div className="login-feature-line">
            <div>
              <BookOpen size={18} />
              <span>Aprenda algo novo</span>
            </div>
            <div>
              <Activity size={18} />
              <span>Supere seus limites</span>
            </div>
            <div>
              <Wallet size={18} />
              <span>Conquiste seus planos</span>
            </div>
          </div>
          <div className="login-orbit" aria-hidden="true">
            <span className="orbit-line orbit-line-one" />
            <span className="orbit-line orbit-line-two" />
            <div className="orbit-center">
              <Command size={60} />
            </div>
            <span className="orbit-chip chip-study">
              <BookOpen size={16} /> STUDY
            </span>
            <span className="orbit-chip chip-fit">
              <Activity size={16} /> FIT
            </span>
            <span className="orbit-chip chip-finance">
              <Wallet size={16} /> FINANCE
            </span>
            <span className="orbital-dot" />
          </div>
          <div className="login-story-footer">
            <span>
              CONSTRUÍDO POR <b>rick_dev</b>
            </span>
            <span>
              SEMPRE EM CONSTRUÇÃO <ArrowUpRight size={12} />
            </span>
          </div>
        </section>
        <section className="login-card">
          <div className="login-card-icon">
            <LockKeyhole size={23} />
          </div>
          <span className="login-card-kicker">BEM-VINDO DE VOLTA</span>
          <h2>
            Entre no seu universo<span>.</span>
          </h2>
          <p>Seus projetos, suas listas e seus próximos passos estão aqui.</p>
          <form onSubmit={enter}>
            <label>
              E-mail
              <input
                type="email"
                name="email"
                placeholder="Seu e-mail de acesso"
                autoComplete="username"
                required
                disabled={!!busy}
              />
            </label>
            <label>
              Senha
              <div className="password-field">
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  required
                  disabled={!!busy}
                />
                <button
                  type="button"
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="login-submit" disabled={!!busy}>
              {busy === "admin" || busy === "restoring" ? (
                <>
                  <LoaderCircle size={17} className="spinner" />{" "}
                  {busy === "restoring"
                    ? "Verificando sessão..."
                    : "Abrindo seu universo..."}
                </>
              ) : (
                <>
                  Entrar no meu OS <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <div className="login-or-divider">
            <span />
            OU EXPLORE PRIMEIRO
            <span />
          </div>
          <button
            className="guest-entry"
            onClick={() => enter(null, true)}
            disabled={!!busy}
          >
            {busy === "guest" ? (
              <>
                <LoaderCircle size={17} className="spinner" /> Carregando
                listas...
              </>
            ) : (
              <>
                Conhecer como convidado <ArrowUpRight size={17} />
              </>
            )}
          </button>
          <div className="login-security">
            <ShieldCheck size={16} />
            <span>Acesso protegido. Seus dados continuam com você.</span>
          </div>
        </section>
      </main>
      <footer className="login-footer">
        <span>RICK_DEV OS / 2.0</span>
        <span>Menos ruído. Mais espaço para evoluir.</span>
      </footer>
    </div>
  );
}
