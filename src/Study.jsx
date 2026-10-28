import React, { useState } from "react";
import {
  BookOpen,
  Check,
  Link,
  Video,
  GraduationCap,
  Target,
} from "lucide-react";
import {
  Empty,
  useCollection,
  RowActions,
  AddButton,
  ExternalLink,
  Progress,useReadOnly,
} from "./components.jsx";
export const taskFields = [
  { name: "title", label: "Título da missão", required: true, maxLength: 140 },
  {
    name: "module",
    label: "Módulo",
    type: "select",
    options: { study: "RICK_STUDY", home: "RICK_HOME" },
  },
  { name: "description", label: "Descrição", type: "textarea", wide: true },
  { name: "tag", label: "Categoria", placeholder: "React, ADS, Pessoal..." },
  {
    name: "progress",
    label: "Progresso (%)",
    type: "number",
    min: 0,
    max: 100,
    step: 1,
    default: 0,
  },
];
export function Missions({ data, setData, notify, studyOnly = false }) {
  const readOnly=useReadOnly();
  const editor = useCollection("tasks", data, setData, notify, {
    fields: taskFields,
    title: "missão",
    defaults: { module: studyOnly ? "study" : "home", progress: 0 },
  });
  const items = data.tasks.filter((x) => !studyOnly || x.module === "study");
  const progress = items.length
    ? items.reduce((s, x) => s + (x.done ? 100 : x.progress || 0), 0) /
      items.length
    : 0;
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>
          <Target size={16} />{" "}
          {studyOnly ? "MINHAS MISSÕES DE ESTUDO" : "SUAS MISSÕES"}{" "}
          <span className="count">{items.filter((x) => !x.done).length}</span>
        </h3>
        <AddButton onClick={() => editor.open()}>Nova missão</AddButton>
      </div>
      <div className="section-toolbar">
        <Progress
          value={progress}
          label="Um pequeno passo hoje já é progresso."
          detail={`${items.filter((x) => x.done).length}/${items.length} concluídas`}
        />
      </div>
      {!items.length ? (
        <Empty />
      ) : (
        items.map((t) => (
          <div className={"record-row " + (t.done ? "is-done" : "")} key={t.id}>
            <button
              className="checkbox" disabled={readOnly}
              aria-label={(t.done ? "Reabrir " : "Concluir ") + t.title}
              onClick={() =>
                setData((d) => ({
                  ...d,
                  tasks: d.tasks.map((x) =>
                    x.id === t.id
                      ? { ...x, done: !x.done, progress: x.done ? 0 : 100 }
                      : x,
                  ),
                }))
              }
            >
              {t.done && <Check size={13} />}
            </button>
            <div className="record-copy">
              <strong>{t.title}</strong>
              {t.description && <p>{t.description}</p>}
              <small>
                {t.tag || "Pessoal"} · {t.done ? 100 : t.progress || 0}%
              </small>
            </div>
            <RowActions editor={editor} record={t} />
          </div>
        ))
      )}
      {items.some((t) => !t.done) && (
        <button
          className="panel-link" disabled={readOnly}
          onClick={() => {
            const t = items.find((t) => !t.done);
            setData((d) => ({
              ...d,
              tasks: d.tasks.map((x) =>
                x.id === t.id ? { ...x, done: true, progress: 100 } : x,
              ),
            }));
          }}
        >
          Concluir próxima missão <Check size={15} />
        </button>
      )}
      {editor.ui}
    </section>
  );
}
const resourceFields = [
  { name: "title", label: "Título do material", required: true },
  {
    name: "type",
    label: "Tipo",
    type: "select",
    options: {
      video: "Vídeo",
      site: "Site",
      course: "Curso",
      book: "Livro / documento",
    },
  },
  { name: "url", label: "Link do material", type: "url", required: true },
  {
    name: "category",
    label: "Matéria / categoria",
    placeholder: "Ex.: React, Banco de dados",
  },
];
export default function StudyExtras({ data, setData, notify }) {
  const readOnly=useReadOnly();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const topics = useCollection("topics", data, setData, notify, {
    fields: [
      { name: "title", label: "Nome da matéria ou assunto", required: true },
    ],
    title: "matéria",
  });
  const resources = useCollection("resources", data, setData, notify, {
    fields: resourceFields,
    title: "material",
    defaults: { type: "site" },
  });
  const done = data.topics.filter((t) => t.done).length;
  const visible = data.resources.filter(
    (r) =>
      (filter === "all" || r.type === filter) &&
      (r.title + " " + r.category)
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  return (
    <div className="feature-stack">
      <section className="panel">
        <div className="panel-head">
          <h3>
            <BookOpen size={17} /> MEUS ESTUDOS
          </h3>
          <AddButton onClick={() => topics.open()}>Adicionar matéria</AddButton>
        </div>
        <div className="section-toolbar">
          <Progress
            value={data.topics.length ? (done / data.topics.length) * 100 : 0}
            label="Sua trilha de aprendizado"
            detail={`${done}/${data.topics.length} assuntos concluídos`}
          />
        </div>
        {!data.topics.length ? (
          <Empty
            icon={GraduationCap}
            title="Conhecimento em construção."
            text="Organize suas matérias, assuntos e tecnologias."
          />
        ) : (
          <div className="topics-grid">
            {data.topics.map((t) => (
              <div className={"topic " + (t.done ? "is-done" : "")} key={t.id}>
                <button
                  className="checkbox" disabled={readOnly}
                  aria-label={(t.done ? "Reabrir " : "Concluir ") + t.title}
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      topics: d.topics.map((x) =>
                        x.id === t.id ? { ...x, done: !x.done } : x,
                      ),
                    }))
                  }
                >
                  {t.done && <Check size={13} />}
                </button>
                <strong>{t.title}</strong>
                <RowActions record={t} editor={topics} />
              </div>
            ))}
          </div>
        )}
        {data.topics.some((t) => !t.done) && (
          <button
            className="panel-link" disabled={readOnly}
            onClick={() => {
              const t = data.topics.find((t) => !t.done);
              setData((d) => ({
                ...d,
                topics: d.topics.map((x) =>
                  x.id === t.id ? { ...x, done: true } : x,
                ),
              }));
            }}
          >
            Marcar próximo assunto <Check size={15} />
          </button>
        )}
      </section>
      <section className="panel">
        <div className="panel-head">
          <h3>
            <Link size={17} /> BIBLIOTECA DE MATERIAIS
          </h3>
          <AddButton onClick={() => resources.open()}>
            Adicionar material
          </AddButton>
        </div>
        <div className="section-toolbar">
          <label>
            Pesquisar materiais
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Título ou categoria..."
            />
          </label>
          <label>
            Tipo de material
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Todos os materiais</option>
              {Object.entries(resourceFields[1].options).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!visible.length ? (
          <Empty
            icon={BookOpen}
            title="Sua biblioteca, sempre por perto."
            text="Guarde os links de vídeos, cursos e materiais de estudo."
          />
        ) : (
          <div className="resource-grid">
            {visible.map((r) => (
              <article className="resource-card" key={r.id}>
                <div className="resource-top">
                  {r.type === "video" ? (
                    <Video size={19} />
                  ) : (
                    <BookOpen size={19} />
                  )}
                  <span className="tag">
                    {resourceFields[1].options[r.type]}
                  </span>
                </div>
                <small>{r.category}</small>
                <h3>{r.title}</h3>
                <div className="shopping-bottom">
                  <ExternalLink url={r.url}>Acessar material</ExternalLink>
                  <RowActions record={r} editor={resources} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {topics.ui}
      {resources.ui}
    </div>
  );
}
