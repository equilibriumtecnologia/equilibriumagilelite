

# Plano: Notificacoes Automaticas para Tarefas Proximas ao Vencimento e Vencidas

## Diagnostico Atual

### O que funciona hoje
- **Tarefa atribuida**: Quando um usuario atribui uma tarefa a outro, o frontend chama a edge function `send-task-notification` e envia e-mail.
- **Status alterado**: Quando um usuario muda o status de uma tarefa atribuida a outra pessoa, o e-mail e enviado.

### Problemas identificados
1. **Sem notificacoes de vencimento**: Nao existe nenhum mecanismo para alertar sobre tarefas proximas ao vencimento ou ja vencidas.
2. **Depende de usuario online**: Todas as notificacoes sao disparadas pelo frontend -- se ninguem esta usando o sistema, nada acontece.
3. **Autenticacao bloqueante**: A edge function atual exige JWT de usuario e usa a RPC `get_user_email_for_notification` que valida `shares_project_with`. Um job automatico nao tem usuario autenticado, entao precisa de uma abordagem diferente.

## Solucao Proposta

Criar uma nova edge function `check-due-tasks` que roda automaticamente via cron (pg_cron + pg_net), sem depender de nenhum usuario logado.

```text
pg_cron (a cada hora)
    |
    v
pg_net --> HTTP POST --> Edge Function: check-due-tasks
    |
    v
Consulta tarefas com due_date proximo/vencido
    |
    v
Busca e-mail do responsavel (via service_role)
    |
    v
Envia e-mail via Resend
    |
    v
Registra notificacao enviada (evita duplicatas)
```

## Mudancas no Banco de Dados

### 1. Nova tabela `task_notification_log`
Evita enviar a mesma notificacao repetidamente:

- `id` UUID PK
- `task_id` UUID FK tasks(id) ON DELETE CASCADE
- `user_id` UUID (destinatario)
- `notification_type` TEXT (due_soon, overdue)
- `sent_at` TIMESTAMPTZ DEFAULT now()
- UNIQUE(task_id, user_id, notification_type)

### 2. Habilitar extensoes pg_cron e pg_net
Necessarias para agendar a chamada HTTP automatica.

### 3. Criar cron job
Agendar execucao a cada hora, chamando a edge function com o service role key (sem JWT de usuario).

### 4. RLS na tabela `task_notification_log`
Apenas o service role precisa acessar esta tabela. RLS habilitado sem policies publicas (acesso somente via service role).

## Nova Edge Function: `check-due-tasks`

### Logica principal
1. Autenticar via service role key (enviado pelo cron job no header)
2. Buscar tarefas com `due_date` definido e `status != 'completed'` e `assigned_to IS NOT NULL`
3. Para cada tarefa:
   - **Proxima ao vencimento** (due_date = amanha): verificar se ja enviou notificacao `due_soon` -> se nao, enviar e registrar
   - **Vencida** (due_date < hoje): verificar se ja enviou notificacao `overdue` -> se nao, enviar e registrar
4. Buscar e-mail diretamente de `auth.users` usando client com service role (sem precisar da RPC que exige caller)
5. Enviar e-mail via Resend com template adequado

### Tipos de notificacao adicionados
- `due_soon`: "Sua tarefa X vence amanha"
- `overdue`: "Sua tarefa X esta vencida desde DD/MM"

### Seguranca
- A funcao valida que o request vem com o service role key
- Nao aceita chamadas sem autorizacao
- `verify_jwt = false` no config.toml (validacao manual do service role)

## Ajuste na Edge Function Existente

A funcao `send-task-notification` atual usa `supabase.auth.getClaims()` que pode nao estar disponivel em todas as versoes do SDK. Sera ajustada para usar `supabase.auth.getUser()` como metodo mais confiavel de validacao do JWT.

## Mudancas no Frontend

### Nenhuma mudanca obrigatoria
As notificacoes de vencimento sao 100% automaticas (cron). O frontend continua enviando notificacoes de atribuicao e mudanca de status como ja faz.

## Resumo dos arquivos

### Novos
- `supabase/functions/check-due-tasks/index.ts` -- edge function do cron
- Migracao SQL (tabela + cron job + extensoes)

### Alterados
- `supabase/config.toml` -- adicionar entrada `[functions.check-due-tasks]`
- `supabase/functions/send-task-notification/index.ts` -- corrigir metodo de validacao JWT

## Detalhes tecnicos do cron

O cron sera configurado para rodar **a cada hora** com a seguinte query SQL (via pg_cron + pg_net):

```text
Frequencia: 0 * * * * (a cada hora, minuto 0)
Destino: POST https://<project-ref>.supabase.co/functions/v1/check-due-tasks
Headers: Authorization: Bearer <SERVICE_ROLE_KEY>
```

Isso garante que mesmo sem nenhum usuario no sistema, as notificacoes de vencimento serao enviadas automaticamente.

