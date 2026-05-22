# Schema de Entrada do Modelo

Referência completa dos campos que o modelo `ExtraTreesClassifier` espera receber.

> Os campos marcados com ⚙️ são **derivados automaticamente** pela API a partir dos campos base — não precisam ser enviados pelo cliente.

---

## Campos de Entrada (enviados pelo cliente)

### Financeiros

| Campo | Tipo | Intervalo / Valores | Descrição |
|---|---|---|---|
| `ClaimAmountUSD` | `float` | `100.12` – `9997.20` | Valor do sinistro em dólares |
| `PatientIncomeUSD` | `float` | `20006.87` – `149957.52` | Renda anual do paciente em dólares |

---

### Paciente

| Campo | Tipo | Intervalo / Valores | Descrição |
|---|---|---|---|
| `PatientAge` | `int` | `0` – `99` | Idade do paciente em anos |
| `PatientGender` | `string` | `Masculino` \| `Feminino` | Gênero |
| `PatientMaritalStatus` | `string` | `Solteiro(a)` \| `Casado(a)` \| `Divorciado(a)` \| `Viúvo(a)` | Estado civil |
| `PatientEmploymentStatus` | `string` | `Empregado` \| `Desempregado` \| `Aposentado` \| `Estudante` | Situação de emprego |
| `ChildrenCount` | `int` | `0` – `5` | Número de filhos |
| `IsHomeOwner` | `bool` | `true` \| `false` | Proprietário de imóvel |
| `EducationLevel` | `string` | `Fundamental` \| `Médio` \| `Superior` \| `Pós-graduação` | Nível de escolaridade |

---

### Plano e Histórico

| Campo | Tipo | Intervalo / Valores | Descrição |
|---|---|---|---|
| `PlanType` | `string` | `Individual` \| `Familiar` \| `Empresarial` \| `MEI` | Tipo de plano de saúde |
| `YearsAsInsured` | `int` | `1` – `81` | Anos como beneficiário do plano |
| `HasChronicCondition` | `bool` | `true` \| `false` | Possui condição crônica diagnosticada |

---

### Sinistro

| Campo | Tipo | Intervalo / Valores | Descrição |
|---|---|---|---|
| `ClaimType` | `string` | `Emergência` \| `Internação` \| `Consulta de Rotina` \| `Ambulatorial` | Tipo do sinistro |
| `ClaimSubmissionMethod` | `string` | `Online` \| `Telefone` \| `Papel/Correio` | Canal de envio |
| `DiagnosisCode` | `string` | qualquer código (ex: `yy006`) | Código do diagnóstico |
| `ProcedureCode` | `string` | qualquer código (ex: `hd662`) | Código do procedimento |

---

### Prestador

| Campo | Tipo | Intervalo / Valores | Descrição |
|---|---|---|---|
| `ProviderSpecialty` | `string` | `Cardiologia` \| `Clínica Geral` \| `Neurologia` \| `Ortopedia` \| `Pediatria` | Especialidade médica |
| `ProviderState` | `string` | sigla UF (27 estados + DF) | Estado do prestador |

**Estados válidos para `ProviderState`:**

```
AC  AL  AM  AP  BA  CE  DF  ES  GO  MA
MG  MS  MT  PA  PB  PE  PI  PR  RJ  RN
RO  RR  RS  SC  SE  SP  TO
```

---

## Campos Derivados Internamente ⚙️

Gerados automaticamente pela API antes de chamar o modelo. **Não enviar no payload.**

| Campo | Tipo | Derivação |
|---|---|---|
| `ClaimToIncomeRatio` | `float` | `ClaimAmountUSD / PatientIncomeUSD` |
| `IsLongTermInsured` | `int` (0/1) | `YearsAsInsured >= 8` |
| `IsNewInsured` | `int` (0/1) | `YearsAsInsured <= 2` |
| `IsHighValueClaim` | `int` (0/1) | `ClaimAmountUSD > 8000` (≈ P75 do treino) |
| `IsElderly` | `int` (0/1) | `PatientAge > 60` |

---

## Saída do Modelo

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

| Campo | Tipo | Descrição |
|---|---|---|
| `status` | `string` | `"Aprovado"` ou `"Negado"` |
| `probability.Aprovado` | `float` | Probabilidade de aprovação (0–1) |
| `probability.Negado` | `float` | Probabilidade de negação (0–1) |
| `approved` | `bool` | `true` se status = Aprovado |

---

## Exemplo de Payload Completo

```json
{
  "ClaimAmountUSD": 1200.00,
  "PatientIncomeUSD": 75000.00,
  "PatientAge": 35,
  "PatientGender": "Masculino",
  "PatientMaritalStatus": "Casado(a)",
  "PatientEmploymentStatus": "Empregado",
  "ChildrenCount": 1,
  "IsHomeOwner": true,
  "EducationLevel": "Superior",
  "PlanType": "Empresarial",
  "YearsAsInsured": 10,
  "HasChronicCondition": false,
  "ClaimType": "Consulta de Rotina",
  "ClaimSubmissionMethod": "Online",
  "DiagnosisCode": "yy006",
  "ProcedureCode": "hd662",
  "ProviderSpecialty": "Clínica Geral",
  "ProviderState": "SP"
}
```
