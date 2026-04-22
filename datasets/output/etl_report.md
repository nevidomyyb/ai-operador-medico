# Relatório ETL — Dataset de Sinistros de Saúde PT-BR

**Data de geração:** 2026-04-21 17:05:19  
**Taxa de câmbio utilizada:** 1 USD = 5.75 BRL  
**Seed de geração (colunas sintéticas):** 42  

---

## Registros Processados

| Métrica | Valor |
|---|---|
| Registros no dataset original | 4.500 |
| Registros no dataset final | 4500 |
| Colunas originais | 17 |
| Colunas finais | 29 |
| Linhas removidas | 0 |

## Distribuição de ClaimStatus

| Status | Quantidade | Percentual |
|---|---|---|
| Aprovado | 1522 | 33.8% |
| Negado | 1512 | 33.6% |
| Pendente | 1466 | 32.6% |

## Colunas Adicionadas

| Coluna | Tipo | Descrição |
|---|---|---|
| ClaimAmountBRL | float64 | Valor do sinistro convertido para BRL |
| PatientIncomeBRL | float64 | Renda anual do paciente em BRL |
| ProviderState | str | Sigla do estado brasileiro do prestador |
| ProviderStateName | str | Nome completo do estado brasileiro |
| DiagnosisNamePTBR | str | Nome do diagnóstico em PT-BR (baseado na especialidade) |
| ProcedureNamePTBR | str | Nome do procedimento em PT-BR (baseado na especialidade) |
| ChildrenCount | int | Número de filhos (0–5, correlacionado com estado civil e idade) |
| IsHomeOwner | bool | Proprietário do imóvel (correlacionado com renda e emprego) |
| EducationLevel | str | Nível de escolaridade (correlacionado com emprego e renda) |
| PlanType | str | Tipo de plano de saúde (correlacionado com vínculo empregatício) |
| YearsAsInsured | int | Anos como conveniado (1–30, correlacionado com idade) |
| HasChronicCondition | bool | Possui condição crônica (correlacionado com idade e especialidade) |

## Valores Únicos por Coluna Categórica

| Coluna | Nº Únicos | Valores |
|---|---|---|
| PatientGender | 2 | Feminino, Masculino |
| PatientMaritalStatus | 4 | Casado(a), Divorciado(a), Solteiro(a), Viúvo(a) |
| PatientEmploymentStatus | 4 | Aposentado, Desempregado, Empregado, Estudante |
| ClaimType | 4 | Ambulatorial, Consulta de Rotina, Emergência, Internação |
| ClaimSubmissionMethod | 3 | Online, Papel/Correio, Telefone |
| ClaimStatus | 3 | Aprovado, Negado, Pendente |
| ProviderSpecialty | 5 | Cardiologia, Clínica Geral, Neurologia, Ortopedia, Pediatria |
| ProviderState | 27 | AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO |
| EducationLevel | 4 | Fundamental, Médio, Pós-graduação, Superior |
| PlanType | 4 | Empresarial, Familiar, Individual, MEI |

## Tabelas Auxiliares Geradas

| Arquivo | Registros | Colunas |
|---|---|---|
| diagnosis_codes.csv | 4495 | DiagnosisCode, DiagnosisNamePTBR, DiagnosisCategory |
| procedure_codes.csv | 4495 | ProcedureCode, ProcedureNamePTBR, ProcedureCategory |

## Distribuição por Especialidade × ClaimStatus

| Especialidade | Aprovado | Negado | Pendente | Total |
|---|---|---|---|---|
| Cardiologia | 311 | 312 | 284 | 907 |
| Clínica Geral | 280 | 312 | 288 | 880 |
| Neurologia | 307 | 296 | 262 | 865 |
| Ortopedia | 325 | 271 | 297 | 893 |
| Pediatria | 299 | 321 | 335 | 955 |

## Inconsistências Detectadas

- ✓ Nenhuma inconsistência detectada. Todas as 4.500 linhas estão completas.
