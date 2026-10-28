import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  Wallet,
  Settings,
  FlaskConical,
  ArrowUpRight,
  Plus,
  ArrowRight,
  Check,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Terminal,
  Command,
  Search,
  X,
  Download,
  Upload,
  Trash2,
  Menu,
  Volume2,
  ExternalLink,
  Target,
  Zap,
  CheckCheck,
} from "lucide-react";
import { balance, addTransaction, validateBackup, createId } from "./data.mjs";
import "./style.css";
import Finance from "./Finance.jsx";
import Fit from "./Fit.jsx";
import StudyExtras, { Missions } from "./Study.jsx";
import Lab from "./Lab.jsx";
import HomeExtras from "./Home.jsx";
import SystemExtras from "./System.jsx";
import useCloudSync from "./useCloudSync.jsx";
import Music from "./Music.jsx";
import FocusTimer from "./Timer.jsx";
import {
  initialData,
  normalizeData,
  shoppingSummary,
  saveFile,
  today,
} from "./models.mjs";
import { awardCare } from "./dashboard.mjs";
import { parseBackup } from "./legacy.mjs";
import {
  loadWorkspace,
  persistWorkspace,
  restoreWorkspace,
} from "./persistence.mjs";
import { ReadOnlyContext } from "./components.jsx";
import { recoverPrivateFields } from "./outbox.mjs";
const modules = [
  {
    id: "home",
    label: "RICK_HOME",
    name: "Central de comando",
    icon: LayoutDashboard,
    color: "#b6f36b",
    desc: "Tudo no seu radar.",
  },
  {
    id: "study",
    label: "RICK_STUDY",
    name: "Conhecimento em construção",
    icon: BookOpen,
    color: "#a8a0ff",
    desc: "Uma missão de cada vez. Um passo mais longe.",
  },
  {
    id: "fit",
    label: "RICK_FIT",
    name: "Corpo em movimento",
    icon: Dumbbell,
    color: "#ffae79",
    desc: "Sua próxima versão começa com constância.",
  },
  {
    id: "finance",
    label: "RICK_FINANCE",
    name: "Controle da sua órbita",
    icon: Wallet,
    color: "#74c8ff",
    desc: "Planeje suas conquistas. Setup, estilo e o próximo passo.",
  },
  {
    id: "lab",
    label: "RICK_LAB",
    name: "Laboratório de ideias",
    icon: FlaskConical,
    color: "#e695d3",
    desc: "Experimente. Anote. Construa.",
  },
  {
    id: "system",
    label: "RICK_SYSTEM",
    name: "Painel do sistema",
    icon: Settings,
    color: "#b5bbb5",
    desc: "Seu espaço, do seu jeito.",
  },
];
const initial = initialData;
const money = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default function App({ session, onSignOut }) {
  const [boot, setBoot] = useState(() => {
    try {
      return loadWorkspace(localStorage.getItem("rick-os-v2"));
    } catch (err) {
      return {
        data: initial,
        recoveryRaw: " ",
        error: "Armazenamento indisponível.",
      };
    }
  });
  const [data, setRawData] = useState(() => ({
    ...session.data,
    snippets: session.role === "admin" ? boot.data.snippets : [],
    notes: session.role === "admin" ? boot.data.notes : "",
    transactions: session.role === "admin" ? boot.data.transactions : [],
    workouts: session.role === "admin" ? boot.data.workouts : [],
  }));
  const [page, setPage] = useState("home"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [seconds, setSeconds] = useState(session.data.focusSeconds || 1500),
    [running, setRunning] = useState(false),
    [duration, setDuration] = useState(
      (session.data.focusSeconds || 1500) / 60,
    ),
    [query, setQuery] = useState(""),
    [sidebar, setSidebar] = useState(false),
    [storageError, setStorageError] = useState(false);
  const fileRef = useRef();
  const [role, setRole] = useState(session.role),
    [accessOpen, setAccessOpen] = useState(false),
    [collapsed, setCollapsed] = useState(() => {
      try {
        return localStorage.getItem("rick-os-sidebar") === "1";
      } catch {
        return false;
      }
    });
  function setData(value, force = false) {
    if (role === "guest" && !force) {
      setToast("Modo convidado: apenas leitura.");
      return false;
    }
    if (cloud?.error && !force) {
      setToast("Confira o erro de sincronização antes de continuar editando.");
      return false;
    }
    if (cloud?.recovery && !force) {
      setToast(
        "Há um rascunho anterior preservado. Confira o aviso antes de editar.",
      );
      return false;
    }
    if (boot.recoveryRaw && !force) {
      setToast("Recupere ou exporte os dados preservados antes de editar.");
      return false;
    }
    try {
      const next = normalizeData(
        typeof value === "function" ? value(data) : value,
      );
      setRawData(next);
      return true;
    } catch (err) {
      setToast(err.message);
      return false;
    }
  }
  useEffect(() => {
    try {
      localStorage.setItem("rick-os-sidebar", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);
  const cloud = useCloudSync(data, session, setRawData);
  const active = modules.find((m) => m.id === page);
  const notify = (t) => setToast(t);
  const go = (id) => {
    setPage(id);
    setSidebar(false);
    setQuery("");
  };
  useEffect(() => {
    if (role === "guest") return;
    try {
      persistWorkspace(localStorage, data, boot.recoveryRaw, role);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [data, role, boot.recoveryRaw]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const t = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - last) / 1000);
      if (diff) {
        last += diff * 1000;
        setSeconds((s) => Math.max(0, s - diff));
      }
    }, 250);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      if (role === "admin")
        setData((d) => ({ ...d, focusCount: d.focusCount + 1 }));
      notify("Sessão concluída. Hora de respirar!");
    }
  }, [seconds, running]);
  const tasks = data.tasks.filter((t) =>
    page === "study" ? t.module === "study" : true,
  );
  const completed = data.tasks.filter((t) => t.done).length;
  function toggleTask(id) {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }
  function download() {
    if (role === "admin") {
      setData((d) => ({
        ...d,
        systemProgress: awardCare(d.systemProgress, "backupDays", today()),
      }));
      try {
        const history = JSON.parse(
          localStorage.getItem("rick-os-export-history") || "[]",
        );
        localStorage.setItem(
          "rick-os-export-history",
          JSON.stringify(
            [
              {
                date: new Date().toISOString(),
                label: "Backup completo do React 2.0",
              },
              ...history,
            ].slice(0, 20),
          ),
        );
      } catch {}
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "rick-dev-os-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    notify("Backup exportado. Guarde em um lugar seguro.");
  }
  async function restore(e) {
    if (role === "guest") {
      notify("Modo convidado: apenas leitura.");
      return;
    }
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5000000) throw Error("O backup excede o limite de 5 MB.");
      const d = await parseBackup(JSON.parse(await file.text()));
      setModal({ type: "restore", data: d });
    } catch (err) {
      notify(err.message || "Arquivo de backup inválido.");
    }
    e.target.value = "";
  }
  function submit(e) {
    e.preventDefault();
    if (role === "guest") {
      notify("Entre como ADM para editar.");
      return;
    }
    const f = new FormData(e.target);
    try {
      if (modal.type === "transaction") {
        const transactions = addTransaction(data.transactions, {
          title: f.get("title"),
          amount: Number(f.get("amount")),
          type: f.get("type"),
        });
        setData((d) => ({ ...d, transactions }));
      } else {
        const title = f.get("title").trim();
        if (!title) return;
        if (modal.type === "workout")
          setData((d) => ({
            ...d,
            workouts: [...d.workouts, { id: createId(), title, done: false }],
          }));
        else
          setData((d) => ({
            ...d,
            tasks: [
              ...d.tasks,
              {
                id: createId(),
                title,
                done: false,
                module: f.get("module") || "study",
                description: f.get("description") || "",
                progress: Number(f.get("progress") || 0),
                tag: f.get("tag") || "Pessoal",
              },
            ],
          }));
      }
      setModal(null);
      notify("Salvo no seu universo.");
    } catch (err) {
      notify(err.message);
    }
  }
  return (
    <ReadOnlyContext.Provider value={role === "guest"}>
      <div
        className={"app " + (collapsed ? "sidebar-collapsed" : "")}
        style={{ "--accent": active.color }}
      >
        <aside className={sidebar ? "open" : ""}>
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              go("home");
            }}
          >
            <div className="brand-icon">
              <Command size={25} />
            </div>
            <div>
              RICK<span>_DEV</span>
              <small>PERSONAL OPERATING SYSTEM</small>
            </div>
            <span className="version">2.0</span>
          </a>
          <div className="workspace">
            <span className="live-dot" /> UNIVERSO PESSOAL{" "}
            <button
              className="icon collapse-button"
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu size={14} />
            </button>
          </div>
          <small className="nav-label">SEU ECOSSISTEMA</small>
          <nav>
            {modules.map((m) => (
              <button
                key={m.id}
                onClick={() => go(m.id)}
                className={page === m.id ? "active" : ""}
                style={{ "--module": m.color }}
              >
                <m.icon size={18} />
                <span>
                  {
                    {
                      home: "Visão geral",
                      study: "Estudos",
                      fit: "Corpo & corrida",
                      finance: "Minhas conquistas",
                      lab: "Laboratório",
                      system: "Sistema",
                    }[m.id]
                  }
                </span>
                {page === m.id ? (
                  <span className="nav-dot" />
                ) : (
                  <ChevronRight size={13} />
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="system-status">
              <div>
                <span className="live-dot" /> SISTEMA OPERACIONAL
              </div>
              <small>Pequenos passos. Grandes evoluções.</small>
              <div className="status-bars">
                {Array.from({ length: 23 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
              <span>
                BUILD 2.1.0 <b>ESTÁVEL</b>
              </span>
            </div>
            <button className="profile" onClick={() => go("system")}>
              <div className="avatar">{(data.name || "D").slice(0, 1)}</div>
              <div>
                <strong>{data.name}</strong>
                <small>Explorador do próprio universo</small>
              </div>
              <Settings size={16} />
            </button>
          </div>
        </aside>
        {sidebar && (
          <button
            aria-label="Fechar menu"
            className="backdrop"
            onClick={() => setSidebar(false)}
          />
        )}
        <main>
          <header>
            <div className="breadcrumbs">
              <button
                className="mobile-menu icon"
                aria-label="Abrir menu"
                onClick={() => setSidebar(true)}
              >
                <Menu size={20} />
              </button>
              <Terminal size={16} />
              <span>workspace</span>
              <ChevronRight size={12} />
              <strong>{active.label}</strong>
            </div>
            <div className="header-right">
              <span className={"sync-state " + (cloud.error ? "error" : "")}>
                <span className="live-dot" />
                {cloud.status === "readonly"
                  ? "SOMENTE LEITURA"
                  : cloud.status === "saving"
                    ? "SALVANDO..."
                    : cloud.status === "pending"
                      ? "ALTERAÇÕES PENDENTES"
                      : cloud.status === "error"
                        ? "ERRO AO SALVAR"
                        : "SALVO NA NUVEM"}
              </span>
              <a href="/" className="account-button">
                REACT 2.0
              </a>
              <div className="search">
                <Search size={15} />
                <input
                  aria-label="Buscar módulos"
                  placeholder="Buscar no universo..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <div className="search-results">
                    {modules
                      .filter((m) =>
                        (m.label + m.name)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((m) => (
                        <button key={m.id} onClick={() => go(m.id)}>
                          {m.label}
                          <ArrowRight size={14} />
                        </button>
                      ))}
                    {!modules.some((m) =>
                      (m.label + m.name)
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    ) && <span>Nenhum módulo encontrado.</span>}
                  </div>
                )}
              </div>
              <span className="header-divider" />
              <button
                className="account-button"
                onClick={onSignOut}
                disabled={
                  cloud.status === "saving" || cloud.status === "pending"
                }
              >
                <span className="live-dot" />{" "}
                {role === "guest" ? "CONVIDADO · SAIR" : "ADM · SAIR"}
              </button>
              <div className="mini-avatar">
                {(data.name || "R").slice(0, 1)}
              </div>
            </div>
          </header>
          <div className="content">
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span />{" "}
                  {page === "home"
                    ? "SEU PONTO DE PARTIDA"
                    : active.label + " / WORKSPACE"}
                </div>
                <h1>
                  {page === "home" ? (
                    <>
                      Bom te ver, {data.name}
                      <span className="accent">.</span>
                    </>
                  ) : (
                    active.name
                  )}
                </h1>
                <p>
                  {page === "home"
                    ? "Seu universo em ordem. Sua próxima versão em construção."
                    : active.desc}
                </p>
              </div>
              <div className="date">
                <span>
                  {new Date().toLocaleDateString("pt-BR", { weekday: "long" })}
                </span>
                <strong>
                  {new Date().toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
              </div>
            </div>
            {cloud.recovery && (
              <div className="sync-banner" role="alert">
                <span>
                  Há alterações locais de uma sessão anterior que não foram
                  confirmadas na nuvem. O rascunho está preservado.
                </span>
                <div>
                  <button
                    className="secondary"
                    onClick={() =>
                      saveFile(
                        cloud.recovery.invalid
                          ? cloud.recovery.rawText
                          : cloud.recovery.after,
                        "RICK_DEV_rascunho_recuperado.json",
                      )
                    }
                  >
                    Baixar rascunho
                  </button>
                  <button className="secondary" onClick={cloud.acceptServer}>
                    Arquivar rascunho e usar dados da nuvem
                  </button>
                </div>
              </div>
            )}
            {cloud.error && (
              <div className="sync-banner" role="alert">
                <span>{cloud.error}</span>
                <div>
                  <button
                    className="secondary"
                    onClick={() =>
                      saveFile(data, "RICK_DEV_alteracoes_locais.json")
                    }
                  >
                    Baixar minhas alterações
                  </button>
                  <button className="secondary" onClick={cloud.retry}>
                    Tentar salvar
                  </button>
                  <button className="secondary" onClick={cloud.reload}>
                    Recarregar banco
                  </button>
                </div>
              </div>
            )}
            {boot.recoveryRaw && (
              <div className="storage-warning" role="alert">
                <strong>Os dados salvos precisam de recuperação.</strong>
                <p>O conteúdo original foi preservado. {boot.error}</p>
                <div className="actions">
                  <button
                    className="secondary"
                    onClick={() =>
                      saveFile(
                        boot.recoveryRaw,
                        "RICK_DEV_dados_preservados.json",
                      )
                    }
                  >
                    Baixar dados preservados
                  </button>
                  <button
                    className="secondary"
                    onClick={() => {
                      try {
                        localStorage.setItem(
                          "rick-os-v2-recovery",
                          boot.recoveryRaw,
                        );
                        setBoot((b) => ({ ...b, recoveryRaw: null }));
                        setRawData((d) => recoverPrivateFields(d));
                        notify(
                          "Uma cópia dos dados anteriores foi preservada neste navegador.",
                        );
                      } catch {
                        notify(
                          "Não foi possível preservar a cópia. Baixe os dados antes de continuar.",
                        );
                      }
                    }}
                  >
                    Recuperar armazenamento local com cópia
                  </button>
                </div>
              </div>
            )}
            {storageError && (
              <div role="alert" className="storage-warning">
                O navegador não conseguiu salvar. Exporte um backup para guardar
                suas alterações.
              </div>
            )}
            {page === "home" && (
              <>
                <section className="hero">
                  <div className="hero-copy">
                    <div className="hero-tag">
                      <span className="live-dot" /> LABORATÓRIO PESSOAL · V2.0
                    </div>
                    <h2>
                      Menos caos.
                      <br />
                      Mais <span>possibilidades.</span>
                    </h2>
                    <p>
                      Conhecimento, movimento e equilíbrio.
                      <br />
                      Tudo conectado em um só lugar.
                    </p>
                    <button
                      className="primary"
                      onClick={() =>
                        role === "guest"
                          ? go("study")
                          : setModal({ type: "task" })
                      }
                    >
                      {role === "guest"
                        ? "Explorar meus estudos"
                        : "Criar uma missão"}{" "}
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="portal-art" aria-hidden="true">
                    <div className="coordinate top">
                      DIMENSION C-137 / RICK_DEV
                    </div>
                    <div className="orbit o1" />
                    <div className="orbit o2" />
                    <div className="orbit o3" />
                    <div className="portal">
                      <div className="portal-core">
                        <Command size={58} />
                      </div>
                    </div>
                    <span className="star s1">+</span>
                    <span className="star s2">+</span>
                    <span className="star s3">+</span>
                    <div className="coordinate bottom">
                      SEU PRÓXIMO NÍVEL ESTÁ AQUI <ArrowUpRight size={12} />
                    </div>
                  </div>
                  <div className="hero-index">01 — INFINITE POSSIBILITIES</div>
                </section>
                <div className="module-grid">
                  {modules.slice(1, 4).map((m, i) => (
                    <button
                      className="module-card"
                      style={{ "--module": m.color }}
                      key={m.id}
                      onClick={() => go(m.id)}
                    >
                      <div className="module-card-top">
                        <div className="module-icon">
                          <m.icon size={20} />
                        </div>
                        <ArrowUpRight size={19} />
                      </div>
                      <small>
                        0{i + 1} / {m.label}
                      </small>
                      <h3>
                        {
                          [
                            "Alimente sua mente",
                            "Evolua em movimento",
                            "Cuide do seu futuro",
                          ][i]
                        }
                      </h3>
                      <div className="module-foot">
                        <span>
                          {i === 0
                            ? data.tasks.filter(
                                (t) => t.module === "study" && !t.done,
                              ).length + " missões em aberto"
                            : i === 1
                              ? data.workouts.filter((t) => t.done).length +
                                " treinos concluídos"
                              : shoppingSummary([...data.pc, ...data.style])
                                  .purchased + " conquistas realizadas"}
                        </span>
                        <ChevronRight size={14} />
                      </div>
                    </button>
                  ))}
                </div>
                <HomeExtras
                  data={data}
                  setData={setData}
                  notify={notify}
                  go={go}
                />
                <div className="dashboard-grid">
                  <Missions data={data} setData={setData} notify={notify} />
                  <FocusTimer
                    seconds={seconds}
                    setSeconds={setSeconds}
                    running={running}
                    setRunning={setRunning}
                    duration={duration}
                    setDuration={setDuration}
                    data={data}
                    setData={setData}
                  />
                </div>
                <div className="bottom-strip">
                  <FlaskConical size={18} />
                  <p>
                    O experimento mais importante é você.
                    <span> Continue construindo.</span>
                  </p>
                  <span>RICK_DEV OS / 2.0</span>
                </div>
              </>
            )}
            {page === "study" && (
              <>
                <div className="stats">
                  <div>
                    <small>MISSÕES DE ESTUDO</small>
                    <strong>{tasks.length}</strong>
                  </div>
                  <div>
                    <small>CONCLUÍDAS</small>
                    <strong>{tasks.filter((t) => t.done).length}</strong>
                  </div>
                  <div>
                    <small>SESSÕES DE FOCO</small>
                    <strong>{data.focusCount}</strong>
                  </div>
                </div>
                <div className="dashboard-grid">
                  <Missions
                    data={data}
                    setData={setData}
                    notify={notify}
                    studyOnly
                  />
                  <FocusTimer
                    seconds={seconds}
                    setSeconds={setSeconds}
                    running={running}
                    setRunning={setRunning}
                    duration={duration}
                    setDuration={setDuration}
                    data={data}
                    setData={setData}
                  />
                </div>
                <StudyExtras data={data} setData={setData} notify={notify} />
              </>
            )}
            {page === "fit" && (
              <Fit
                data={data}
                setData={setData}
                notify={notify}
                workouts={
                  <>
                    <div className="stats">
                      <div>
                        <small>TREINOS CADASTRADOS</small>
                        <strong>{data.workouts.length}</strong>
                      </div>
                      <div>
                        <small>TREINOS CONCLUÍDOS</small>
                        <strong>
                          {data.workouts.filter((w) => w.done).length}
                        </strong>
                      </div>
                      <div>
                        <small>NO SEU RITMO</small>
                        <strong>∞</strong>
                      </div>
                    </div>
                    <section className="panel">
                      <div className="panel-head">
                        <h3>SEU PLANO DE MOVIMENTO</h3>
                        <button
                          className="text-button"
                          onClick={() => setModal({ type: "workout" })}
                        >
                          <Plus size={16} /> Novo treino
                        </button>
                      </div>
                      {!data.workouts.length ? (
                        <div className="empty">
                          <Dumbbell size={30} />
                          <strong>Vamos colocar o corpo em movimento?</strong>
                          <span>Adicione seu treino ou uma caminhada.</span>
                        </div>
                      ) : (
                        data.workouts.map((w) => (
                          <div
                            className={"task " + (w.done ? "done" : "")}
                            key={w.id}
                          >
                            <button
                              className="checkbox"
                              aria-label="Marcar treino"
                              onClick={() =>
                                setData((d) => ({
                                  ...d,
                                  workouts: d.workouts.map((x) =>
                                    x.id === w.id ? { ...x, done: !x.done } : x,
                                  ),
                                }))
                              }
                            >
                              {w.done && <Check size={13} />}
                            </button>
                            <strong>{w.title}</strong>
                            <span className="tag">
                              {w.done ? "CONCLUÍDO" : "PLANEJADO"}
                            </span>
                            <button
                              className="icon"
                              aria-label="Excluir treino"
                              onClick={() =>
                                setModal({ type: "delete-workout", id: w.id })
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))
                      )}
                    </section>
                  </>
                }
              />
            )}
            {page === "finance" && (
              <Finance
                data={data}
                setData={setData}
                notify={notify}
                transactions={
                  <>
                    <div className="stats">
                      <div>
                        <small>SALDO ATUAL</small>
                        <strong>{money(balance(data.transactions))}</strong>
                      </div>
                      <div>
                        <small>ENTRADAS</small>
                        <strong className="green">
                          {money(
                            data.transactions
                              .filter((t) => t.type === "income")
                              .reduce((s, t) => s + t.amount, 0),
                          )}
                        </strong>
                      </div>
                      <div>
                        <small>SAÍDAS</small>
                        <strong>
                          {money(
                            data.transactions
                              .filter((t) => t.type === "expense")
                              .reduce((s, t) => s + t.amount, 0),
                          )}
                        </strong>
                      </div>
                    </div>
                    <section className="panel">
                      <div className="panel-head">
                        <h3>MOVIMENTAÇÕES</h3>
                        <button
                          className="text-button"
                          onClick={() => setModal({ type: "transaction" })}
                        >
                          <Plus size={15} /> Novo lançamento
                        </button>
                      </div>
                      {!data.transactions.length ? (
                        <div className="empty">
                          <Wallet size={30} />
                          <strong>Cada real tem uma história</strong>
                          <span>Registre sua primeira entrada ou despesa.</span>
                        </div>
                      ) : (
                        data.transactions
                          .slice()
                          .reverse()
                          .map((t) => (
                            <div className="task" key={t.id}>
                              <div className="transaction-icon">
                                <Wallet size={18} />
                              </div>
                              <div>
                                <strong>{t.title}</strong>
                                <small>
                                  {new Date(t.date).toLocaleDateString("pt-BR")}
                                </small>
                              </div>
                              <strong
                                className={
                                  "amount " +
                                  (t.type === "income" ? "green" : "")
                                }
                              >
                                {t.type === "income" ? "+" : "−"}{" "}
                                {money(t.amount)}
                              </strong>
                              <button
                                className="icon"
                                aria-label="Excluir lançamento"
                                onClick={() =>
                                  setModal({
                                    type: "delete-transaction",
                                    id: t.id,
                                  })
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))
                      )}
                    </section>
                  </>
                }
              />
            )}
            {page === "lab" && (
              <Lab
                data={data}
                setData={setData}
                notify={notify}
                readOnly={role === "guest"}
              />
            )}
            {page === "system" && (
              <>
                <SystemExtras
                  data={data}
                  setData={setData}
                  notify={notify}
                  setAccessOpen={onSignOut}
                  role={role}
                  setRole={setRole}
                  cloud={cloud}
                />
                <div className="settings-grid">
                  <section className="panel">
                    <div className="panel-head">
                      <h3>IDENTIDADE DO EXPLORADOR</h3>
                      <Settings size={17} />
                    </div>
                    <div className="settings-body">
                      <label>
                        Como podemos te chamar?
                        <input
                          maxLength={30}
                          value={data.name}
                          disabled={role === "guest"}
                          onChange={(e) =>
                            setData((d) => ({ ...d, name: e.target.value }))
                          }
                        />
                      </label>
                      <div className="info">
                        <span className="live-dot" />
                        <p>
                          Suas listas ficam sincronizadas no Supabase.
                          <br />
                          <small>
                            Exporte um backup para guardar ou transferir para
                            outro dispositivo.
                          </small>
                        </p>
                      </div>
                    </div>
                  </section>
                  <section className="panel">
                    <div className="panel-head">
                      <h3>BACKUP E RESTAURAÇÃO</h3>
                      <Download size={17} />
                    </div>
                    <div className="settings-body">
                      <p>
                        Leve seu universo com você. Aceita backups do 1.0 e do
                        2.0.
                      </p>
                      <button className="primary" onClick={download}>
                        <Download size={16} /> Exportar backup
                      </button>
                      <button
                        className="secondary"
                        disabled={role === "guest"}
                        onClick={() => fileRef.current.click()}
                      >
                        <Upload size={16} /> Restaurar backup
                      </button>
                      <button
                        className="secondary"
                        onClick={async () => {
                          if (role === "guest") {
                            notify("Modo convidado: apenas leitura.");
                            return;
                          }
                          try {
                            const raw = localStorage.getItem(
                              "rick-os-v2-before-import",
                            );
                            if (!raw) {
                              notify(
                                "Ainda não há cópia preventiva neste navegador.",
                              );
                              return;
                            }
                            const previous = await parseBackup(JSON.parse(raw));
                            setModal({ type: "restore", data: previous });
                          } catch (err) {
                            notify(
                              "Não foi possível recuperar a cópia: " +
                                err.message,
                            );
                          }
                        }}
                      >
                        Recuperar cópia preventiva
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".json,application/json"
                        hidden
                        onChange={restore}
                      />
                    </div>
                  </section>
                  <section className="panel system-info">
                    <Terminal size={20} />
                    <div>
                      <h3>RICK_DEV OS 2.0</h3>
                      <p>React · Dados na nuvem · Cofre privado local</p>
                      <small>
                        Seus módulos usam a nuvem com salvamento por alterações.
                        Códigos e anotações continuam neste navegador.
                      </small>
                    </div>
                    <span className="tag">V2.1.0</span>
                  </section>
                </div>
              </>
            )}
            {role === "guest" && (
              <div className="guest-banner">
                Visualização de convidado · somente leitura.{" "}
                <button
                  onClick={() => {
                    onSignOut();
                  }}
                >
                  Sair da visualização
                </button>
              </div>
            )}
            <footer>
              <span>
                <span className="live-dot" /> FEITO PARA EVOLUIR COM VOCÊ
              </span>
              <span>
                RICK_DEV <b>© {new Date().getFullYear()}</b>
              </span>
            </footer>
          </div>
        </main>
        <Music
          data={data}
          setData={setData}
          notify={notify}
          readOnly={role === "guest"}
        />
        {toast && (
          <div role="status" className="toast">
            <CheckCheck size={18} />
            {toast}
          </div>
        )}
        {modal && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <section
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-label="Editar seu universo"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="panel-head">
                <h3>
                  {modal.type === "transaction"
                    ? "NOVO LANÇAMENTO"
                    : modal.type === "workout"
                      ? "NOVO TREINO"
                      : modal.type === "task"
                        ? "NOVA MISSÃO"
                        : modal.type === "restore"
                          ? "RESTAURAR BACKUP"
                          : "CONFIRMAR EXCLUSÃO"}
                </h3>
                <button
                  className="icon"
                  aria-label="Fechar"
                  onClick={() => setModal(null)}
                >
                  <X size={18} />
                </button>
              </div>
              {["task", "workout", "transaction"].includes(modal.type) ? (
                <form onSubmit={submit}>
                  <label>
                    {modal.type === "workout"
                      ? "Qual é o treino?"
                      : "Descrição"}
                    <input
                      name="title"
                      autoFocus
                      required
                      maxLength={140}
                      placeholder={
                        modal.type === "task"
                          ? "Ex.: Estudar componentes React"
                          : "Dê um nome ao registro"
                      }
                    />
                  </label>
                  {modal.type === "task" && (
                    <>
                      <label>
                        Módulo
                        <select
                          name="module"
                          defaultValue={page === "home" ? "home" : "study"}
                        >
                          <option value="study">RICK_STUDY</option>
                          <option value="home">RICK_HOME</option>
                        </select>
                      </label>
                      <label>
                        Descrição
                        <textarea name="description" maxLength={2000} />
                      </label>
                      <label>
                        Progresso (%)
                        <input
                          name="progress"
                          type="number"
                          min="0"
                          max="100"
                          defaultValue="0"
                        />
                      </label>
                      <label>
                        Categoria
                        <input
                          name="tag"
                          placeholder="Ex.: React, ADS, Pessoal"
                          maxLength={35}
                        />
                      </label>
                    </>
                  )}
                  {modal.type === "transaction" && (
                    <>
                      <label>
                        Tipo
                        <select name="type">
                          <option value="expense">Saída / despesa</option>
                          <option value="income">Entrada / receita</option>
                        </select>
                      </label>
                      <label>
                        Valor (R$)
                        <input
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          placeholder="0,00"
                        />
                      </label>
                    </>
                  )}
                  <button className="primary" type="submit">
                    Salvar <Check size={16} />
                  </button>
                </form>
              ) : (
                <div className="settings-body">
                  <p>
                    {modal.type === "restore"
                      ? "Os dados deste navegador serão substituídos pelos dados do backup."
                      : "Este registro será removido permanentemente deste navegador."}
                  </p>
                  <div className="actions">
                    <button
                      className="secondary"
                      onClick={() => setModal(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="primary"
                      onClick={() => {
                        if (role === "guest") {
                          notify("Modo convidado: apenas leitura.");
                          return;
                        }
                        if (modal.type === "restore") {
                          try {
                            setData(
                              restoreWorkspace(
                                localStorage,
                                data,
                                modal.data,
                                role,
                              ),
                            );
                          } catch (err) {
                            notify(
                              "Não foi possível preservar a cópia preventiva. Exporte seus dados e libere espaço.",
                            );
                            return;
                          }
                        } else {
                          const key =
                            modal.type === "delete-task"
                              ? "tasks"
                              : modal.type === "delete-workout"
                                ? "workouts"
                                : "transactions";
                          setData((d) => ({
                            ...d,
                            [key]: d[key].filter((t) => t.id !== modal.id),
                          }));
                        }
                        setModal(null);
                        notify("Alteração concluída.");
                      }}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </ReadOnlyContext.Provider>
  );
}
