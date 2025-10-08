# Civil Engineering CDE Platform

Aplica��o completa de Ambiente Comum de Dados (CDE) para projetos de engenharia civil, composta por API Node.js/Express e frontend React com TypeScript. O sistema cobre autentica��o, gest�o de projetos e membros, controle de arquivos com revis�es versionadas e um quadro Kanban por projeto.

## Principais funcionalidades

- Registro, login e verifica��o de sess�o usando JWT.
- Pap�is de acesso por projeto (`MANAGER` e `MEMBER`).
- Gest�o de projetos com padr�o de nomenclatura configur�vel e administra��o de membros.
- Upload de arquivos com valida��o de nomenclatura, rastreamento de revis�es (revA, revB�) e hist�rico com autor identificado.
- Download de qualquer revis�o armazenada em disco.
- Quadro Kanban espec�fico por projeto, com cria��o/remo��o de colunas, cart�es drag-and-drop e sincroniza��o com o backend.

## Estrutura do reposit�rio

```
backend/   # API Express + TypeScript
frontend/  # Aplica��o React + Vite + TypeScript
```

### Requisitos

- Node.js 20+
- PostgreSQL 13+
- `psql` dispon�vel no terminal para aplicar o schema

## Backend

```bash
cd backend
npm install
cp .env.example .env # configure vari�veis
npm run build        # compila TypeScript
npm run dev          # inicia API em modo watch
```

O arquivo `db/schema.sql` cont�m todo o DDL necess�rio. Ap�s ajustar o `.env`, execute:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Principais scripts:

- `npm run dev` � inicia a API com `ts-node-dev`.
- `npm run build` � transpila para `dist/`.
- `npm start` � roda a vers�o compilada.

A API exp�e as rotas em `http://localhost:4000/api` por padr�o. Arquivos s�o salvos em `UPLOAD_DIR` (default `uploads/`).

## Frontend

```bash
cd frontend
npm install
cp .env.example .env # defina VITE_API_BASE_URL
npm run dev          # inicia Vite no modo desenvolvimento
```

Scripts relevantes:

- `npm run dev` � inicia servidor Vite com HMR.
- `npm run build` � gera build de produ��o em `dist/`.
- `npm run preview` � serve build gerado.

O frontend espera que o backend esteja acess�vel no endere�o configurado em `VITE_API_BASE_URL`.

## Fluxo de uso

1. Cadastre um usu�rio e autentique-se.
2. Crie um projeto, defina o padr�o de nomenclatura (ex.: `{disciplina}-{tipo}-{sequencia}`).
3. Fa�a upload de arquivos; o sistema gera revis�es automaticamente (`revA`, `revB`, ...).
4. Utilize o quadro Kanban para planejar tarefas por coluna, arrastando cart�es conforme o andamento.
5. Gestores podem acessar `/projects/:projectId/settings` para atualizar o padr�o e gerenciar membros.

## Testes r�pidos

- **Verificar API**: `curl http://localhost:4000/health`
- **Compilar frontend**: `cd frontend && npm run build`

## Criar Superadmin
Terminal (PowerShell/Prompt) com curl

- **Iniciar admin (uma única vez)**:
`curl -X POST http://localhost:4000/api/auth/init-admin -H "Content-Type: application/json" -d "{\"email\":\"admin@seu.dominio\",\"password\":\"SENHA_FORTE\",\"name\":\"Admin\"}"`
- **Login**:
`curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@seu.dominio\",\"password\":\"SENHA_FORTE\"}"`
- **Verificar (usar o token retornado no login)**:
`curl http://localhost:4000/api/auth/me -H "Authorization: Bearer SEU_TOKEN"`

## Licen�a

Projeto entregue como artefato de refer�ncia � ajuste conforme a necessidade do seu ambiente.
