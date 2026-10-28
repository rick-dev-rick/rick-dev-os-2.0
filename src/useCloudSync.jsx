import { useEffect, useRef, useState } from "react";
import { client, loadCloud } from "./cloud-client.mjs";
import {
  cloudPatch,
  applyPatchToBaseline,
  hasSharedChanges,
} from "./cloud-model.mjs";
import {
  writeOutbox,
  readOutbox,
  archiveOutbox,
  clearMatchingOutbox,
} from "./outbox.mjs";
export default function useCloudSync(data, session, setData) {
  const [recovery, setRecovery] = useState(() => {
    if (session.role !== "admin") return null;
    try {
      return readOutbox(localStorage);
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState(
      session.role === "guest" ? "readonly" : "saved",
    ),
    [error, setError] = useState("");
  const baseline = useRef(session.data),
    raw = useRef(session.raw),
    latest = useRef(data),
    busy = useRef(false),
    blocked = useRef(false),
    alive = useRef(true);
  latest.current = data;
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );
  async function flush() {
    if (session.role !== "admin" || busy.current || blocked.current || recovery)
      return;
    const snapshot = latest.current;
    let change;
    try {
      change = cloudPatch(baseline.current, snapshot, raw.current);
    } catch (e) {
      setError(e.message);
      setStatus("error");
      blocked.current = true;
      return;
    }
    if (!Object.keys(change.patch).length) {
      clearMatchingOutbox(localStorage, snapshot);
      setStatus("saved");
      return;
    }
    try {
      writeOutbox(localStorage, snapshot, baseline.current, raw.current);
    } catch (e) {
      setError(
        "Não foi possível preservar o rascunho local. Exporte suas alterações antes de fechar.",
      );
      setStatus("error");
      blocked.current = true;
      return;
    }
    busy.current = true;
    setStatus("saving");
    try {
      const { data: rows, error } = await client.rpc("rick_dev_patch_state", {
        p_expected: change.expected,
        p_patch: change.patch,
      });
      if (error || !rows?.length)
        throw Error(
          error?.code === "40001"
            ? "Seus dados mudaram em outra tela. Suas alterações locais estão preservadas. Recarregue os dados antes de continuar."
            : error?.message || "O banco não confirmou o salvamento.",
        );
      clearMatchingOutbox(localStorage, snapshot);
      baseline.current = snapshot;
      raw.current = applyPatchToBaseline(raw.current, change.patch);
      if (alive.current) {
        setError("");
        setStatus("saved");
      }
    } catch (e) {
      blocked.current = true;
      if (alive.current) {
        setError(e.message);
        setStatus("error");
      }
    } finally {
      busy.current = false;
      if (alive.current && !blocked.current && latest.current !== snapshot)
        flush();
    }
  }
  useEffect(() => {
    if (session.role !== "admin" || recovery || blocked.current) return;
    if (!hasSharedChanges(baseline.current, data) && !busy.current) return;
    try {
      writeOutbox(localStorage, data, baseline.current, raw.current);
    } catch {
      setError(
        "Não foi possível preservar o rascunho local. Exporte suas alterações antes de fechar.",
      );
      setStatus("error");
      blocked.current = true;
      return;
    }
    let changed;
    try {
      changed = cloudPatch(baseline.current, data, raw.current);
    } catch (e) {
      setError(e.message);
      setStatus("error");
      blocked.current = true;
      return;
    }
    if (!Object.keys(changed.patch).length) {
      if (!busy.current) {
        clearMatchingOutbox(localStorage, data);
        setStatus("saved");
      }
      return;
    }
    setStatus("pending");
    const t = setTimeout(flush, 650);
    return () => clearTimeout(t);
  }, [data, session.role, recovery]);
  async function reload() {
    try {
      if (busy.current) throw Error("Aguarde o salvamento terminar.");
      if (session.role === "admin")
        localStorage.setItem(
          "rick-os-v2-before-reload",
          JSON.stringify(latest.current),
        );
      if (session.role === "admin") archiveOutbox(localStorage);
      const next = await loadCloud();
      baseline.current = next.data;
      raw.current = next.raw;
      blocked.current = false;
      setData((d) => ({
        ...next.data,
        snippets: d.snippets,
        notes: d.notes,
        transactions: d.transactions,
        workouts: d.workouts,
      }));
      setError("");
      setStatus(session.role === "guest" ? "readonly" : "saved");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }
  function retry() {
    blocked.current = false;
    setError("");
    flush();
  }
  function acceptServer() {
    try {
      archiveOutbox(localStorage);
      setRecovery(null);
      blocked.current = false;
      setError("");
      setStatus("saved");
    } catch {
      setError(
        "Não foi possível arquivar o rascunho. Baixe uma cópia e libere espaço.",
      );
      setStatus("error");
    }
  }
  return { status, error, reload, retry, recovery, acceptServer };
}
