import React, { useEffect, useRef, useState,useContext,createContext } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  ArrowUpRight,
  Target,
} from "lucide-react";
import { validateRecord, editorRecord } from "./models.mjs";
export const ReadOnlyContext=React.createContext(false);
export const useReadOnly=()=>React.useContext(ReadOnlyContext);
export function Dialog({ title, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const el = ref.current;
    el?.querySelector("input,textarea,select,button")?.focus();
    function key(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const controls = [
          ...el.querySelectorAll("button,input,textarea,select,a[href]"),
        ].filter((x) => !x.disabled && x.offsetParent !== null);
        if (e.shiftKey && document.activeElement === controls[0]) {
          e.preventDefault();
          controls.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === controls.at(-1)) {
          e.preventDefault();
          controls[0]?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal feature-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className="panel-head">
          <h3>{title}</h3>
          <button className="icon" aria-label="Fechar janela" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export const Empty = ({
  icon: Icon = Target,
  title = "Seu próximo passo começa aqui.",
  text = "Adicione o primeiro registro para acompanhar sua evolução.",
}) => (
  <div className="empty">
    <Icon size={30} />
    <strong>{title}</strong>
    <span>{text}</span>
  </div>
);
export function Tabs({ value, onChange, items }) {
  return (
    <div className="tabs" role="tablist">
      {items.map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={value === id ? "selected" : ""}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
export function Stats({ items }) {
  return (
    <div className="stats">
      {items.map(([label, value, hint]) => (
        <div key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
          {hint && <p>{hint}</p>}
        </div>
      ))}
    </div>
  );
}
export function Progress({ value, label, detail }) {
  return (
    <div className="progress-block">
      <div>
        <span>{label}</span>
        <strong>{detail ?? Math.round(value) + "%"}</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        <i style={{ width: Math.min(100, Math.max(0, value)) + "%" }} />
      </div>
    </div>
  );
}
export function Fields({ fields, record = {} }) {
  return (
    <>
      {fields.map((f) => {
        const val = record[f.name] ?? f.default ?? "";
        return (
          <label
            key={f.name}
            className={
              f.type === "checkbox" ? "check-label" : f.wide ? "wide" : ""
            }
          >
            {f.type === "checkbox" ? (
              <>
                <input type="checkbox" name={f.name} defaultChecked={!!val} />
                {f.label}
              </>
            ) : (
              <>
                {f.label}
                {f.type === "select" ? (
                  <select
                    name={f.name}
                    defaultValue={val}
                    required={f.required}
                  >
                    {Object.entries(f.options).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    name={f.name}
                    defaultValue={val}
                    required={f.required}
                    maxLength={f.maxLength || 2000}
                    rows={f.rows || 4}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    name={f.name}
                    type={f.type || "text"}
                    defaultValue={val}
                    required={f.required}
                    maxLength={f.maxLength || 300}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    placeholder={f.placeholder}
                  />
                )}
              </>
            )}
          </label>
        );
      })}
    </>
  );
}
export function useCollection(
  kind,
  data,
  setData,
  notify,
  { fields, title = "Registro", defaults = {} },
) {
  const [editor, setEditor] = useState(null),
    [deleting, setDeleting] = useState(null),
    [error, setError] = useState("");
  function open(record = null) {
    setError("");
    if (record) {
      const r = { ...record };
      if ("priceCents" in r)
        r.price = (r.priceCents / 100).toFixed(2).replace(".", ",");
      if ("durationSeconds" in r) {
        r.hours = Math.floor(r.durationSeconds / 3600);
        r.minutes = Math.floor(r.durationSeconds / 60) % 60;
        r.seconds = r.durationSeconds % 60;
      }
      setEditor(r);
    } else setEditor({ ...defaults });
  }
  function save(e) {
    e.preventDefault();
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      for (const field of fields)
        if (field.type === "checkbox") f[field.name] = f[field.name] === "on";
      const record = editorRecord(kind, editor, f);
      const ok = setData((d) => ({
        ...d,
        [kind]: editor.id
          ? d[kind].map((x) => (x.id === editor.id ? record : x))
          : [...d[kind], record],
      }));
      if (ok === false) {
        setError("Não foi possível salvar. Confira o aviso do sistema.");
        return;
      }
      setEditor(null);
      notify("Registro salvo.");
    } catch (err) {
      setError(err.message);
    }
  }
  const ui = (
    <>
      {editor && (
        <Dialog
          title={(editor.id ? "Editar " : "Adicionar ") + title}
          onClose={() => setEditor(null)}
        >
          <form onSubmit={save} className="record-form">
            <Fields fields={fields} record={editor} />
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="actions wide">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditor(null)}
              >
                Cancelar
              </button>
              <button className="primary" type="submit">
                <Check size={15} /> Salvar registro
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {deleting && (
        <Dialog title="Excluir registro" onClose={() => setDeleting(null)}>
          <div className="settings-body">
            <p>
              Excluir “{deleting.title || deleting.activity || deleting.date}”?
              Esta ação remove o registro deste navegador.
            </p>
            <div className="actions">
              <button className="secondary" onClick={() => setDeleting(null)}>
                Cancelar
              </button>
              <button
                className="danger"
                onClick={() => {
                  setData((d) => ({
                    ...d,
                    [kind]: d[kind].filter((x) => x.id !== deleting.id),
                  }));
                  setDeleting(null);
                  notify("Registro excluído.");
                }}
              >
                Excluir registro
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
  return { open, remove: setDeleting, ui };
}
export function RowActions({ record, editor }) {
  const readOnly=useReadOnly();
  return (
    <div className="row-actions">
      <button
        className="icon"
        disabled={readOnly} title={readOnly?'Somente leitura':'Editar'}
        aria-label={
          "Editar " + (record.title || record.activity || record.date)
        }
        onClick={() => editor.open(record)}
      >
        <Pencil size={15} />
      </button>
      <button
        className="icon"
        disabled={readOnly} title={readOnly?'Somente leitura':'Excluir'}
        aria-label={
          "Excluir " + (record.title || record.activity || record.date)
        }
        onClick={() => editor.remove(record)}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
export function AddButton({ onClick, children }) {
  const readOnly=useReadOnly();
  return (
    <button className="text-button" onClick={onClick} disabled={readOnly} title={readOnly?'Entre como ADM para editar':undefined}>
      <Plus size={16} />
      {children}
    </button>
  );
}
export function ExternalLink({ url, children = "Abrir link" }) {
  return url ? (
    <a
      className="external-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={14} />
    </a>
  ) : null;
}
