import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LockKeyhole,
  CloudDownload,
  LogOut,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { fromLegacyData } from "./legacy.mjs";
import { Dialog } from "./components.jsx";
import { saveFile } from "./models.mjs";
// Configuração publicável já presente no repositório 1.0; autorização efetiva usa RLS.
const client = createClient(
  "https://igegubykvwmpxcfduxnz.supabase.co",
  "sb_publishable_tHx4hGOgGOg4SpcEn7f-LQ_H5fG1Fcw",
  { auth: { storageKey: "rick-os-2-supabase-auth" } },
);
export default function Access({
  data,
  setData,
  notify,
  role,
  setRole,
  onClose,
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(null);
  async function readCloud() {
    const { data: row, error } = await client
      .from("rick_dev_state")
      .select("data")
      .eq("id", 1)
      .maybeSingle();
    if (error || !row)
      throw Error(
        "Não consegui ler os dados do 1.0. Confira a conexão e as permissões do Supabase.",
      );
    return fromLegacyData(row.data || {});
  }
  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      const { error } = await client.auth.signInWithPassword({
        email: f.get("email"),
        password: f.get("password"),
      });
      if (error)
        throw Error("Não foi possível entrar. Confira o e-mail e a senha.");
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();
      if (authError || !user)
        throw Error("Não foi possível validar esta sessão.");
      const { data: permission, error: permissionError } = await client
        .from("rick_dev_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (permissionError || !permission) {
        await client.auth.signOut();
        throw Error("Esta conta não tem permissão de ADM no RICK_DEV OS.");
      }
      setRole("admin");
      setPreview(await readCloud());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function guest() {
    setBusy(true);
    setError("");
    try {
      await client.auth.signOut();
      const d = await readCloud();
      setRole("guest");
      setData(d, true);
      notify("Dados do 1.0 carregados em modo somente leitura.");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title="Acesso ao seu universo" onClose={onClose}>
      <div className="access-intro">
        <LockKeyhole size={25} />
        <h2>Seu laboratório de volta.</h2>
        <p>
          Use a conta ADM existente para trazer os dados do 1.0 ou explore como
          convidado.
        </p>
      </div>
      {role === "guest" ? (
        <div className="settings-body">
          <p>Você está em modo somente leitura.</p>
          <button
            className="secondary"
            onClick={() => {
              onClose();
              location.reload();
            }}
          >
            Voltar ao espaço local
          </button>
        </div>
      ) : preview ? (
        <div className="settings-body">
          <div className="import-preview">
            <ShieldCheck size={22} />
            <h3>Dados encontrados no Supabase</h3>
            <p>
              {preview.tasks.length} missões ·{" "}
              {preview.pc.length + preview.style.length} itens de compra ·{" "}
              {preview.runs.length} atividades · {preview.projects.length}{" "}
              projetos
            </p>
          </div>
          <p>
            A importação substitui os dados locais do 2.0. O banco e o site 1.0
            continuam intactos.
          </p>
          <button
            className="secondary"
            onClick={() => saveFile(data, "RICK_DEV_antes_da_importacao.json")}
          >
            Exportar cópia dos dados locais
          </button>
          <button
            className="primary"
            onClick={() => {
              try {
                localStorage.setItem(
                  "rick-os-v2-before-import",
                  JSON.stringify(data),
                );
                setData(preview);
                notify(
                  "Dados do 1.0 importados. Uma cópia local anterior foi preservada.",
                );
                onClose();
              } catch {
                setError(
                  "Não foi possível criar a cópia preventiva. Exporte o backup e libere espaço antes de importar.",
                );
              }
            }}
          >
            <CloudDownload size={16} /> Importar dados do 1.0
          </button>
        </div>
      ) : (
        <>
          <form className="record-form access-form" onSubmit={login}>
            <label>
              E-mail do ADM
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? "Conectando..." : "Entrar como ADM"}
            </button>
          </form>
          <div className="access-guest">
            <button className="secondary" onClick={guest} disabled={busy}>
              <Eye size={16} /> Explorar como convidado
            </button>
          </div>
        </>
      )}
      {error && (
        <p className="form-error access-error" role="alert">
          {error}
        </p>
      )}
      <div className="access-note">
        O 2.0 salva alterações neste navegador. A conexão acima importa os dados
        existentes; a sincronização de alterações do 2.0 ainda não está ativa.
      </div>
    </Dialog>
  );
}
