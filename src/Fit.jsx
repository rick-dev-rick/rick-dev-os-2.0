import React, { useState } from "react";
import { Dumbbell, Footprints, Activity } from "lucide-react";
import {
  today,
  runTypes,
  runPlaces,
  efforts,
  runningSummary,
  timeLabel,
} from "./models.mjs";
import {
  Tabs,
  Stats,
  Progress,
  Empty,
  useCollection,
  RowActions,
  AddButton,
} from "./components.jsx";
const runFields = [
  { name: "date", label: "Data", type: "date", required: true, max: today() },
  {
    name: "distanceKm",
    label: "Distância (km)",
    type: "number",
    min: 0.01,
    max: 500,
    step: 0.01,
    required: true,
  },
  { name: "hours", label: "Horas", type: "number", min: 0, max: 23 },
  { name: "minutes", label: "Minutos", type: "number", min: 0, max: 59 },
  { name: "seconds", label: "Segundos", type: "number", min: 0, max: 59 },
  { name: "type", label: "Atividade", type: "select", options: runTypes },
  {
    name: "place",
    label: "Local do treino",
    type: "select",
    options: runPlaces,
  },
  {
    name: "effort",
    label: "Como foi para você?",
    type: "select",
    options: efforts,
  },
  {
    name: "note",
    label: "Observação",
    type: "textarea",
    maxLength: 300,
    wide: true,
  },
];
const bodyFields = [
  { name: "date", label: "Data", type: "date", required: true, max: today() },
  {
    name: "weight",
    label: "Peso em kg (opcional)",
    type: "number",
    min: 1,
    max: 500,
    step: 0.1,
  },
  {
    name: "activity",
    label: "Atividade",
    type: "select",
    options: {
      Musculação: "Musculação",
      Cardio: "Cardio",
      "Treino funcional": "Treino funcional",
      Outro: "Outro",
      Descanso: "Descanso",
    },
  },
  {
    name: "note",
    label: "Observação",
    type: "textarea",
    maxLength: 300,
    wide: true,
  },
];
export default function Fit({ data, setData, notify, workouts }) {
  const [tab, setTab] = useState("body"),
    [month, setMonth] = useState(today().slice(0, 7));
  const run = useCollection("runs", data, setData, notify, {
    fields: runFields,
    title: "atividade",
    defaults: {
      date: today(),
      type: "run",
      place: "street",
      effort: "moderate",
    },
  });
  const body = useCollection("body", data, setData, notify, {
    fields: bodyFields,
    title: "progresso corporal",
    defaults: { date: today(), activity: "Musculação" },
  });
  const goal = data.runningGoals[month] || 0,
    s = runningSummary(data.runs, month, goal);
  const weights = data.body
    .filter((x) => x.weight !== null)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const latest = weights.at(-1)?.weight;
  const change =
    weights.length > 1
      ? Math.round((latest - weights[0].weight) * 10) / 10
      : null;
  return (
    <>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          ["body", "Evolução corporal"],
          ["runs", "Diário de corrida"],
          ["workouts", "Treinos planejados"],
        ]}
      />
      {tab === "workouts" ? (
        workouts
      ) : tab === "body" ? (
        <>
          <Stats
            items={[
              ["PESO MAIS RECENTE", latest ? latest + " kg" : "—"],
              [
                "VARIAÇÃO REGISTRADA",
                change === null
                  ? "—"
                  : (change > 0 ? "+" : "") + change + " kg",
              ],
              ["TREINOS REGISTRADOS", data.body.length],
            ]}
          />
          <section className="panel">
            <div className="panel-head">
              <h3>
                <Activity size={17} /> MINHA EVOLUÇÃO CORPORAL
              </h3>
              <AddButton onClick={() => body.open()}>
                Registrar progresso
              </AddButton>
            </div>
            {!data.body.length ? (
              <Empty
                icon={Dumbbell}
                title="Constância, um treino por vez."
                text="Registre sua atividade, peso e como foi o seu treino."
              />
            ) : (
              <>
                <div className="weight-trend">
                  <small>EVOLUÇÃO DO PESO · HISTÓRICO REGISTRADO</small>
                  <div>
                    {weights.slice(-16).map((x) => (
                      <div key={x.id} className="weight-point">
                        <span
                          style={{
                            height:
                              30 +
                              Math.max(
                                0,
                                x.weight -
                                  Math.min(...weights.map((w) => w.weight)),
                              ) *
                                5 +
                              "px",
                          }}
                        />
                        <strong>{x.weight}</strong>
                        <small>
                          {x.date.slice(5).split("-").reverse().join("/")}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
                {data.body
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((x) => (
                    <div className="record-row" key={x.id}>
                      <div className="record-symbol">
                        <Dumbbell size={18} />
                      </div>
                      <div className="record-copy">
                        <strong>{x.activity}</strong>
                        <small>
                          {x.date.split("-").reverse().join("/")}{" "}
                          {x.note && "· " + x.note}
                        </small>
                      </div>
                      <span className="record-value">
                        {x.weight ? x.weight + " kg" : "—"}
                      </span>
                      <RowActions record={x} editor={body} />
                    </div>
                  ))}
              </>
            )}
          </section>
        </>
      ) : (
        <>
          <div className="section-toolbar month-toolbar">
            <div>
              <span className="eyebrow">DISTÂNCIA, TEMPO E CONSISTÊNCIA</span>
              <h2>Seu diário de corrida</h2>
            </div>
            <label>
              Mês de acompanhamento
              <input
                type="month"
                value={month}
                onChange={(e) => {
                  if (e.target.value) setMonth(e.target.value);
                }}
              />
            </label>
          </div>
          <Stats
            items={[
              ["DISTÂNCIA REGISTRADA", s.distanceKm + " km"],
              ["ATIVIDADES", s.entries.length],
              [
                "RITMO MÉDIO",
                s.paceSeconds === null
                  ? "—"
                  : timeLabel(s.paceSeconds) + " /km",
              ],
            ]}
          />
          <section className="panel goal-panel">
            <div>
              <h3>Sua meta de distância</h3>
              <p>
                {goal
                  ? `${s.distanceKm} de ${goal} km neste mês`
                  : "Defina uma meta que faça sentido para você."}
              </p>
              <Progress value={s.percent} label="Meta mensal" />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(new FormData(e.currentTarget).get("goal"));
                if (!Number.isFinite(n) || n < 0 || n > 10000) return;
                setData((d) => ({
                  ...d,
                  runningGoals: { ...d.runningGoals, [month]: n },
                }));
                notify(n ? "Meta mensal salva." : "Meta removida.");
              }}
              key={month + "-" + goal}
            >
              <label>
                Meta do mês (km)
                <input
                  name="goal"
                  type="number"
                  defaultValue={goal || ""}
                  min="0"
                  max="10000"
                  step="0.01"
                  placeholder="Ex.: 30"
                  required
                />
              </label>
              <button className="primary">Salvar meta</button>
              <small>Use zero para remover a meta.</small>
            </form>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h3>
                <Footprints size={17} /> HISTÓRICO DO MÊS
              </h3>
              <AddButton onClick={() => run.open()}>
                Registrar atividade
              </AddButton>
            </div>
            <div className="subhead">
              <span>Tempo total: {timeLabel(s.durationSeconds)}</span>
              <span>Ritmo = tempo total ÷ distância total</span>
            </div>
            {!s.entries.length ? (
              <Empty
                icon={Footprints}
                title="Seu primeiro quilômetro começa aqui."
                text="Registre corridas, caminhadas ou atividades alternadas."
              />
            ) : (
              s.entries.map((x) => (
                <div className="record-row" key={x.id}>
                  <div className="record-symbol">
                    <Footprints size={18} />
                  </div>
                  <div className="record-copy">
                    <strong>
                      {runTypes[x.type]} · {x.distanceKm} km
                    </strong>
                    <small>
                      {x.date.split("-").reverse().join("/")} ·{" "}
                      {runPlaces[x.place]} · {efforts[x.effort]}
                    </small>
                    {x.note && <p>{x.note}</p>}
                  </div>
                  <div className="run-numbers">
                    <strong>{timeLabel(x.durationSeconds)}</strong>
                    <small>
                      {timeLabel(x.durationSeconds / x.distanceKm)} /km
                    </small>
                  </div>
                  <RowActions record={x} editor={run} />
                </div>
              ))
            )}
          </section>
        </>
      )}
      {body.ui}
      {run.ui}
    </>
  );
}
