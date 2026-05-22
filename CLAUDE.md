# AI Operador Médico — Documentação Técnica

## Visão Geral

Pipeline de ML para predição de aprovação de sinistros de saúde (`ClaimStatus`: **Aprovado** / **Negado**).

- **Dataset**: 4.500 sinistros sintéticos localizados para PT-BR
- **Modelo**: `ExtraTreesClassifier` (PyCaret pipeline)
- **Acurácia (test set 30%)**: ~87% após Random Search
- **Notebook ETL**: `ai/etl_localization.ipynb`
- **Notebook Modelos**: `ai/models.ipynb`
- **Modelo salvo**: `ai/models/best_model.pkl`

---

## 1 — Tratamento do Dataset (ETL)

**Fonte**: `datasets/archive/enhanced_health_insurance_claims.csv` (Kaggle)

### 1.1 Transformações aplicadas

| Transformação | Detalhe |
|---|---|
| Conversão monetária | USD → BRL (taxa 5.75); colunas `ClaimAmountBRL`, `PatientIncomeBRL` |
| Localização geográfica | `ProviderLocation` → `ProviderState` (sigla) + `ProviderStateName` via hash MD5 ponderado por população |
| Tabelas auxiliares | `diagnosis_codes.csv`, `procedure_codes.csv` (nome PT-BR por especialidade) |
| Tradução PT-BR | Gênero, estado civil, emprego, tipo de sinistro, especialidade, método de submissão |

### 1.2 Colunas sintéticas geradas

| Coluna | Lógica |
|---|---|
| `ChildrenCount` | Poisson(λ) por estado civil × faixa etária (seed 42) |
| `IsHomeOwner` | Bernoulli por renda e emprego |
| `EducationLevel` | Multinomial por emprego e renda |
| `PlanType` | Multinomial por vínculo empregatício |
| `YearsAsInsured` | Uniforme inteira correlacionada com idade |
| `HasChronicCondition` | Bernoulli por idade e especialidade |

### 1.3 Engenharia do Target (ClaimStatus)

O `ClaimStatus` original do dataset Kaggle é **aleatório** (sem correlação com features). Foi substituído por um target baseado em **regras de negócio reais do setor**:

```
score = 0

ClaimType:      Emergência +0.50 | Internação +0.25 | Ambulatorial -0.15
Valor/Renda:    ratio >20%  -0.40 | ratio >10% -0.20 | ratio <2%  +0.20
YearsInsured:   ≥15 anos +0.35   | ≥8 anos +0.20  | ≤2 anos -0.25
Crônico:        HasChronicCondition = True → -0.25
PlanType:       Empresarial +0.25 | Familiar +0.10 | MEI -0.20
Idade:          >70 -0.20 | >60 -0.10 | <25 +0.10
Submissão:      Online +0.15 | Papel/Correio -0.15
Especialidade:  Pediatria +0.15 | Clínica Geral +0.10 | Cardiologia -0.15 | Ortopedia -0.20

prob_aprovação = sigmoid(score × 2.5) + noise(−0.10, +0.10)
ClaimStatus = "Aprovado" se prob ≥ 0.5
```

Distribuição resultante: **69% Aprovado / 31% Negado**

---

## 2 — Pipeline de Pré-processamento

### 2.1 Feature engineering (aplicado antes do PyCaret)

```python
df['ClaimToIncomeRatio'] = df['ClaimAmountUSD'] / df['PatientIncomeUSD'].clip(lower=1)
df['IsLongTermInsured']  = (df['YearsAsInsured'] >= 8).astype(int)
df['IsNewInsured']       = (df['YearsAsInsured'] <= 2).astype(int)
df['IsHighValueClaim']   = (df['ClaimAmountUSD'] > df['ClaimAmountUSD'].quantile(0.75)).astype(int)
df['IsElderly']          = (df['PatientAge'] > 60).astype(int)
```

> **Importante**: estas features devem ser computadas na API antes de chamar `pipeline.predict()`.

### 2.2 Colunas descartadas no treinamento

```python
DROP_COLS = [
    'ClaimID', 'PatientID', 'ProviderID',  # IDs sem valor preditivo
    'ClaimDate',                            # requer feature engineering de datas
    'ClaimAmountBRL', 'PatientIncomeBRL',   # duplicatas das colunas USD
    'DiagnosisNamePTBR', 'ProcedureNamePTBR', # texto de alta cardinalidade
    'ProviderLocation', 'ProviderStateName',  # ProviderState é suficiente
]
```

### 2.3 Pipeline interno do PyCaret (embutido no pkl)

O arquivo `best_model.pkl` já inclui todas as etapas de pré-processamento:

```
1. label_encoding    → TransformerWrapperWithInverse
2. numerical_imputer → TransformerWrapper
3. categorical_imputer → TransformerWrapper
4. ordinal_encoding  → TransformerWrapper
5. onehot_encoding   → TransformerWrapper
6. rest_encoding     → TransformerWrapper
7. normalize         → TransformerWrapper (z-score)
8. trained_model     → ExtraTreesClassifier
```

---

## 3 — Modelo: ExtraTreesClassifier

### 3.1 Hiperparâmetros (após Random Search, 50 iterações × 5-fold CV)

```python
ExtraTreesClassifier(
    n_estimators          = 140,
    max_depth             = 2,
    max_features          = 'sqrt',
    min_samples_leaf      = 5,
    min_samples_split     = 5,
    min_impurity_decrease = 0.002,
    class_weight          = 'balanced_subsample',
    criterion             = 'gini',
    bootstrap             = True,
    random_state          = 42,
    n_jobs                = -1,
)
```

### 3.2 Setup do treinamento

```python
setup(
    data             = df,
    target           = 'ClaimStatus',
    train_size       = 0.7,        # 3.150 treino / 1.350 teste
    session_id       = 42,
    normalize        = True,
    normalize_method = 'zscore',
    fix_imbalance    = False,      # SMOTE prejudica modelos em árvore
)
```

### 3.3 Interpretabilidade (feature importance)

O ExtraTreesClassifier expõe `feature_importances_` diretamente:

```python
import joblib
pipeline = joblib.load('ai/models/best_model.pkl')
model    = pipeline.steps[-1][1]  # ExtraTreesClassifier
importances = model.feature_importances_
```

---

## 4 — Servindo o modelo como REST API

### 4.1 Dependências

```bash
pip install fastapi uvicorn joblib pandas numpy
```

### 4.2 Implementação (FastAPI)

```python
# api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np

app = FastAPI(title="Operador Médico — Predição de Sinistros")

pipeline = joblib.load("ai/models/best_model.pkl")

class ClaimRequest(BaseModel):
    ClaimAmountUSD: float
    PatientAge: int
    PatientGender: str              # "Masculino" | "Feminino"
    PatientMaritalStatus: str       # "Solteiro(a)" | "Casado(a)" | "Divorciado(a)" | "Viúvo(a)"
    PatientEmploymentStatus: str    # "Empregado" | "Desempregado" | "Aposentado" | "Estudante"
    PatientIncomeUSD: float
    ProviderSpecialty: str          # "Cardiologia" | "Clínica Geral" | "Neurologia" | "Ortopedia" | "Pediatria"
    ClaimType: str                  # "Emergência" | "Internação" | "Ambulatorial" | "Consulta de Rotina"
    ClaimSubmissionMethod: str      # "Online" | "Telefone" | "Papel/Correio"
    DiagnosisCode: str
    ProcedureCode: str
    ProviderState: str              # sigla UF, ex: "SP"
    ChildrenCount: int
    IsHomeOwner: int                # 0 ou 1
    EducationLevel: str             # "Fundamental" | "Médio" | "Superior" | "Pós-graduação"
    PlanType: str                   # "Individual" | "Familiar" | "Empresarial" | "MEI"
    YearsAsInsured: int
    HasChronicCondition: int        # 0 ou 1


def apply_feature_engineering(data: dict) -> pd.DataFrame:
    df = pd.DataFrame([data])

    # Mesmas features derivadas do notebook de treinamento
    df['ClaimToIncomeRatio'] = (df['ClaimAmountUSD'] / df['PatientIncomeUSD'].clip(lower=1)).round(4)
    df['IsLongTermInsured']  = (df['YearsAsInsured'] >= 8).astype(int)
    df['IsNewInsured']       = (df['YearsAsInsured'] <= 2).astype(int)
    df['IsHighValueClaim']   = (df['ClaimAmountUSD'] > 8000).astype(int)  # ~P75 do treino
    df['IsElderly']          = (df['PatientAge'] > 60).astype(int)

    return df


@app.post("/predict")
def predict(claim: ClaimRequest):
    df = apply_feature_engineering(claim.model_dump())

    prediction  = pipeline.predict(df)[0]
    probability = pipeline.predict_proba(df)[0]

    labels = pipeline.classes_  # ['Aprovado', 'Negado']
    proba_dict = dict(zip(labels, probability.round(4).tolist()))

    return {
        "status":      prediction,
        "probability": proba_dict,
        "approved":    prediction == "Aprovado",
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": "ExtraTreesClassifier"}
```

### 4.3 Iniciar o servidor

```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

### 4.4 Exemplo de requisição

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "ClaimAmountUSD": 1200.00,
    "PatientAge": 35,
    "PatientGender": "Masculino",
    "PatientMaritalStatus": "Casado(a)",
    "PatientEmploymentStatus": "Empregado",
    "PatientIncomeUSD": 75000.00,
    "ProviderSpecialty": "Clínica Geral",
    "ClaimType": "Consulta de Rotina",
    "ClaimSubmissionMethod": "Online",
    "DiagnosisCode": "yy006",
    "ProcedureCode": "hd662",
    "ProviderState": "SP",
    "ChildrenCount": 1,
    "IsHomeOwner": 1,
    "EducationLevel": "Superior",
    "PlanType": "Empresarial",
    "YearsAsInsured": 10,
    "HasChronicCondition": 0
  }'
```

### 4.5 Resposta esperada

```json
{
  "status": "Aprovado",
  "probability": {
    "Aprovado": 0.8234,
    "Negado": 0.1766
  },
  "approved": true
}
```

---

## 5 — Referência de Valores Válidos por Campo

| Campo | Valores aceitos |
|---|---|
| `PatientGender` | `Masculino`, `Feminino` |
| `PatientMaritalStatus` | `Solteiro(a)`, `Casado(a)`, `Divorciado(a)`, `Viúvo(a)` |
| `PatientEmploymentStatus` | `Empregado`, `Desempregado`, `Aposentado`, `Estudante` |
| `ClaimType` | `Emergência`, `Internação`, `Ambulatorial`, `Consulta de Rotina` |
| `ClaimSubmissionMethod` | `Online`, `Telefone`, `Papel/Correio` |
| `ProviderSpecialty` | `Cardiologia`, `Clínica Geral`, `Neurologia`, `Ortopedia`, `Pediatria` |
| `PlanType` | `Individual`, `Familiar`, `Empresarial`, `MEI` |
| `EducationLevel` | `Fundamental`, `Médio`, `Superior`, `Pós-graduação` |
| `ProviderState` | Sigla UF brasileira (ex: `SP`, `RJ`, `MG`, ...) |
