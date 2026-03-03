
# Melhorias PWA: Push Notifications + Pagina de Instalacao

## Status: ✅ IMPLEMENTADO

Todas as fases foram implementadas:

1. ✅ Tabela `push_subscriptions` com RLS
2. ✅ Secrets VAPID configurados
3. ✅ Service Worker com push handlers (`src/sw.ts`)
4. ✅ Hook `useInstallPrompt` para capturar beforeinstallprompt
5. ✅ Hook `usePushSubscription` para gerenciar subscriptions
6. ✅ Página `/install` com instruções por plataforma
7. ✅ Banner de instalação no `AppLayout`
8. ✅ Edge Function `send-push-notification` standalone
9. ✅ Push integrado no `send-task-notification` (email + push juntos)
10. ✅ Toggle de push notifications em Settings > Notificações
11. ✅ `vite.config.ts` migrado para `injectManifest`
12. ✅ Registro do SW em `main.tsx`
