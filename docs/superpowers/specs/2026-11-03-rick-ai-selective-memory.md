# Rick IA — memória seletiva de longo prazo

## Objetivo

Separar histórico bruto de conversa de memórias úteis e duradouras da Rick IA. A memória seletiva deve melhorar respostas futuras sem transformar qualquer frase casual em informação permanente.

## Categorias permitidas

- `preference`: preferência estável.
- `goal`: objetivo/meta declarada.
- `decision`: decisão já tomada.
- `priority`: prioridade explícita.
- `routine`: rotina recorrente.
- `project`: informação duradoura de projeto explicitamente declarada.

## Extração

A extração é local e conservadora. Só cria candidato quando a mensagem contém linguagem explícita de preferência, objetivo, decisão, prioridade ou recorrência. Frases transitórias sem marcador duradouro são ignoradas.

Mensagens com dados sensíveis/segredos não são memorizadas automaticamente. Bloquear pelo menos credenciais/segredos e contexto médico/diagnóstico.

## Persistência

Tabela privada `public.rick_ai_memories` no Supabase, com RLS e acesso apenas do próprio admin autenticado. Memórias são deduplicadas por `owner_id + normalized_key`.

Campos principais:
- `id uuid`
- `owner_id uuid`
- `category text`
- `content text`
- `normalized_key text`
- `created_at timestamptz`
- `updated_at timestamptz`

## Uso no contexto

Carregar no máximo 20 memórias recentes/ativas e enviar apenas `category` + `content` em `snapshot.rickAiLongTermMemory`. A IA continua recebendo conversa recente separadamente.

## UX

- botão `Memórias` no cabeçalho da Rick IA;
- painel lista memórias com categoria e conteúdo;
- cada memória pode ser apagada explicitamente pelo usuário;
- quando uma nova memória for salva automaticamente, mostrar aviso curto no chat/notify;
- falha ao salvar memória nunca impede a resposta principal da IA.

## Segurança

- RLS habilitado;
- `anon` sem acesso;
- `authenticated` com grants mínimos da tabela, mas políticas exigem `owner_id = auth.uid()` e presença em `rick_dev_admins`;
- nenhuma chave privilegiada no frontend;
- exclusão de memória exige ação explícita do usuário.
