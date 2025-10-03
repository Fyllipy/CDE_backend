# Civil Engineering CDE Platform

Aplicação completa de Ambiente Comum de Dados (CDE) para projetos de engenharia civil, composta por API Node.js/Express e frontend React com TypeScript. O sistema cobre autenticação, gestão de projetos e membros, controle de arquivos com revisões versionadas e um quadro Kanban por projeto.

## Principais funcionalidades

- Registro, login e verificação de sessão usando JWT.
- Papéis de acesso por projeto (`MANAGER` e `MEMBER`).
- Gestão de projetos com padrão de nomenclatura configurável e administração de membros.
- Upload de arquivos com validação de nomenclatura, rastreamento de revisões (revA, revB…) e histórico com autor identificado.
- Download de qualquer revisão armazenada em disco.
- Quadro Kanban específico por projeto, com criação/remoção de colunas, cartões drag-and-drop e sincronização com o backend.

## Estrutura do repositório

```
backend/   # API Express + TypeScript
frontend/  # Aplicação React + Vite + TypeScript
```

### Requisitos

- Node.js 20+
- PostgreSQL 13+
- `psql` disponível no terminal para aplicar o schema

## Backend

```bash
cd backend
npm install
cp .env.example .env # configure variáveis
npm run build        # compila TypeScript
npm run dev          # inicia API em modo watch
```

O arquivo `db/schema.sql` contém todo o DDL necessário. Após ajustar o `.env`, execute:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Principais scripts:

- `npm run dev` – inicia a API com `ts-node-dev`.
- `npm run build` – transpila para `dist/`.
- `npm start` – roda a versão compilada.

A API expõe as rotas em `http://localhost:4000/api` por padrão. Arquivos são salvos em `UPLOAD_DIR` (default `uploads/`).

## Frontend

```bash
cd frontend
npm install
cp .env.example .env # defina VITE_API_BASE_URL
npm run dev          # inicia Vite no modo desenvolvimento
```

Scripts relevantes:

- `npm run dev` – inicia servidor Vite com HMR.
- `npm run build` – gera build de produção em `dist/`.
- `npm run preview` – serve build gerado.

O frontend espera que o backend esteja acessível no endereço configurado em `VITE_API_BASE_URL`.

## Fluxo de uso

1. Cadastre um usuário e autentique-se.
2. Crie um projeto, defina o padrão de nomenclatura (ex.: `{disciplina}-{tipo}-{sequencia}`).
3. Faça upload de arquivos; o sistema gera revisões automaticamente (`revA`, `revB`, ...).
4. Utilize o quadro Kanban para planejar tarefas por coluna, arrastando cartões conforme o andamento.
5. Gestores podem acessar `/projects/:projectId/settings` para atualizar o padrão e gerenciar membros.

## Testes rápidos

- **Verificar API**: `curl http://localhost:4000/health`
- **Compilar frontend**: `cd frontend && npm run build`

## Licença

Projeto entregue como artefato de referência – ajuste conforme a necessidade do seu ambiente.
