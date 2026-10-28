import React from "react";
import {
  ArrowUpRight,
  FolderGit2,
  Terminal,
  CheckCircle2,
  BookOpen,
  Target,
  Footprints,
} from "lucide-react";
import { stages, shoppingSummary, today } from "./models.mjs";
import {
  Progress,
  Empty,
  useCollection,
  RowActions,
  AddButton,
  ExternalLink,useReadOnly,
} from "./components.jsx";
import { carePercent, missionPercent } from "./dashboard.mjs";
const names = {
  home: "RICK_HOME",
  study: "RICK_STUDY",
  fit: "RICK_FIT",
  finance: "RICK_FINANCE",
  lab: "RICK_LAB",
  system: "RICK_SYSTEM",
};
const fields = [
  { name: "title", label: "Título do marco", required: true },
  { name: "module", label: "Módulo", type: "select", options: names },
  { name: "status", label: "Etapa", type: "select", options: stages },
  { name: "description", label: "Descrição", type: "textarea", wide: true },
];
export default function HomeExtras({ data, setData, notify, go }) {
  const readOnly=useReadOnly();
  const editor = useCollection("evolution", data, setData, notify, {
    fields,
    title: "marco de evolução",
    defaults: { module: "home", status: "doing" },
  });
  const shopping = shoppingSummary([...data.pc, ...data.style]);
  const metrics = [
    [
      "ESTUDOS",
      data.topics.length
        ? (data.topics.filter((x) => x.done).length / data.topics.length) * 100
        : 0,
      "study",
    ],
    ["MISSÕES", missionPercent(data.tasks, data.projects.length), "study"],
    ["CONQUISTAS", shopping.percent, "finance"],
    ["SAÚDE DO SISTEMA", carePercent(data.systemProgress), "system"],
  ];
  return (
    <div className="feature-stack home-extras">
      <div className="overview-metrics">
        {metrics.map(([label, value, page]) => (
          <button
            key={label}
            className="panel metric-card"
            onClick={() => go(page)}
          >
            <div
              className="mini-ring"
              style={{ "--angle": Math.round(value) * 3.6 + "deg" }}
            >
              <strong>
                {Math.round(value)}
                <small>%</small>
              </strong>
            </div>
            <div>
              <small>{label}</small>
              <span>
                Ver progresso <ArrowUpRight size={12} />
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="next-grid">
        <button className="next-card" onClick={() => go("study")}>
          <small>
            <BookOpen size={13} /> CONTINUE DE ONDE PAROU
          </small>
          <strong>
            {data.topics.find((t) => !t.done)?.title ||
              "Sua trilha está em dia"}
          </strong>
          <span>Abrir estudos ↗</span>
        </button>
        <button className="next-card" onClick={() => go("study")}>
          <small>
            <Target size={13} /> SUA PRÓXIMA MISSÃO
          </small>
          <strong>
            {data.tasks.find((t) => !t.done)?.title ||
              "Espaço para um novo desafio"}
          </strong>
          <span>Ver missões ↗</span>
        </button>
        <button className="next-card" onClick={() => go("fit")}>
          <small>
            <Footprints size={13} /> MOVIMENTO NESTE MÊS
          </small>
          <strong>
            {Math.round(
              data.runs
                .filter((r) => r.date.startsWith(today().slice(0, 7)))
                .reduce((s, r) => s + r.distanceKm, 0) * 100,
            ) / 100}{" "}
            km registrados
          </strong>
          <span>Ver sua evolução ↗</span>
        </button>
      </div>
      <section className="panel">
        <div className="panel-head">
          <h3>
            <FolderGit2 size={17} /> SEUS PROJETOS
          </h3>
          <button className="text-button" onClick={() => go("lab")}>
            Explorar laboratório <ArrowUpRight size={14} />
          </button>
        </div>
        {!data.projects.length ? (
          <Empty
            icon={FolderGit2}
            title="Projetos que mostram sua evolução."
            text="Cadastre seus projetos na área RICK_LAB."
          />
        ) : (
          <div className="home-projects">
            {data.projects.slice(0, 3).map((p) => (
              <article key={p.id}>
                <span className={"stage " + p.status}>{stages[p.status]}</span>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <ExternalLink url={p.url}>Ver projeto</ExternalLink>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="panel">
        <div className="panel-head">
          <h3>
            <Terminal size={17} /> EVOLUÇÃO DO RICK_DEV OS
          </h3>
          <AddButton onClick={() => editor.open()}>Adicionar marco</AddButton>
        </div>
        <div className="evolution-board">
          {Object.entries(stages).map(([status, label]) => (
            <div className="board-column" key={status}>
              <h4>
                <i className={status} />
                {label}
                <span>
                  {data.evolution.filter((x) => x.status === status).length}
                </span>
              </h4>
              {data.evolution
                .filter((x) => x.status === status)
                .map((item) => (
                  <article key={item.id}>
                    <small>{names[item.module]}</small>
                    <h3>{item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                    <div className="board-card-bottom">
                      <select
                        aria-label={"Etapa de " + item.title} disabled={readOnly}
                        value={item.status}
                        onChange={(e) =>
                          setData((d) => ({
                            ...d,
                            evolution: d.evolution.map((x) =>
                              x.id === item.id
                                ? { ...x, status: e.target.value }
                                : x,
                            ),
                          }))
                        }
                      >
                        {Object.entries(stages).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <RowActions record={item} editor={editor} />
                    </div>
                  </article>
                ))}
              {!data.evolution.some((x) => x.status === status) && (
                <span className="board-empty">
                  Espaço para novas evoluções.
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
      {editor.ui}
    </div>
  );
}
