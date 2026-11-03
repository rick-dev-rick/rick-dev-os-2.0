import { balance } from '../data.mjs';
import { getRickAiModule } from './modules.mjs';

const take = (rows, count = 20) => Array.isArray(rows) ? rows.slice(-count) : [];

export function buildRickAiSnapshot(data, page = 'home') {
  const activeModule = getRickAiModule(page);
  const tasks = take(data.tasks).map(({ id, title, description, tag, module, progress, done }) => ({
    id, title, description, tag, module, progress, done,
  }));
  const projects = take(data.projects).map(({ id, title, description, tech, url, status }) => ({
    id, title, description, tech, url, status,
  }));
  const transactions = take(data.transactions, 30).map(({ id, title, amount, type, date }) => ({
    id, title, amount, type, date,
  }));

  return {
    page: activeModule.id,
    activeModule: {
      id: activeModule.id,
      label: activeModule.label,
      focus: activeModule.focus,
      priorities: activeModule.priorities,
    },
    profile: {
      name: data.name || 'Rick',
      focusCount: Number(data.focusCount || 0),
      focusSeconds: Number(data.focusSeconds || 1500),
    },
    home: {
      tasks: tasks.filter((task) => task.module === 'home'),
      completedTasks: tasks.filter((task) => task.done).length,
    },
    study: {
      tasks: tasks.filter((task) => task.module === 'study'),
      topics: take(data.topics).map(({ id, title, done }) => ({ id, title, done })),
      resources: take(data.resources).map(({ id, title, type, url, category }) => ({ id, title, type, url, category })),
    },
    fit: {
      runs: take(data.runs, 20).map(({ id, date, distanceKm, durationSeconds, type, place, effort, note }) => ({
        id, date, distanceKm, durationSeconds, type, place, effort, note,
      })),
      body: take(data.body, 20).map(({ id, date, weight, activity, note }) => ({ id, date, weight, activity, note })),
      workouts: take(data.workouts, 20).map(({ id, title, done }) => ({ id, title, done })),
      runningGoals: { ...(data.runningGoals || {}) },
    },
    finance: {
      balance: balance(transactions),
      transactions,
      pc: take(data.pc).map(({ id, title, model, url, priceCents, purchased }) => ({ id, title, model, url, priceCents, purchased })),
      style: take(data.style).map(({ id, title, model, url, priceCents, purchased, category }) => ({ id, title, model, url, priceCents, purchased, category })),
    },
    lab: {
      projects,
      evolution: take(data.evolution).map(({ id, title, description, module, status }) => ({ id, title, description, module, status })),
      media: take(data.media).map(({ id, title, url }) => ({ id, title, url })),
      snippetSummary: Array.isArray(data.snippets)
        ? data.snippets.slice(-20).map(({ id, title, language, category, favorite }) => ({ id, title, language, category, favorite }))
        : [],
    },
    system: {
      backupDays: [...(data.systemProgress?.backupDays || [])].slice(-30),
      diagnosticDays: [...(data.systemProgress?.diagnosticDays || [])].slice(-30),
    },
  };
}
