"""
Corrige o problema de duplicação de códigos no dataset:
- Gera códigos canônicos únicos por (nome, categoria) em cada pool
- Atualiza DiagnosisCode e ProcedureCode no dataset para usar os canônicos
- Re-gera diagnosis_codes.csv e procedure_codes.csv sem duplicatas
"""
import hashlib
import pathlib
import pandas as pd

OUTPUT_DIR = pathlib.Path("datasets/output")

DIAGNOSIS_POOLS = {
    'Cardiologia': [
        ('Insuficiência Cardíaca Congestiva', 'Doenças Cardiovasculares'),
        ('Hipertensão Arterial Sistêmica', 'Doenças Cardiovasculares'),
        ('Infarto Agudo do Miocárdio', 'Doenças Cardiovasculares'),
        ('Arritmia Cardíaca', 'Doenças Cardiovasculares'),
        ('Angina Pectoris Instável', 'Doenças Cardiovasculares'),
        ('Fibrilação Atrial', 'Doenças Cardiovasculares'),
        ('Cardiomiopatia Dilatada', 'Doenças Cardiovasculares'),
        ('Valvopatia Mitral', 'Doenças Cardiovasculares'),
        ('Endocardite Infecciosa', 'Doenças Cardiovasculares'),
        ('Trombose Venosa Profunda', 'Doenças Vasculares'),
        ('Embolia Pulmonar', 'Doenças Vasculares'),
        ('Aterosclerose Coronariana', 'Doenças Cardiovasculares'),
        ('Pericardite Aguda', 'Doenças Cardiovasculares'),
        ('Choque Cardiogênico', 'Doenças Cardiovasculares'),
    ],
    'Clínica Geral': [
        ('Diabetes Mellitus Tipo 2', 'Doenças Metabólicas'),
        ('Hipertensão Arterial Sistêmica', 'Doenças Cardiovasculares'),
        ('Infecção do Trato Urinário', 'Doenças Infecciosas'),
        ('Pneumonia Bacteriana', 'Doenças Respiratórias'),
        ('Gastroenterite Aguda', 'Doenças Gastrointestinais'),
        ('Rinite Alérgica', 'Doenças Alérgicas'),
        ('Lombalgia Crônica', 'Doenças Musculoesqueléticas'),
        ('Hipotireoidismo', 'Doenças Endócrinas'),
        ('Anemia Ferropriva', 'Doenças Hematológicas'),
        ('Depressão Maior', 'Transtornos Mentais'),
        ('Ansiedade Generalizada', 'Transtornos Mentais'),
        ('Síndrome do Intestino Irritável', 'Doenças Gastrointestinais'),
        ('Obesidade Grau II', 'Doenças Metabólicas'),
        ('Doença do Refluxo Gastroesofágico', 'Doenças Gastrointestinais'),
        ('Bronquite Crônica', 'Doenças Respiratórias'),
    ],
    'Neurologia': [
        ('Enxaqueca Crônica', 'Doenças Neurológicas'),
        ('Epilepsia', 'Doenças Neurológicas'),
        ('Acidente Vascular Cerebral Isquêmico', 'Doenças Cerebrovasculares'),
        ('Doença de Parkinson', 'Doenças Neurodegenerativas'),
        ('Esclerose Múltipla', 'Doenças Autoimunes Neurológicas'),
        ('Neuropatia Periférica Diabética', 'Doenças Neurológicas'),
        ('Demência de Alzheimer', 'Doenças Neurodegenerativas'),
        ('Cefaleia Tensional Crônica', 'Doenças Neurológicas'),
        ('Neuralgia do Trigêmeo', 'Doenças Neurológicas'),
        ('Síndrome de Guillain-Barré', 'Doenças Neurológicas'),
        ('Meningite Bacteriana', 'Doenças Infecciosas do SNC'),
        ('Acidente Isquêmico Transitório', 'Doenças Cerebrovasculares'),
        ('Tremor Essencial', 'Doenças Neurológicas'),
        ('Miastenia Gravis', 'Doenças Neuromusculares'),
    ],
    'Ortopedia': [
        ('Fratura de Fêmur', 'Traumatologia'),
        ('Lesão do Manguito Rotador', 'Doenças Musculoesqueléticas'),
        ('Artrose de Joelho', 'Doenças Articulares'),
        ('Hérnia de Disco Lombar', 'Doenças da Coluna'),
        ('Tendinite Patelar', 'Doenças Musculoesqueléticas'),
        ('Escoliose Idiopática', 'Doenças da Coluna'),
        ('Fratura de Punho', 'Traumatologia'),
        ('Osteoporose', 'Doenças Ósseas'),
        ('Artrite Reumatoide', 'Doenças Autoimunes'),
        ('Síndrome do Túnel do Carpo', 'Doenças Nervosas Periféricas'),
        ('Bursite do Quadril', 'Doenças Musculoesqueléticas'),
        ('Fratura de Tornozelo', 'Traumatologia'),
        ('Tendinite de Aquiles', 'Doenças Musculoesqueléticas'),
        ('Epicondilite Lateral', 'Doenças Musculoesqueléticas'),
    ],
    'Pediatria': [
        ('Bronquiolite Aguda', 'Doenças Respiratórias Pediátricas'),
        ('Asma Infantil', 'Doenças Respiratórias Pediátricas'),
        ('Otite Média Aguda', 'Doenças Otorrinolaringológicas'),
        ('Amigdalite Bacteriana', 'Doenças Otorrinolaringológicas'),
        ('Dermatite Atópica', 'Doenças Dermatológicas'),
        ('Varicela', 'Doenças Infecciosas Pediátricas'),
        ('Pneumonia Viral', 'Doenças Respiratórias Pediátricas'),
        ('Gastroenterite Aguda Pediátrica', 'Doenças Gastrointestinais'),
        ('Febre Reumática', 'Doenças Infecciosas Pediátricas'),
        ('Convulsão Febril', 'Doenças Neurológicas Pediátricas'),
        ('Síndrome do Croup', 'Doenças Respiratórias Pediátricas'),
        ('Rinite Alérgica Pediátrica', 'Doenças Alérgicas'),
        ('Anemia Falciforme', 'Doenças Hematológicas'),
        ('Diabetes Mellitus Tipo 1', 'Doenças Metabólicas'),
    ],
}

PROCEDURE_POOLS = {
    'Cardiologia': [
        ('Cateterismo Cardíaco', 'Procedimentos Hemodinâmicos'),
        ('Ecocardiograma Transtorácico', 'Diagnóstico por Imagem'),
        ('Holter 24 Horas', 'Monitorização Cardíaca'),
        ('Cardioversão Elétrica', 'Procedimentos Terapêuticos'),
        ('Implante de Marcapasso', 'Cirurgia Cardíaca'),
        ('Angioplastia Coronariana', 'Procedimentos Hemodinâmicos'),
        ('Revascularização do Miocárdio', 'Cirurgia Cardíaca'),
        ('Ecocardiograma de Estresse', 'Diagnóstico por Imagem'),
        ('Monitorização de Pressão Arterial (MAPA)', 'Monitorização Cardíaca'),
        ('Ablação por Radiofrequência', 'Procedimentos Eletrofisiológicos'),
        ('Teste Ergométrico', 'Diagnóstico Funcional'),
        ('Implante de Desfibrilador', 'Cirurgia Cardíaca'),
        ('Ecodopplercardiograma', 'Diagnóstico por Imagem'),
        ('Valvoplastia Mitral', 'Cirurgia Cardíaca'),
    ],
    'Clínica Geral': [
        ('Consulta Médica Ambulatorial', 'Consultas'),
        ('Coleta de Exames Laboratoriais', 'Diagnóstico Laboratorial'),
        ('Eletrocardiograma', 'Diagnóstico Cardiológico'),
        ('Espirometria', 'Diagnóstico Respiratório'),
        ('Ultrassonografia Abdominal', 'Diagnóstico por Imagem'),
        ('Raio-X de Tórax', 'Diagnóstico por Imagem'),
        ('Curativo e Sutura', 'Procedimentos Ambulatoriais'),
        ('Hemograma Completo', 'Diagnóstico Laboratorial'),
        ('Medição de Glicemia Capilar', 'Monitorização Metabólica'),
        ('Vacinação', 'Medicina Preventiva'),
        ('Aferição de Pressão Arterial', 'Monitorização Cardiovascular'),
        ('Teste de Gravidez', 'Diagnóstico Laboratorial'),
        ('Nebulização', 'Procedimentos Terapêuticos'),
        ('Orientação Nutricional', 'Promoção da Saúde'),
        ('Eletroencefalograma', 'Diagnóstico Neurológico'),
    ],
    'Neurologia': [
        ('Eletroencefalograma (EEG)', 'Diagnóstico Neurológico'),
        ('Ressonância Magnética Encefálica', 'Diagnóstico por Imagem'),
        ('Punção Lombar', 'Procedimentos Diagnósticos'),
        ('Eletroneuromiografia', 'Diagnóstico Neuromuscular'),
        ('Potencial Evocado Visual', 'Diagnóstico Neurofisiológico'),
        ('Tomografia de Crânio', 'Diagnóstico por Imagem'),
        ('Doppler Transcraniano', 'Diagnóstico Vascular'),
        ('Avaliação Neuropsicológica', 'Avaliação Cognitiva'),
        ('Toxina Botulínica Terapêutica', 'Procedimentos Terapêuticos'),
        ('Estimulação Magnética Transcraniana', 'Procedimentos Terapêuticos'),
        ('Biópsia de Nervo Periférico', 'Procedimentos Cirúrgicos'),
        ('Angiografia Cerebral', 'Diagnóstico por Imagem'),
        ('Polissonografia', 'Diagnóstico do Sono'),
        ('Implante de Estimulador Cerebral Profundo', 'Neurocirurgia'),
    ],
    'Ortopedia': [
        ('Artroscopia de Joelho', 'Cirurgia Artroscópica'),
        ('Artroplastia Total de Quadril', 'Cirurgia Articular'),
        ('Osteossíntese de Fêmur', 'Procedimentos Cirúrgicos'),
        ('Artroscopia de Ombro', 'Cirurgia Artroscópica'),
        ('Artroplastia Total de Joelho', 'Cirurgia Articular'),
        ('Discectomia Lombar', 'Cirurgia da Coluna'),
        ('Fisioterapia Ortopédica', 'Reabilitação'),
        ('Imobilização com Gesso', 'Procedimentos Ambulatoriais'),
        ('Infiltração Intra-articular', 'Procedimentos Terapêuticos'),
        ('Osteossíntese de Punho', 'Procedimentos Cirúrgicos'),
        ('Tenotomia', 'Procedimentos Cirúrgicos'),
        ('Radiografia Óssea', 'Diagnóstico por Imagem'),
        ('Densitometria Óssea', 'Diagnóstico por Imagem'),
        ('Correção Cirúrgica de Escoliose', 'Cirurgia da Coluna'),
    ],
    'Pediatria': [
        ('Teste do Pezinho', 'Triagem Neonatal'),
        ('Vacinação Pediátrica', 'Medicina Preventiva'),
        ('Nebulização Pediátrica', 'Procedimentos Terapêuticos'),
        ('Triagem Auditiva Neonatal', 'Triagem Neonatal'),
        ('Consulta de Puericultura', 'Consultas'),
        ('Teste do Olhinho', 'Triagem Neonatal'),
        ('Amigdalectomia', 'Cirurgia Pediátrica'),
        ('Adenoidectomia', 'Cirurgia Pediátrica'),
        ('Oximetria de Pulso', 'Monitorização Respiratória'),
        ('Ventilação Não Invasiva Pediátrica', 'Suporte Ventilatório'),
        ('Paracentese de Membrana Timpânica', 'Cirurgia Otorrinolaringológica'),
        ('Avaliação do Desenvolvimento Neuropsicomotor', 'Avaliação Pediátrica'),
        ('Coleta de Hemocultura Pediátrica', 'Diagnóstico Laboratorial'),
        ('Fototerapia para Icterícia Neonatal', 'Procedimentos Terapêuticos'),
    ],
}

SPEC_ABBR = {
    'Cardiologia': 'CAR',
    'Clínica Geral': 'CLG',
    'Neurologia': 'NEU',
    'Ortopedia': 'ORT',
    'Pediatria': 'PED',
}


def build_canonical_maps():
    """Gera um código canônico único por (nome_diagnóstico/procedimento)."""
    diag_name_to_code: dict[str, dict] = {}  # nome → {code, category}
    proc_name_to_code: dict[str, dict] = {}

    diag_counter = 1
    for specialty, pool in DIAGNOSIS_POOLS.items():
        abbr = SPEC_ABBR[specialty]
        for name, category in pool:
            if name not in diag_name_to_code:
                code = f"D{abbr}{diag_counter:03d}"
                diag_name_to_code[name] = {'DiagnosisCode': code, 'DiagnosisNamePTBR': name, 'DiagnosisCategory': category}
                diag_counter += 1

    proc_counter = 1
    for specialty, pool in PROCEDURE_POOLS.items():
        abbr = SPEC_ABBR[specialty]
        for name, category in pool:
            if name not in proc_name_to_code:
                code = f"P{abbr}{proc_counter:03d}"
                proc_name_to_code[name] = {'ProcedureCode': code, 'ProcedureNamePTBR': name, 'ProcedureCategory': category}
                proc_counter += 1

    return diag_name_to_code, proc_name_to_code


def get_diagnosis_name(old_code: str, specialty: str) -> str:
    import hashlib
    pool = DIAGNOSIS_POOLS.get(specialty, DIAGNOSIS_POOLS['Clínica Geral'])
    idx = int(hashlib.md5(old_code.encode()).hexdigest(), 16) % len(pool)
    return pool[idx][0]


def get_procedure_name(old_code: str, specialty: str) -> str:
    import hashlib
    pool = PROCEDURE_POOLS.get(specialty, PROCEDURE_POOLS['Clínica Geral'])
    idx = int(hashlib.md5(old_code.encode()).hexdigest(), 16) % len(pool)
    return pool[idx][0]


def main():
    print("Carregando dataset...")
    df = pd.read_csv(OUTPUT_DIR / 'enhanced_claims_ptbr.csv')
    print(f"  Shape: {df.shape}")

    # Build canonical maps
    diag_name_to_info, proc_name_to_info = build_canonical_maps()
    print(f"  Diagnósticos canônicos únicos: {len(diag_name_to_info)}")
    print(f"  Procedimentos canônicos únicos: {len(proc_name_to_info)}")

    # Resolve old code → name → canonical code
    df['_DiagnosisName'] = df.apply(lambda r: get_diagnosis_name(r['DiagnosisCode'], r['ProviderSpecialty']), axis=1)
    df['_ProcedureName'] = df.apply(lambda r: get_procedure_name(r['ProcedureCode'], r['ProviderSpecialty']), axis=1)

    df['DiagnosisCode'] = df['_DiagnosisName'].map(lambda n: diag_name_to_info[n]['DiagnosisCode'])
    df['ProcedureCode'] = df['_ProcedureName'].map(lambda n: proc_name_to_info[n]['ProcedureCode'])

    # Update DiagnosisNamePTBR and ProcedureNamePTBR if present
    if 'DiagnosisNamePTBR' in df.columns:
        df['DiagnosisNamePTBR'] = df['_DiagnosisName']
    if 'ProcedureNamePTBR' in df.columns:
        df['ProcedureNamePTBR'] = df['_ProcedureName']

    df = df.drop(columns=['_DiagnosisName', '_ProcedureName'])

    print(f"  DiagnosisCode únicos após correção: {df['DiagnosisCode'].nunique()}")
    print(f"  ProcedureCode únicos após correção: {df['ProcedureCode'].nunique()}")

    # Save updated dataset
    df.to_csv(OUTPUT_DIR / 'enhanced_claims_ptbr.csv', index=False, encoding='utf-8-sig')
    print("  Dataset salvo.")

    # Save clean catalog CSVs
    diag_df = pd.DataFrame(list(diag_name_to_info.values()))
    diag_df.to_csv(OUTPUT_DIR / 'diagnosis_codes.csv', index=False, encoding='utf-8-sig')
    print(f"  diagnosis_codes.csv: {len(diag_df)} registros únicos")

    proc_df = pd.DataFrame(list(proc_name_to_info.values()))
    proc_df.to_csv(OUTPUT_DIR / 'procedure_codes.csv', index=False, encoding='utf-8-sig')
    print(f"  procedure_codes.csv: {len(proc_df)} registros únicos")

    # Verify
    print("\nVerificação:")
    diag_check = pd.read_csv(OUTPUT_DIR / 'diagnosis_codes.csv')
    proc_check = pd.read_csv(OUTPUT_DIR / 'procedure_codes.csv')
    print(f"  diagnosis_codes.csv — duplicatas de nome: {diag_check['DiagnosisNamePTBR'].duplicated().sum()}")
    print(f"  diagnosis_codes.csv — duplicatas de código: {diag_check['DiagnosisCode'].duplicated().sum()}")
    print(f"  procedure_codes.csv — duplicatas de nome: {proc_check['ProcedureNamePTBR'].duplicated().sum()}")
    print(f"  procedure_codes.csv — duplicatas de código: {proc_check['ProcedureCode'].duplicated().sum()}")
    print("\nPrimeiros diagnósticos:")
    print(diag_check.head(8).to_string(index=False))


if __name__ == "__main__":
    main()
