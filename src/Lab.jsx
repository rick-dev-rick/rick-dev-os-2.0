import React, { useState, useRef } from "react";
import {
  Code2,
  FlaskConical,
  Star,
  Copy,
  Download,
  Upload,
  Search,
  FolderGit2,
} from "lucide-react";
import { stages, validateRecord, saveFile } from "./models.mjs";
import {
  Tabs,
  Empty,
  useCollection,
  RowActions,
  AddButton,
  ExternalLink,
} from "./components.jsx";
import { createId } from "./data.mjs";
const projectFields = [
  { name: "title", label: "Nome do projeto", required: true },
  { name: "status", label: "Etapa", type: "select", options: stages },
  { name: "description", label: "Descrição", type: "textarea", wide: true },
  {
    name: "tech",
    label: "Tecnologias",
    placeholder: "React, JavaScript, Supabase...",
  },
  { name: "url", label: "Link do projeto", type: "url" },
];
const languages = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  jsx: "React / JSX",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  sql: "SQL",
  python: "Python",
  other: "Outra",
};
const snippetFields = [
  { name: "title", label: "Título do trecho", required: true },
  { name: "language", label: "Linguagem", type: "select", options: languages },
  { name: "category", label: "Categoria" },
  {
    name: "description",
    label: "Descrição",
    type: "textarea",
    maxLength: 2000,
  },
  {
    name: "code",
    label: "Código",
    type: "textarea",
    maxLength: 100000,
    rows: 10,
    wide: true,
    required: true,
  },
  {
    name: "notes",
    label: "Anotações",
    type: "textarea",
    maxLength: 5000,
    wide: true,
  },
  { name: "favorite", label: "Marcar como favorito", type: "checkbox" },
];
export async function vaultChecksum(records) {
  const bytes = new TextEncoder().encode(JSON.stringify(records));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export default function Lab({ data, setData, notify, readOnly = false }) {
  const [tab, setTab] = useState("projects"),
    [query, setQuery] = useState(""),
    [language, setLanguage] = useState("all"),
    [favorites, setFavorites] = useState(false),
    [expanded, setExpanded] = useState(null);
  const importRef = useRef();
  const projects = useCollection("projects", data, setData, notify, {
      fields: projectFields,
      title: "projeto",
      defaults: { status: "doing" },
    }),
    snippets = useCollection("snippets", data, setData, notify, {
      fields: snippetFields,
      title: "trecho de código",
      defaults: { language: "javascript" },
    });
  const visible = data.snippets
    .filter(
      (s) =>
        (!favorites || s.favorite) &&
        (language === "all" || s.language === language) &&
        (
          s.title +
          " " +
          s.category +
          " " +
          s.description +
          " " +
          s.code +
          " " +
          s.notes
        )
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
    )
    .sort((a, b) => Number(b.favorite) - Number(a.favorite));
  async function copy(code) {
    try {
      await navigator.clipboard.writeText(code);
      notify("Código copiado.");
    } catch {
      notify(
        "Não foi possível copiar automaticamente. Selecione o código para copiar.",
      );
    }
  }
  async function exportVault() {
    try {
      const records = data.snippets.map((s) => ({
        ...s,
        language: s.language || "javascript",
      }));
      saveFile(
        {
          format: "rick-vault-v2",
          schemaVersion: 1,
          records,
          checksum: await vaultChecksum(records),
        },
        "RICK_DEV_cofre_2.0.json",
      );
      notify("Cofre exportado.");
    } catch {
      notify("Não foi possível exportar. Use o backup completo do sistema.");
    }
  }
  async function importVault(e) {
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5000000) throw Error("O arquivo excede 5 MB.");
      const a = JSON.parse(await file.text());
      if (
        !["rick-vault-v2", "rick-code-vault"].includes(a.format) ||
        a.schemaVersion !== 1 ||
        !Array.isArray(a.records) ||
        a.records.length > 2000
      )
        throw Error("Arquivo de cofre inválido.");
      if (a.checksum !== (await vaultChecksum(a.records)))
        throw Error("A integridade do arquivo não pôde ser confirmada.");
      const incoming = a.records.map((s) =>
        validateRecord("snippets", { ...s, id: createId() }),
      );
      setData((d) => {
        const unique = new Set(
          d.snippets.map((s) => JSON.stringify([s.title, s.language, s.code])),
        );
        return {
          ...d,
          snippets: [
            ...d.snippets,
            ...incoming.filter((s) => {
              const k = JSON.stringify([s.title, s.language, s.code]);
              if (unique.has(k)) return false;
              unique.add(k);
              return true;
            }),
          ],
        };
      });
      notify("Trechos importados sem substituir os existentes.");
    } catch (err) {
      notify(err.message);
    }
    e.target.value = "";
  }
  return (
    <>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          ["projects", "Meus projetos"],
          ["vault", "Cofre de Códigos"],
          ["notes", "Caderno do laboratório"],
        ]}
      />
      {tab === "projects" ? (
        <section className="panel">
          <div className="panel-head">
            <h3>
              <FolderGit2 size={18} /> IDEIAS QUE SAÍRAM DO PAPEL
            </h3>
            <AddButton onClick={() => projects.open()}>
              Adicionar projeto
            </AddButton>
          </div>
          {!data.projects.length ? (
            <Empty
              icon={FlaskConical}
              title="Seu próximo experimento começa aqui."
              text="Organize seus projetos, tecnologias e links."
            />
          ) : (
            <div className="project-grid">
              {data.projects.map((p) => (
                <article className="project-card" key={p.id}>
                  <div className="resource-top">
                    <FolderGit2 size={24} />
                    <span className={"stage " + p.status}>
                      {stages[p.status]}
                    </span>
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.description || "Um novo projeto em construção."}</p>
                  <div className="tech-list">
                    {p.tech
                      .split(",")
                      .filter(Boolean)
                      .map((t, i) => (
                        <span key={i}>{t.trim()}</span>
                      ))}
                  </div>
                  <div className="shopping-bottom">
                    <ExternalLink url={p.url}>Explorar projeto</ExternalLink>
                    <RowActions record={p} editor={projects} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : tab === "notes" ? (
        <section className="panel">
          <div className="panel-head">
            <h3>CADERNO DO LABORATÓRIO</h3>
            <span className="tiny">SALVO NESTE NAVEGADOR</span>
          </div>
          <textarea
            className="notebook"
            aria-label="Suas anotações"
            value={data.notes}
            onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
            placeholder="Ideias, experimentos e descobertas..."
          />
        </section>
      ) : (
        <section className="panel">
          <div className="panel-head">
            <h3>
              <Code2 size={18} /> COFRE DE CÓDIGOS{" "}
              <span className="count">{data.snippets.length}</span>
            </h3>
            <AddButton onClick={() => snippets.open()}>Novo trecho</AddButton>
          </div>
          {readOnly ? (
            <Empty
              icon={Code2}
              title="Cofre disponível apenas no modo de edição."
              text="Os trechos são locais e não ficam disponíveis na visualização de convidado."
            />
          ) : (
            <>
              <div className="vault-toolbar">
                <label>
                  Pesquisar no cofre
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Título, código, anotações..."
                  />
                </label>
                <label>
                  Linguagem
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="all">Todas as linguagens</option>
                    {Object.entries(languages).map(([v, l]) => (
                      <option value={v} key={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={favorites}
                    onChange={(e) => setFavorites(e.target.checked)}
                  />
                  Só favoritos
                </label>
              </div>
              <div className="vault-actions">
                <button className="secondary" onClick={exportVault}>
                  <Download size={14} /> Exportar cofre
                </button>
                <button
                  className="secondary"
                  onClick={() => importRef.current.click()}
                >
                  <Upload size={14} /> Importar cofre
                </button>
                <input
                  type="file"
                  ref={importRef}
                  accept=".json"
                  hidden
                  onChange={importVault}
                />
                <span>
                  Importar adiciona trechos, sem apagar o cofre atual.
                </span>
              </div>
              {!visible.length ? (
                <Empty
                  icon={Code2}
                  title="Guarde o que você aprende."
                  text="Trechos, favoritos e pesquisa para encontrar o código certo."
                />
              ) : (
                visible.map((s) => (
                  <article className="snippet" key={s.id}>
                    <div className="snippet-heading">
                      <div>
                        <small>
                          {languages[s.language] || s.language}{" "}
                          {s.category && " / " + s.category}
                        </small>
                        <h3>{s.title}</h3>
                      </div>
                      <button
                        className={"icon " + (s.favorite ? "favorite" : "")}
                        aria-label={
                          (s.favorite ? "Desfavoritar " : "Favoritar ") +
                          s.title
                        }
                        aria-pressed={s.favorite}
                        onClick={() =>
                          setData((d) => ({
                            ...d,
                            snippets: d.snippets.map((x) =>
                              x.id === s.id
                                ? { ...x, favorite: !x.favorite }
                                : x,
                            ),
                          }))
                        }
                      >
                        <Star
                          size={18}
                          fill={s.favorite ? "currentColor" : "none"}
                        />
                      </button>
                      <RowActions record={s} editor={snippets} />
                    </div>
                    {s.description && <p>{s.description}</p>}
                    <pre className={expanded === s.id ? "expanded" : ""}>
                      <code>{s.code}</code>
                    </pre>
                    <div className="snippet-bottom">
                      <button
                        className="text-button"
                        onClick={() =>
                          setExpanded(expanded === s.id ? null : s.id)
                        }
                      >
                        {expanded === s.id ? "Recolher" : "Ver código completo"}
                      </button>
                      <button
                        className="secondary"
                        onClick={() => copy(s.code)}
                      >
                        <Copy size={13} /> Copiar código
                      </button>
                    </div>
                    {s.notes && <div className="snippet-notes">{s.notes}</div>}
                  </article>
                ))
              )}
            </>
          )}
        </section>
      )}
      {projects.ui}
      {snippets.ui}
    </>
  );
}
