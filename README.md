# MedAnalysis — Plataforma de Auditoria de Sinistros de Saúde

Sistema completo de auditoria de sinistros de saúde com modelo de Machine Learning. Recebe os dados de um sinistro, aplica um `ExtraTreesClassifier` treinado em 4.500 registros sintéticos localizados para PT-BR e retorna uma recomendação de **Aprovação** ou **Negação** com nível de confiança e fatores explicativos.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                           │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │     Backend      │    │  PostgreSQL  │  │
│  │  React/Vite  │───▶│    FastAPI       │───▶│   (dados +   │  │
│  │  Tailwind    │    │  + PyCaret ML    │    │   catálogos) │  │
│  │  nginx:80    │    │  uvicorn:8000    │    │   port:5432  │  │
│  └──────────────┘    └──────────────────┘    └──────────────┘  │
│    localhost:3000       localhost:8000                          │
└─────────────────────────────────────────────────────────────────┘

Fluxo de predição:
  POST /api/predictions
      │
      ▼
  Valida campos (Pydantic) → Salva status=PROCESSING → Retorna ID
      │
      ▼ (BackgroundTask)
  Feature engineering → pipeline.predict() → Salva status=COMPLETED
      │
      ▼ (Polling 3s)
  GET /api/predictions/{id} → Frontend exibe resultado
```

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, React Hook Form |
| Backend | FastAPI 0.115, SQLAlchemy 2, Pydantic v2 |
| ML | PyCaret 3.3.2, scikit-learn 1.4, pandas, ExtraTreesClassifier |
| Banco | PostgreSQL 16 |
| Auth | JWT (HS256) via python-jose + passlib/bcrypt |
| Infra | Docker Compose (3 serviços) |

---

## Estrutura do Repositório

```
.
├── ai/
│   ├── etl_localization.ipynb   # ETL: localização e engenharia do dataset
│   ├── models.ipynb             # Treinamento e avaliação de modelos (PyCaret)
│   ├── fix_catalogs.py          # Correção: gera códigos canônicos únicos
│   ├── retrain.py               # Script alternativo de retreino
│   └── models/
│       └── best_model.pkl       # Pipeline PyCaret serializado
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + lifespan (seed, model load)
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── seed.py              # Seed de diagnósticos e procedimentos
│   │   ├── api/
│   │   │   ├── auth.py          # /api/auth/login, /register, /me
│   │   │   ├── predictions.py   # /api/predictions (CRUD + decisão)
│   │   │   ├── users.py         # /api/users (CRUD)
│   │   │   ├── catalogs.py      # /api/catalogs/diagnoses, /procedures
│   │   │   └── deps.py          # Dependency: get_current_user
│   │   ├── core/
│   │   │   ├── ml.py            # load_model(), predict(), feature engineering
│   │   │   ├── security.py      # JWT, bcrypt
│   │   │   └── pycaret_stubs.py # Stubs (não usado em prod — pycaret instalado)
│   │   ├── models/              # SQLAlchemy ORM: User, Prediction, Diagnosis, Procedure
│   │   ├── schemas/             # Pydantic schemas: auth, prediction, user, catalog
│   │   └── services/
│   │       └── prediction.py    # run_prediction() — BackgroundTask
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Router + AuthProvider
│   │   ├── api/client.js        # axios com interceptor JWT
│   │   ├── context/AuthContext  # login, logout, user state
│   │   ├── hooks/usePolling.js  # Polling GET /predictions/{id} a cada 3s
│   │   ├── components/          # Layout, Sidebar, StatusBadge, Pagination, ...
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── assessment/      # NewAssessment, Step1Patient, Step2Medical, Result
│   │       ├── History.jsx + HistoryDetail.jsx
│   │       ├── Users.jsx
│   │       └── catalogs/        # Catalogs, CatalogTab
│   ├── nginx.conf               # SPA fallback + proxy /api/ → backend
│   └── Dockerfile               # Multi-stage: node:20 build → nginx:alpine
│
├── datasets/
│   ├── archive/                 # Dataset original Kaggle
│   └── output/
│       ├── enhanced_claims_ptbr.csv   # Dataset processado (4.500 linhas)
│       ├── diagnosis_codes.csv        # 70 diagnósticos únicos com códigos canônicos
│       └── procedure_codes.csv        # 71 procedimentos únicos com códigos canônicos
│
└── docker-compose.yml
```

---

## Como Rodar

### Pré-requisitos

- Docker e Docker Compose instalados

### Subir tudo

```bash
docker-compose up --build
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

### Primeiro acesso

1. Acesse http://localhost:3000
2. Clique em **Criar conta** e registre um usuário
3. Faça login e comece a criar avaliações

---

## Modelo de ML

### Dataset

- 4.500 sinistros sintéticos baseados em dataset Kaggle, localizados para PT-BR
- Target `ClaimStatus` engenheirado por regras de negócio reais (não randômico)
- Distribuição: **69% Aprovado / 31% Negado**

### Pipeline PyCaret (`best_model.pkl`)

```
label_encoding       → LabelEncoder (Aprovado/Negado ↔ 0/1)
numerical_imputer    → SimpleImputer (median)
categorical_imputer  → SimpleImputer (most_frequent)
ordinal_encoding     → OrdinalEncoder (PatientGender)
onehot_encoding      → OneHotEncoder (7 colunas categóricas)
rest_encoding        → TargetEncoder (DiagnosisCode, ProcedureCode, ProviderState)
normalize            → StandardScaler (z-score)
trained_model        → ExtraTreesClassifier
```

### Features de entrada (18 campos)

| Campo | Tipo | Descrição |
|---|---|---|
| `PatientAge` | int | Idade calculada da data de nascimento |
| `PatientGender` | str | Masculino / Feminino |
| `PatientMaritalStatus` | str | 4 opções |
| `PatientEmploymentStatus` | str | 4 opções |
| `ChildrenCount` | int | 0–5 |
| `IsHomeOwner` | bool | Proprietário do imóvel |
| `EducationLevel` | str | 4 opções |
| `HasChronicCondition` | bool | Possui condição crônica |
| `PlanType` | str | Individual / Familiar / Empresarial / MEI |
| `YearsAsInsured` | int | Anos como segurado |
| `PatientIncomeUSD` | float | Renda anual USD (convertida de BRL mensal pelo backend) |
| `ClaimAmountUSD` | float | Valor do sinistro USD (convertido de BRL pelo backend) |
| `ClaimType` | str | Emergência / Internação / Ambulatorial / Consulta de Rotina |
| `ClaimSubmissionMethod` | str | Online / Telefone / Papel/Correio |
| `DiagnosisCode` | str | Código canônico ICD-10 PT-BR (ex: `DCAR001`) |
| `ProcedureCode` | str | Código canônico TUSS PT-BR (ex: `PNEU003`) |
| `ProviderSpecialty` | str | 5 especialidades |
| `ProviderState` | str | Sigla UF (ex: SP) |

### Features derivadas (geradas pelo backend antes de chamar o modelo)

```python
ClaimToIncomeRatio = ClaimAmountUSD / PatientIncomeUSD
IsLongTermInsured  = YearsAsInsured >= 8
IsNewInsured       = YearsAsInsured <= 2
IsHighValueClaim   = ClaimAmountUSD > 8000
IsElderly          = PatientAge > 60
```

### Acurácia

~87% no test set (30% holdout), após Random Search com 50 iterações × 5-fold CV.

---

## Retreinar o Modelo

Se o dataset for atualizado, retreine via notebook:

```bash
# 1. Ativar o venv Python 3.11 com PyCaret
source .venv/bin/activate

# 2. Rodar o notebook completo
jupyter nbconvert --to notebook --execute ai/models.ipynb --output ai/models.ipynb

# 3. Rebuildar o backend com o novo .pkl
docker-compose up --build backend
```

Se os catálogos de diagnóstico/procedimento precisarem ser regenerados:

```bash
.venv/bin/python ai/fix_catalogs.py
# Depois truncar as tabelas no banco para re-seed:
docker exec <db-container> psql -U medanalysis -d medanalysis \
  -c "TRUNCATE TABLE diagnoses, procedures RESTART IDENTITY;"
docker restart <backend-container>
```

---

## Variáveis de Ambiente (Backend)

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgresql://medanalysis:medanalysis@db:5432/medanalysis` | URL do banco |
| `SECRET_KEY` | — | Chave JWT (obrigatório em produção) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Expiração do token (8h) |
| `MODEL_PATH` | `/app/models/best_model.pkl` | Caminho do modelo |
| `DIAGNOSES_CSV` | `/app/data/diagnosis_codes.csv` | CSV de diagnósticos |
| `PROCEDURES_CSV` | `/app/data/procedure_codes.csv` | CSV de procedimentos |

---

## API — Endpoints Principais

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastro de usuário |
| POST | `/api/auth/login` | Login → retorna JWT |
| GET | `/api/auth/me` | Dados do usuário autenticado |
| POST | `/api/predictions` | Criar avaliação (assíncrono) |
| GET | `/api/predictions` | Listar avaliações (paginado, com filtros) |
| GET | `/api/predictions/{id}` | Buscar avaliação (polling de status) |
| PATCH | `/api/predictions/{id}/decision` | Registrar decisão do auditor |
| DELETE | `/api/predictions/{id}` | Excluir avaliação |
| GET | `/api/catalogs/diagnoses` | Listar diagnósticos (busca + paginação) |
| GET | `/api/catalogs/procedures` | Listar procedimentos (busca + paginação) |
| GET | `/api/users` | Listar usuários |

Documentação interativa completa em **http://localhost:8000/docs**.
