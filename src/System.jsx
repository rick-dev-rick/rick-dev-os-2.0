import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Stethoscope,
  Code2,
  Copy,
  Download,
  CloudDownload,
  LockKeyhole,
  Eye,
  Undo2,
} from "lucide-react";
import { normalizeData, collections, saveFile, today } from "./models.mjs";
import { awardCare } from "./dashboard.mjs";
export default function SystemExtras({
  data,
  setData,
  notify,
  setAccessOpen,
  role,
  setRole,
  cloud,
}) {
  const [diagnostics, setDiagnostics] = useState(null),
    [checking, setChecking] = useState(false),
    [code, setCode] = useState(""),
    [result, setResult] = useState(""),
    [parser, setParser] = useState("babel"),
    [width, setWidth] = useState(String(data.preferences?.tabWidth || 2)),
    [printWidth, setPrintWidth] = useState(
      String(data.preferences?.printWidth || 100),
    ),
    [error, setError] = useState(""),
    [formatting, setFormatting] = useState(false);
  async function diagnose() {
    setChecking(true);
    let checks = [];
    try {
      normalizeData(data);
      checks.push([
        "Estrutura dos dados",
        "Registros e coleções válidos.",
        true,
      ]);
    } catch (err) {
      checks.push(["Estrutura dos dados", err.message, false]);
    }
    try {
      const key = "rick-os-diagnostic-" + Date.now();
      localStorage.setItem(key, "ok");
      const ok = localStorage.getItem(key) === "ok";
      localStorage.removeItem(key);
      checks.push([
        "Armazenamento local",
        ok
          ? "Leitura e gravação disponíveis."
          : "Não foi possível validar o armazenamento.",
        ok,
      ]);
    } catch {
      checks.push([
        "Armazenamento local",
        "Indisponível ou sem espaço. Exporte um backup.",
        false,
      ]);
    }
    checks.push([
      "Persistência atual",
      collections.reduce((s, k) => s + data[k].length, 0) +
        " registros nos módulos.",
      true,
    ]);
    checks.push([
      "Sincronização em nuvem",
      cloud?.error
        ? cloud.error
        : role === "guest"
          ? "Conectado em modo somente leitura."
          : "Sincronização por módulos e verificação de conflitos ativa.",
      !cloud?.error,
    ]);
    setDiagnostics(checks);
    if (role === "admin")
      setData((d) => ({
        ...d,
        systemProgress: awardCare(d.systemProgress, "diagnosticDays", today()),
      }));
    try {
      localStorage.setItem("rick-os-last-diagnostic", new Date().toISOString());
    } catch {}
    setChecking(false);
  }
  async function format() {
    setFormatting(true);
    setError("");
    setResult("");
    try {
      const [prettier, babel, estree, html, postcss, typescript] =
        await Promise.all([
          import("prettier/standalone"),
          import("prettier/plugins/babel"),
          import("prettier/plugins/estree"),
          import("prettier/plugins/html"),
          import("prettier/plugins/postcss"),
          import("prettier/plugins/typescript"),
        ]);
      const out = await prettier.format(code, {
        parser,
        plugins: [babel, estree, html, postcss, typescript],
        tabWidth: Number(width),
        printWidth: Number(printWidth),
      });
      setResult(out);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormatting(false);
    }
  }
  return (
    <div className="feature-stack system-extras">
      <section className="panel access-panel">
        <div className="panel-head">
          <h3>
            <LockKeyhole size={17} /> CONEXÃO DO SEU WORKSPACE
          </h3>
          <span className="tag">
            {role === "admin"
              ? "ADM CONECTADO"
              : role === "guest"
                ? "CONVIDADO"
                : "CONECTADO"}
          </span>
        </div>
        <div className="settings-body">
          <div>
            <h2>Tudo conectado ao seu ritmo.</h2>
            <p>
              Suas listas são carregadas ao entrar. As alterações de
              administradores são salvas por módulo, com proteção contra
              conflitos entre telas.
            </p>
          </div>
          <div className="actions">
            <button className="primary" onClick={cloud?.reload}>
              <CloudDownload size={16} /> Atualizar dados da nuvem
            </button>
          </div>
          <small>
            Listas e progresso na nuvem. Cofre de Códigos e anotações privados
            neste navegador.
          </small>
        </div>
      </section>
      <section className="panel">
        <div className="panel-head">
          <h3>
            <Stethoscope size={17} /> DIAGNÓSTICO DO SISTEMA
          </h3>
          <button
            className="text-button"
            onClick={diagnose}
            disabled={checking}
          >
            {checking ? "Verificando..." : "Executar diagnóstico"}
          </button>
        </div>
        {diagnostics && (
          <div className="vault-actions diagnostic-export">
            <button
              className="secondary"
              onClick={() =>
                saveFile(
                  {
                    generatedAt: new Date().toISOString(),
                    app: "RICK OS 2.0",
                    checks: diagnostics.map(([title, detail, ok]) => ({
                      title,
                      detail,
                      ok,
                    })),
                  },
                  "RICK_DEV_diagnostico.json",
                )
              }
            >
              <Download size={14} /> Baixar relatório
            </button>
          </div>
        )}
        {diagnostics ? (
          <div className="diagnostic-list">
            {diagnostics.map(([title, detail, ok]) => (
              <div key={title}>
                <span className={ok ? "diagnostic-ok" : "diagnostic-pending"}>
                  {ok ? "✓" : "○"}
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="settings-body">
            <p>
              Confira a estrutura dos dados, a disponibilidade do armazenamento
              e o estado da conexão.
            </p>
          </div>
        )}
      </section>
      <section className="panel">
        <div className="panel-head">
          <h3>
            <Code2 size={17} /> FORMATADOR DE CÓDIGO
          </h3>
          <span className="tiny">PRETTIER · SEM EXECUTAR O CÓDIGO</span>
        </div>
        <div className="formatter-controls">
          <label>
            Linguagem
            <select value={parser} onChange={(e) => setParser(e.target.value)}>
              <option value="babel">JavaScript / JSX</option>
              <option value="typescript">TypeScript / TSX</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
            </select>
          </label>
          <label>
            Indentação
            <select
              value={width}
              onChange={(e) => {
                setWidth(e.target.value);
                if (role === "admin")
                  setData((d) => ({
                    ...d,
                    preferences: {
                      tabWidth: Number(e.target.value),
                      printWidth: Number(printWidth),
                    },
                  }));
              }}
            >
              <option value="2">2 espaços</option>
              <option value="4">4 espaços</option>
            </select>
          </label>
          <label>
            Largura da linha
            <select
              value={printWidth}
              onChange={(e) => {
                setPrintWidth(e.target.value);
                if (role === "admin")
                  setData((d) => ({
                    ...d,
                    preferences: {
                      tabWidth: Number(width),
                      printWidth: Number(e.target.value),
                    },
                  }));
              }}
            >
              {[80, 100, 120].map((n) => (
                <option key={n} value={n}>
                  {n} caracteres
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary"
            onClick={format}
            disabled={!code.trim() || formatting}
          >
            {formatting ? "Formatando..." : "Formatar código"}
          </button>
        </div>
        <div className="formatter-editors">
          <label>
            Seu código
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Cole seu código aqui..."
              spellCheck="false"
              maxLength={200000}
            />
          </label>
          <label>
            Resultado
            <textarea
              readOnly
              value={result}
              placeholder="O código formatado aparece aqui."
              spellCheck="false"
            />
          </label>
        </div>
        {error && (
          <pre className="form-error formatter-error" role="alert">
            {error}
          </pre>
        )}
        {result && (
          <div className="vault-actions">
            <button
              className="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result);
                  notify("Código formatado copiado.");
                } catch {
                  notify("Selecione o resultado e copie manualmente.");
                }
              }}
            >
              <Copy size={14} /> Copiar resultado
            </button>
            <button
              className="secondary"
              onClick={() =>
                saveFile(
                  result,
                  "rick-formatado." +
                    {
                      babel: "js",
                      typescript: "ts",
                      html: "html",
                      css: "css",
                      json: "json",
                    }[parser],
                )
              }
            >
              <Download size={14} /> Baixar código
            </button>
          </div>
        )}
      </section>
      {role === "admin" && (
        <section className="panel">
          <div className="panel-head">
            <h3>RASCUNHOS RECUPERADOS</h3>
          </div>
          <div className="settings-body">
            {(() => {
              const drafts = [];
              try {
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key?.startsWith("rick-os2-draft-recovery-")) {
                    const raw = localStorage.getItem(key);
                    let d;
                    try {
                      d = JSON.parse(raw);
                    } catch {}
                    drafts.push({ key, raw, d });
                  }
                }
              } catch {}
              return drafts.length ? (
                drafts.map((x) => (
                  <div className="export-history-item" key={x.key}>
                    <span>
                      {x.d?.createdAt
                        ? new Date(x.d.createdAt).toLocaleString("pt-BR")
                        : "Rascunho preservado"}
                    </span>
                    <button
                      className="secondary"
                      onClick={() =>
                        saveFile(
                          x.d?.after || x.raw,
                          "RICK_DEV_rascunho_recuperado.json",
                        )
                      }
                    >
                      Baixar rascunho
                    </button>
                  </div>
                ))
              ) : (
                <p>
                  Rascunhos de alterações não sincronizadas são preservados aqui
                  quando você escolhe continuar com os dados da nuvem.
                </p>
              );
            })()}
          </div>
        </section>
      )}
      <section className="panel">
        <div className="panel-head">
          <h3>
            <Download size={16} /> HISTÓRICO DE EXPORTAÇÕES
          </h3>
        </div>
        <div className="settings-body">
          {(() => {
            let h = [];
            try {
              h = JSON.parse(
                localStorage.getItem("rick-os-export-history") || "[]",
              );
            } catch {}
            return h.length ? (
              h.map((x, i) => (
                <div className="export-history-item" key={i}>
                  <span>{x.label}</span>
                  <small>{new Date(x.date).toLocaleString("pt-BR")}</small>
                </div>
              ))
            ) : (
              <p>
                Suas próximas exportações aparecerão aqui. Guarde os arquivos
                baixados em um lugar seguro.
              </p>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
