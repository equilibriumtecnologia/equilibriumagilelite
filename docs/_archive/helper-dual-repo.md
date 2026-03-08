# Colinha de Fluxos (Vercel sem upgrade / conta dona faz merge)

## Regras

- **MattCorlleone**: você desenvolve normal e publica no repo Matt (não tem time/limite).
- **Equilibrium**: deploy só acontece quando a **conta dona** mexe na `main`.

## Fluxo diário (Matt)

1. Trabalhar no repo do Matt:

```bash
git checkout main
git pull
# codar...
git add .
git commit -m "feat: ..."
git push origin main
```

## Fluxo de release (Equilibrium)

1. Atualizar `dev` no repo Equilibrium (push seu mesmo, se permitido):

```bash
git push equilibrium dev
```

2. **Deploy:** abrir PR `dev → main` no GitHub do Equilibrium e **mergear logado na conta equilibriumtecnologia**.

---

# Setup dos remotes pro projeto `equilibriumsite`

Você quer:

- `origin` = Matt (repo principal)
- `equilibrium` = Equilibrium (repo espelho)
- Push nos dois.

⚠️ Importante: **não use `git@github.com:` direto** se você já está com aliases (pra não misturar chaves).
Vou te passar os 2 jeitos:

### ✅ Jeito recomendado (com aliases)

- Matt: `git@github-matt:...`
- Equilibrium: `git@github-equilibrium:...`

### Jeito “puro” (github.com direto)

Só use se você **não configurou aliases** (mas você já configurou, então recomendo o de cima).

---

## 1) Entrar na pasta do projeto

```bash
cd D:\Projetos\saas\equilibriumsite
```

Se ainda não tiver git iniciado:

```bash
git init
```

---

## 2) Configurar remotes

### `origin` (Matt)

```bash
git remote add origin git@github-matt:MattCorlleone/equilibriumsite.git
```

### `equilibrium` (Equilibrium)

```bash
git remote add equilibrium git@github-equilibrium:equilibriumtecnologia/equilibriumsite.git
```

Conferir:

```bash
git remote -v
```

---

## 3) Subir como `main` nos dois (repos crus)

Garantir que você está na main:

```bash
git branch -M main
```

Primeiro commit (se ainda não existe):

```bash
git add .
git commit -m "chore: initial commit"
```

Subir pro Matt:

```bash
git push -u origin main
```

Subir pro Equilibrium:

```bash
git push -u equilibrium main
```

✅ Pronto: os dois repos deixam de estar “crus”.

---

# Branches: Matt só `main`, Equilibrium com `dev`

## 4) Criar `dev` (somente para o repo Equilibrium)

Você vai criar localmente e subir só pro Equilibrium:

```bash
git checkout -b dev
git push -u equilibrium dev
```

Agora volta pra main (porque no Matt você quer sempre trabalhar em main):

```bash
git checkout main
```

> Daqui pra frente:

- Você continua trabalhando no Matt **em main**
- Quando quiser mandar pro Equilibrium, você joga seu código para `dev` e a conta dona mergeia.

---

# Como mandar suas mudanças do Matt para o Equilibrium `dev` (rápido)

Quando você tiver novidades no `main` do Matt e quiser refletir no Equilibrium:

```bash
git checkout main
git pull origin main
git push equilibrium main
```

E pra atualizar `dev` do Equilibrium com o que está no seu `main` (sem mudar sua forma de trabalho):

```bash
git push equilibrium main:dev
```

✅ Esse comando é o ouro: pega sua `main` local e atualiza a `dev` lá no Equilibrium.

---

# Checklist rápido (pra salvar)

### Push normal (Matt)

```bash
git push origin main
```

### Atualizar `main` do Equilibrium (se quiser espelhar)

```bash
git push equilibrium main
```

### Atualizar `dev` do Equilibrium com sua `main` (recomendado pro fluxo Vercel)

```bash
git push equilibrium main:dev
```

### Deploy (Equilibrium)

- PR `dev → main`
- Merge logado como `equilibriumtecnologia`
