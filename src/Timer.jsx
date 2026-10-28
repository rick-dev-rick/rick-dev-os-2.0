import React, { useState } from "react";
import { Play, Pause, RotateCcw, TimerReset } from "lucide-react";
import { useReadOnly } from "./components.jsx";
import { focusDuration } from "./dashboard.mjs";
export default function Timer({
  seconds,
  setSeconds,
  running,
  setRunning,
  duration,
  setDuration,
  data,
  setData,
}) {
  const [error, setError] = useState("");
  const readOnly = useReadOnly();
  function define(n) {
    setDuration(n / 60);
    setSeconds(n);
    setRunning(false);
    if (data && !readOnly) setData((d) => ({ ...d, focusSeconds: n }));
    setError("");
  }
  return (
    <section className="panel focus">
      <div className="panel-head">
        <h3>
          <TimerReset size={16} /> SUA SESSÃO DE FOCO
        </h3>
        <span className="tiny">
          {running ? "EM ANDAMENTO" : "NO SEU RITMO"}
        </span>
      </div>
      <div className="timer-orbit">
        <div className="timer">
          <span>
            {seconds >= 3600
              ? String(Math.floor(seconds / 3600)).padStart(2, "0") + ":"
              : ""}
            {String(Math.floor(seconds / 60) % 60).padStart(2, "0")}
            <i>:</i>
            {String(seconds % 60).padStart(2, "0")}
          </span>
          <small>
            {running
              ? "UMA COISA DE CADA VEZ"
              : "ESPAÇO PARA O SEU PRÓXIMO PASSO"}
          </small>
        </div>
      </div>
      <div className="timer-controls">
        <button
          className="primary"
          onClick={() => {
            if (seconds === 0) setSeconds(Math.round(duration * 60));
            setRunning(!running);
          }}
        >
          {running ? <Pause size={15} /> : <Play size={15} />}{" "}
          {running ? "Pausar sessão" : "Começar a focar"}
        </button>
        <button
          className="secondary icon"
          aria-label="Reiniciar timer"
          onClick={() => {
            setRunning(false);
            setSeconds(Math.round(duration * 60));
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="timer-modes">
        {[25, 50, 5].map((n) => (
          <button
            key={n}
            className={duration === n ? "selected" : ""}
            onClick={() => define(n * 60)}
          >
            {n === 5 ? "Pausa curta" : n + " min"}
          </button>
        ))}
      </div>
      <form
        key={duration}
        className="precise-timer"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            define(focusDuration(
              Object.fromEntries(new FormData(e.currentTarget)),
            ));
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <div>
          <label>
            Horas
            <input
              name="hours"
              type="number"
              min="0"
              max="24"
              defaultValue={Math.floor((duration * 60) / 3600)}
            />
          </label>
          <label>
            Minutos
            <input
              name="minutes"
              type="number"
              min="0"
              max="59"
              defaultValue={Math.floor((duration * 60) / 60) % 60}
            />
          </label>
          <label>
            Segundos
            <input
              name="seconds"
              type="number"
              min="0"
              max="59"
              defaultValue={Math.round(duration * 60) % 60}
            />
          </label>
        </div>
        <button type="submit" className="text-button">
          Definir meu tempo <TimerReset size={13} />
        </button>
        {error && (
          <small className="form-error" role="alert">
            {error}
          </small>
        )}
      </form>
    </section>
  );
}
