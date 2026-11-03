const modules = {
  home: {
    id: 'home',
    label: 'RICK_HOME',
    focus: 'visão geral, prioridades abertas, progresso geral e foco',
    priorities: ['tarefas abertas', 'progresso geral', 'sessões de foco'],
    suggestions: [
      'O que merece mais atenção agora?',
      'Tem alguma prioridade esquecida no OS?',
      'Como está meu progresso geral?',
    ],
  },
  study: {
    id: 'study',
    label: 'RICK_STUDY',
    focus: 'estudos, tópicos, recursos e progresso de aprendizagem',
    priorities: ['tarefas de estudo', 'tópicos pendentes', 'recursos salvos'],
    suggestions: [
      'Qual estudo eu deveria priorizar agora?',
      'O que está mais avançado nos meus estudos?',
      'Tem algum tópico que eu estou deixando pra trás?',
    ],
  },
  fit: {
    id: 'fit',
    label: 'RICK_FIT',
    focus: 'corridas, evolução corporal, treinos e metas físicas',
    priorities: ['corridas recentes', 'evolução corporal', 'treinos e metas'],
    suggestions: [
      'Como está minha evolução nas corridas?',
      'O que meus dados de treino mostram?',
      'Qual é o próximo passo mais sensato no Fit?',
    ],
  },
  finance: {
    id: 'finance',
    label: 'RICK_FINANCE',
    focus: 'saldo, movimentações, compras planejadas e prioridades financeiras',
    priorities: ['saldo atual', 'transações recentes', 'compras planejadas'],
    suggestions: [
      'Como está minha situação financeira agora?',
      'Tem algum gasto que merece atenção?',
      'O que posso priorizar sem apertar meu orçamento?',
    ],
  },
  lab: {
    id: 'lab',
    label: 'RICK_LAB',
    focus: 'projetos, evolução técnica, snippets e materiais do laboratório',
    priorities: ['projetos ativos', 'evolução técnica', 'snippets e materiais'],
    suggestions: [
      'Qual projeto merece foco agora?',
      'O que mostra minha evolução técnica recente?',
      'Tem algum projeto parado que vale retomar?',
    ],
  },
  system: {
    id: 'system',
    label: 'RICK_SYSTEM',
    focus: 'backups, diagnósticos e manutenção do sistema',
    priorities: ['backups', 'diagnósticos', 'manutenção do OS'],
    suggestions: [
      'Tem alguma manutenção atrasada?',
      'Como está a saúde do meu sistema?',
      'O que eu deveria revisar no System agora?',
    ],
  },
};

export function getRickAiModule(page = 'home') {
  return modules[page] || modules.home;
}

export function getRickAiSuggestions(page = 'home') {
  return [...getRickAiModule(page).suggestions].slice(0, 3);
}
