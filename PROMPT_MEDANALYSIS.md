# Prompt — Implementação do Sistema MedAnalysis

## Contexto do Projeto

**MedAnalysis** é um sistema web (API REST + Frontend) voltado para gerenciadoras de convênios e planos de saúde. Seu objetivo é reduzir o custo operacional e otimizar o tempo de auditoria e decisões de liberação de exames e procedimentos médicos, oferecendo uma interface simples e intuitiva.

O sistema serve um modelo de Machine Learning previamente treinado, realizando predições de forma **assíncrona**.

---

## Regra de Comunicação

> **Se durante a implementação houver qualquer ambiguidade, informação faltante, conflito entre arquivos de referência, ou decisão de design/arquitetura que não esteja explicitamente definida neste prompt, PARE e pergunte ao usuário antes de continuar.** Não assuma. Não improvise silenciosamente. Pergunte.
>
> Exemplos de quando perguntar:
> - Um campo do `MODEL_INPUT_SCHEMA.md` não tem correspondência clara com os wireframes
> - O `CLAUDE.md` define um pré-processamento ambíguo ou incompleto
> - Uma tela do wireframe sugere comportamento não descrito neste prompt
> - Qualquer decisão que tenha mais de uma interpretação razoável

---

## Arquivos de Referência (leia TODOS antes de implementar)

| Arquivo | Descrição | Uso |
|---|---|---|
| `./CLAUDE.md` | **Leitura obrigatória.** Documentação técnica do dataset, pré-processamento, treinamento e instruções para servir o modelo (colunas, pipeline, encoders). | Base para toda a lógica de predição no backend. |
| `./MODEL_INPUT_SCHEMA.md` | Exemplo de payload de entrada e schema de saída esperado do modelo. | Definição dos endpoints de predição, validação de dados e campos do formulário. |
| `./ai/models/best_model.pkl` | Modelo treinado serializado. | Carregado pelo backend na inicialização para realizar predições. |
| `./datasets/output/diagnosis_codes.csv` | Códigos de diagnóstico: código, nome e categoria. | Seed do banco + alimentar catálogos e selects/autocomplete no frontend. |
| `./datasets/output/procedure_codes.csv` | Códigos de procedimento: código, nome e categoria. | Seed do banco + alimentar catálogos e selects/autocomplete no frontend. |

---

## Wireframes do Frontend

As telas de referência estão em `./frontend/ui-figma/`. Use cada imagem como guia visual para layout, componentes e fluxo. O design final deve ser fiel ao wireframe, mas com liberdade para ajustes de polimento visual (cores, espaçamentos, ícones) para que o sistema fique funcional e esteticamente coeso.

| Wireframe | Tela | Descrição |
|---|---|---|
| `login.png` | **01 — Login** | Tela de autenticação com e-mail e senha. |
| `nova-avaliacao-dados-paciente.png` | **02a — Nova Avaliação (Passo 1)** | Primeiro passo do formulário: dados do paciente. |
| `nova-avaliacao-dados-medicos.png` | **02b — Nova Avaliação (Passo 2)** | Segundo passo do formulário: dados médicos (diagnóstico, procedimento, etc). |
| `avaliacao-resultado-exemplo.png` | **02c — Resultado da Avaliação** | Exibição do resultado após a predição ser concluída. |
| `historico-avaliacoes.png` | **03 — Histórico** | Listagem de todas as avaliações realizadas. |
| *(sem wireframe)* | **04 — Usuários** | CRUD de usuários. **Não há wireframe para esta tela — crie seguindo o mesmo padrão visual e de componentes das demais telas.** |
| `catalogos-diagnostico.png` | **05a — Catálogos: Diagnósticos** | Listagem de diagnósticos com busca/filtro. |
| `catalogos-procedimentos.png` | **05b — Catálogos: Procedimentos** | Listagem de procedimentos com busca/filtro. |

> **Nota sobre nomes dos arquivos:** Os nomes acima podem estar truncados no sistema de arquivos (ex: `nova-avaliaca...-medicos.png`). Use o conteúdo visual da imagem para identificar a correspondência correta.

> **Liberdade criativa:** Caso algum wireframe esteja incompleto, falte um estado (loading, erro, vazio) ou um componente não esteja detalhado, **use o bom senso para completar** mantendo a consistência visual com as demais telas. Se a decisão for relevante o suficiente para impactar a experiência, pergunte ao usuário.

---

## Stack Tecnológica

- **Backend:** Python + FastAPI
- **Frontend:** React (Vite) + Tailwind CSS
- **Banco de dados:** PostgreSQL
- **ORM:** SQLAlchemy (ou SQLModel)
- **Autenticação:** JWT (access token apenas, sem refresh token no MVP)
- **Task assíncrona:** `BackgroundTasks` do FastAPI
- **Containerização:** Docker + Docker Compose (backend, frontend, PostgreSQL)

---

## Arquitetura do Fluxo de Predição (Assíncrono)

```
1. Frontend envia POST /api/predictions com os dados dos dois passos do formulário
2. Backend valida os dados, cria registro no banco com status = "PROCESSING"
   e retorna imediatamente: { id, status: "PROCESSING" }
3. Backend dispara tarefa em background (BackgroundTasks) que:
   a. Pré-processa os dados conforme definido em CLAUDE.md (pipeline, encoders, colunas)
   b. Executa model.predict()
   c. Atualiza o registro no banco:
      - Sucesso → status = "COMPLETED", salva resultado da predição
      - Falha  → status = "FAILED", salva mensagem de erro
4. Frontend faz polling periódico via GET /api/predictions/{id} (intervalo de 3s)
   até receber status "COMPLETED" ou "FAILED"
5. Ao receber "COMPLETED": redireciona para a tela de resultado (avaliacao-resultado-exemplo.png)
   Ao receber "FAILED": exibe mensagem de erro na tela
```

> **Regra fundamental:** O frontend NUNCA espera a resposta da predição na mesma request. Ele recebe o ID imediatamente e consulta o resultado depois via polling.

---

## Autenticação (MVP)

- JWT simples: login com e-mail + senha retorna um access token
- Sem roles ou permissões diferenciadas — todos os usuários autenticados têm acesso total
- Todas as rotas (exceto login e registro) exigem token válido no header `Authorization: Bearer <token>`
- Sem refresh token no MVP; ao expirar, o usuário faz login novamente
- Senhas armazenadas com hash bcrypt (nunca em texto puro)

---

## Telas e Funcionalidades

### 01 — Login (`login.png`)
- Campos: e-mail e senha
- Ao autenticar com sucesso: armazena JWT e redireciona para "Nova Avaliação"
- Credenciais inválidas: exibe mensagem de erro inline
- Estado de loading no botão durante a request

### 02 — Nova Avaliação (formulário em dois passos)

**Passo 1 — Dados do Paciente** (`nova-avaliacao-dados-paciente.png`)
- Campos conforme wireframe e `MODEL_INPUT_SCHEMA.md`
- Validação dos campos obrigatórios antes de avançar para o passo 2
- Botão "Próximo" para ir ao passo 2

**Passo 2 — Dados Médicos** (`nova-avaliacao-dados-medicos.png`)
- Campos de diagnóstico e procedimento com **busca/autocomplete** alimentados via endpoints de catálogo
- Demais campos conforme wireframe e `MODEL_INPUT_SCHEMA.md`
- Botão "Voltar" para retornar ao passo 1 (mantendo dados preenchidos)
- Botão "Enviar" que:
  1. Valida todos os campos (passo 1 + 2)
  2. Envia POST /api/predictions
  3. Recebe `{ id, status: "PROCESSING" }`
  4. Exibe estado de loading/processamento
  5. Inicia polling GET /api/predictions/{id} a cada 3 segundos

**Resultado** (`avaliacao-resultado-exemplo.png`)
- Exibido quando o polling retorna status "COMPLETED"
- Mostra os dados da avaliação e o resultado do modelo
- Layout conforme wireframe

### 03 — Histórico (`historico-avaliacoes.png`)
- Listagem paginada de todas as avaliações realizadas
- Cada item mostra: data, dados resumidos, status (PROCESSING / COMPLETED / FAILED)
- Clicar em um item abre os detalhes + resultado (mesma tela de resultado)
- Ação de excluir registro (com modal de confirmação)
- Filtros: por data, status
- Estado vazio: mensagem quando não há avaliações

### 04 — Usuários *(sem wireframe — criar seguindo padrão visual das demais telas)*
- CRUD: listar, cadastrar, editar e excluir
- Campos: nome, e-mail, senha
- Listagem em tabela com ações (editar, excluir)
- Modal ou formulário inline para cadastro/edição
- Excluir com confirmação
- Sem roles no MVP

### 05 — Catálogos

**Diagnósticos** (`catalogos-diagnostico.png`)
- Somente leitura — sem criar, editar ou remover
- Listagem com busca por nome ou código, e filtro por categoria
- Layout conforme wireframe

**Procedimentos** (`catalogos-procedimentos.png`)
- Somente leitura — sem criar, editar ou remover
- Listagem com busca por nome ou código, e filtro por categoria
- Layout conforme wireframe

---

## Estrutura de Endpoints (Backend)

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Login — retorna JWT |
| POST | `/api/auth/register` | Cadastro de novo usuário |
| GET | `/api/auth/me` | Retorna dados do usuário autenticado |

### Predictions (Avaliações)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/predictions` | Cria avaliação — retorna `{ id, status: "PROCESSING" }` |
| GET | `/api/predictions` | Lista avaliações com paginação e filtros |
| GET | `/api/predictions/{id}` | Detalhes de uma avaliação (usado no polling e na tela de resultado) |
| DELETE | `/api/predictions/{id}` | Exclui avaliação |

### Users
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/users` | Lista usuários |
| POST | `/api/users` | Cria usuário |
| PUT | `/api/users/{id}` | Edita usuário |
| DELETE | `/api/users/{id}` | Exclui usuário |

### Catalogs (somente leitura)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/catalogs/diagnoses` | Lista diagnósticos (query params: `search`, `category`, `page`, `per_page`) |
| GET | `/api/catalogs/procedures` | Lista procedimentos (query params: `search`, `category`, `page`, `per_page`) |

---

## Regras Gerais de Implementação

1. **Leia `CLAUDE.md` antes de qualquer código do backend** — ele define a lógica de pré-processamento, colunas esperadas, pipeline e como servir o modelo. Não assuma nada que não esteja documentado lá.
2. **Leia `MODEL_INPUT_SCHEMA.md`** — use como fonte para os schemas Pydantic de entrada/saída e para os campos do formulário.
3. **Consulte os wireframes** em `./frontend/ui-figma/` antes de criar qualquer componente do frontend.
4. **Carregue o modelo uma única vez** na inicialização da aplicação (evento `startup`/`lifespan` do FastAPI).
5. **Seed do banco** — na primeira execução, popule as tabelas de diagnósticos e procedimentos com os dados dos CSVs.
6. **Validação dupla** — valide dados no frontend (UX) e no backend (segurança).
7. **Tratamento de erros na predição** — se falhar, atualize o registro para "FAILED" com mensagem de erro. Nunca deixe um registro preso em "PROCESSING".
8. **Hash de senhas** — bcrypt, nunca texto puro.
9. **CORS** — configurar no backend para aceitar requests do frontend.
10. **Padrão de resposta da API** — formato consistente em todas as rotas: `{ data, message, status_code }`.
11. **Navegação** — sidebar ou menu lateral com links para todas as telas (Nova Avaliação, Histórico, Usuários, Catálogos, Logout).

---

## Ordem de Entrega

| Etapa | Escopo | Critério de conclusão |
|---|---|---|
| 1 | **Backend completo** | Endpoints funcionais, modelos do banco, lógica de predição assíncrona, auth JWT, seed dos catálogos. Testável via Swagger/docs. |
| 2 | **Frontend completo** | Todas as 5 telas funcionais, consumindo a API, fiéis aos wireframes. |
| 3 | **Docker Compose** | `docker-compose up` sobe os 3 serviços (frontend, backend, PostgreSQL) e o sistema funciona end-to-end. |

> **Entre cada etapa, valide com o usuário antes de prosseguir.**
