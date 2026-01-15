## Guia rápido: publicar em outra conta Vercel usando IDs/vars gravadas no repositório

### 1) Pré‑requisitos

- Acesso de escrita a este repositório GitHub.
- Conta Vercel nova (ou da qual você é membro) e token de acesso pessoal Vercel.
- Node 18+ (o projeto usa Vite + React) e bun ou npm/yarn para build local, se quiser testar.

### 2) Criar projeto na nova conta Vercel (via dashboard)

1. Entrar na conta Vercel destino.
2. Clique em **Add New… → Project → Import Git Repository**.
3. Conecte o GitHub, escolha **equilibriumagilelite** (ou o fork) e confirme import.
4. No passo de configuração, defina:
   - Framework: **Vite**.
   - Build command: `bun run build` (ou `npm run build` se preferir npm).
   - Output dir: `dist`.

### 3) Variáveis de ambiente necessárias

No Vercel, em **Project Settings → Environment Variables**, crie em **Production**, **Preview** e **Development** (clique em "Copy to…" após salvar):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Outras que você use (ex.: chaves de analytics, emails, etc.).

Para registrar no repo (opcional, para referência sem segredos), crie um `.env.example` (sem valores reais) ou atualize o existente. **Nunca** commitar segredos reais.

### 4) Guardar IDs importantes no repositório

Adicione no README ou neste doc os identificadores não sigilosos que facilitam suporte:

- `VERCEL_PROJECT_ID`: ID do projeto (não é segredo).
- `VERCEL_ORG_ID`: ID da organização/conta (não é segredo).

Exemplo de bloco para documentação interna (sem chaves privadas):

```
Vercel Org: <org_name> (VERCEL_ORG_ID=xxxxxxxx)
Vercel Project: equilibriumagilelite (VERCEL_PROJECT_ID=yyyyyyyy)
```

### 5) Permissões do GitHub → Vercel

- Garanta que a integração Vercel → GitHub está autorizada para o repo.
- Branch de produção: normalmente `main`. Ajuste em **Project Settings → Git**.

### 6) Build e deploy automáticos

- A cada push em `main`, Vercel faz deploy Production.
- A cada PR/branch, Vercel gera Preview.

### 6.1) Deploy via GitHub Actions (sem vincular GitHub à conta Vercel do cliente)

Quando a conta Vercel é do cliente e você não pode conectar seu GitHub diretamente, use token + IDs:

1. Na Vercel (conta do cliente): gere um **Access Token** em **Settings → Tokens**.
2. No projeto Vercel: copie **VERCEL_ORG_ID** e **VERCEL_PROJECT_ID** (Project Settings → General).
3. No repositório GitHub: Settings → Secrets and variables → Actions → New repository secret:

   - `VERCEL_TOKEN` = access token da Vercel.
   - `VERCEL_ORG_ID` = ID da org.
   - `VERCEL_PROJECT_ID` = ID do projeto.

4. Adicione um workflow, por exemplo `.github/workflows/vercel.yml`:

```yaml
name: Deploy Vercel

on:
   push:
      branches: [main]
   pull_request:
      branches: [main]

jobs:
   deploy:
      runs-on: ubuntu-latest
      steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
            with:
               node-version: 18
         - name: Install deps
            run: npm ci
         - name: Build app
            run: npm run build
         - name: Install Vercel CLI
            run: npm i -g vercel@latest
         - name: Pull env from Vercel
            run: vercel pull --yes --environment=${{ github.event_name == 'push' && 'production' || 'preview' }} --token=${{ secrets.VERCEL_TOKEN }}
            env:
               VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
               VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
         - name: Build (prebuilt output)
            run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
            env:
               VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
               VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
         - name: Deploy
            run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
            env:
               VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
               VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

Observações:

- Para PRs, o bloco `pull_request` gera um Preview; o comando `vercel deploy --prebuilt` detecta preview/production pelo `--prod` (mantenha ou troque por lógica condicional se quiser separar).
- Se preferir bun, troque `npm ci` por `bun install` e `npm run build` por `bun run build` (garanta que o runner tenha bun instalado antes, via `oven-sh/setup-bun`).
- Nunca commit secrets; apenas IDs podem constar em docs.

### 7) Teste local (opcional)

- Clone repo, crie `.env.local` com as chaves.
- `bun install` (ou `npm install`).
- `bun run dev` para checar.

### 8) Dúvidas rápidas / checklist

- Conectou GitHub certo? ✅
- Definiu `VERCEL_PROJECT_ID` e `VERCEL_ORG_ID` documentados? ✅ (sem segredos)
- Replicou variáveis para Preview/Development? ✅
- Branch de produção configurada? ✅

Pronto: com os IDs documentados e variáveis setadas, os deploys na nova conta Vercel ficam automatizados a partir do GitHub.
