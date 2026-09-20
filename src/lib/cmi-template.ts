// Contenu du Contrato de Mediação Imobiliária (CMI) SAFTI Portugal.
//
// Le texte des clauses ci-dessous est recopié TEL QUEL depuis les modèles
// vierges fournis par l'agence (CMI Exclusivo / Semi-Exclusivo / Não
// Exclusivo — V10, 25/08/2025) : aucune clause n'est reformulée ou inventée.
// Seuls les endroits explicitement variables dans les modèles originaux
// (pointillés à remplir) sont remplacés par les données du mandat.
//
// Les 3 régimes sont identiques mot pour mot SAUF à deux endroits, isolés
// ici : le libellé du régime (Cláusula 1ª, §1) et la Cláusula 8ª dans son
// intégralité. Tout le reste du texte est commun (CLAUSES_COMMUNES).
//
// IMPORTANT : ce fichier engage la responsabilité légale de l'agence. Toute
// mise à jour du modèle SAFTI doit être répercutée ici et relue clause par
// clause avant la première utilisation réelle d'un contrat généré.

export type ContractType = 'exclusivo' | 'semi_exclusivo' | 'nao_exclusivo'

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  exclusivo: 'Exclusivo',
  semi_exclusivo: 'Semi-Exclusivo',
  nao_exclusivo: 'Não Exclusivo',
}

export const CONTRACT_TYPE_REGIME_WORD: Record<ContractType, string> = {
  exclusivo: 'EXCLUSIVIDADE',
  semi_exclusivo: 'SEMI-EXCLUSIVIDADE',
  nao_exclusivo: 'NÃO EXCLUSIVIDADE',
}

// Cláusula 8ª — REGIME DE CONTRATAÇÃO — seule clause dont le texte diffère
// intégralement (au-delà du simple mot) entre les 3 régimes.
export const CLAUSULA_8_REGIME: Record<ContractType, string[]> = {
  exclusivo: [
    '1. O Segundo Contraente celebra com a Mediadora um contrato com regime de exclusividade, determinando, com efeito, que o Segundo Contraente faz-se representar, para efeitos de venda do imóvel, apenas pela Mediadora.',
    '2. O regime de exclusividade previsto no presente contrato implica que só a Mediadora contratada tem o direito de promover o negócio objeto do contrato de mediação imobiliária durante o respetivo período de vigência.',
    '3. Tendo presente o disposto no número anterior, o Segundo Contraente encontra-se obrigado ao pagamento pontual e integral da remuneração prevista na Cláusula 3.ª, n.º 2, ainda que a venda decorra da publicitação do ativo em outras agências de mediação imobiliária.',
    '4. O Segundo Contraente encontra-se obrigado ao pagamento pontual e integral da remuneração prevista na Cláusula 3.ª, n.º 2, nos casos em que o negócio visado não se concretize por causa que lhe seja imputável.',
  ],
  semi_exclusivo: [
    '1. O Segundo Contraente celebra com a Mediadora um contrato com regime de semi-exclusividade, determinando, com efeito, que o Segundo Contraente faz-se representar, para efeitos de venda do imóvel, apenas pela Mediadora.',
    '2. O regime de semi-exclusividade previsto no presente contrato implica que só apenas a Mediadora contratada tem o direito de promover o negócio objeto do contrato de mediação imobiliária durante o respetivo período de vigência.',
    '3. Caso o Segundo Contraente concretize diretamente a transação, pelos seus próprios meios, compromete-se a remunerar a Mediadora em 50% do valor previsto na Cláusula 3.ª, n.º 2.',
  ],
  nao_exclusivo: [
    'O Segundo Contraente celebra com a Mediadora um contrato com regime de não exclusividade, determinando, com efeito, que o presente contrato não prejudica o direito de o Segundo Contraente celebrar contratos de mediação imobiliária com outras mediadoras.',
  ],
}

// MEDIADORA — PRIMEIRA CONTRAENTE (fixe, seul le nom du représentant varie)
export function mediadoraParagraph(representanteName: string): string {
  return `SAFTI Portugal, Unipessoal Lda., pessoa coletiva com sede social sita na Rua Rodrigo da Fonseca, 82, 2º Esq, 1250-193 Lisboa, com o capital social de €50.000 Euros (cinquenta mil Euros), matriculada na Conservatória do Registo Comercial de Braga, com o NIPC 515581712, detentora da licença AMI n.º 17184, emitida pelo Instituto dos Mercados Públicos, do Imobiliário e da Construção I. P. (IMPIC, I. P.), titular do seguro de responsabilidade civil titulado por apólice da seguradora Ocidental com o n.º RC78589672, e com capital seguro de €150.000, neste ato representada por: ${representanteName} na qualidade de Mandatário com poderes para o ato, daqui em diante a "Mediadora".`
}

// Clauses dont le texte est strictement identique dans les 3 régimes.
export const CLAUSULA_2_ONUS_LIVRE = 'O Imóvel encontra-se livre de ónus ou encargos.'

export const CLAUSULA_6_DOCUMENTOS = [
  '1. A Mediadora, na qualidade de mandatária sem representação e sem prejuízo do dever de colaboração do Segundo Contraente, presta os serviços conducentes à obtenção da documentação necessária à concretização do negócio visado pelo presente Contrato.',
  '2. A remuneração da prestação dos serviços referidos no número anterior da presente Cláusula considera-se incluída no valor determinado na Cláusula 3.ª e só será devida nos termos e condições aí descritos.',
  '3. Sem prejuízo do número 2 da presente Cláusula, a Mediadora tem sempre o direito ao reembolso das despesas efetuadas no decurso da prestação dos serviços descritos no número 1 da presente Cláusula, devendo, para o efeito, apresentar fatura titulada por NIF que corresponda à despesa incorrida.',
]

export const CLAUSULA_7_OBRIGACOES = [
  '1. O Segundo Contraente compromete-se a colaborar com a Mediadora de acordo com os princípios da boa-fé contratual, disponibilizando-lhe todos os elementos necessários para o conhecimento das exatas qualidades do Imóvel e apresentação do mesmo ao mercado.',
  '2. O Segundo Contraente declara e garante que, no âmbito das disposições legais aplicáveis de natureza preventiva e repressiva de combate ao branqueamento de capitais e ao financiamento do terrorismo, e em relação a todos os atos e operações abrangidas pelo presente contrato, se obriga a cooperar na disponibilização de informação relevante à Mediadora, designadamente sobre a identidade das partes contratantes, do objeto do negócio imobiliário e dos meios de pagamento das transações imobiliárias.',
  '3. O Segundo Contraente obriga-se ainda a cumprir todas as disposições legais e regulamentares decorrentes do Sistema de Certificação Energética, designadamente a obrigação de providenciar, nos termos e prazos devidos, pela emissão do respetivo Certificado Energético em relação ao imóvel objeto do presente contrato, se aplicável.',
  '4. O Segundo Contraente obriga-se, também, a dar cumprimento às regras referentes à Ficha Técnica da Habitação, nos termos do disposto no Decreto-Lei n.º 68/2004, de 25 de março, nos termos e prazos devidos, se aplicável.',
]

export function clausula9Prazo(months: number): string {
  return `O presente contrato tem uma validade de ${months} meses contados a partir da data da sua celebração renovando-se automaticamente por iguais e sucessivos períodos de tempo, caso não seja denunciado por qualquer das partes contratantes através de carta registada ou outro meio equivalente, com a antecedência mínima de 10 dias em relação ao seu termo.`
}

export const CLAUSULA_10_NUMERARIO =
  'Os intervenientes no presente contrato de mediação imobiliária abstêm-se de celebrar ou de algum modo participar em quaisquer negócios de que resulte a violação dos limites à utilização de numerário previstos no artigo 63.º-E, da Lei Geral Tributária, aprovada pelo Dec. Lei n.º 398/98, de 17 de dezembro, aditado pela Lei n.º 92/2017, de 22 de agosto e de acordo com o artigo 10.º da Lei n.º 83/2017, de 18 de agosto.'

export const CLAUSULA_11_LITIGIOS = [
  '1. Nos termos do disposto no artigo 18.º da Lei n.º 144/2015, de 8 de setembro, na redação atual, em caso de litígio ou insatisfação com o serviço prestado poderá o Segundo Contratante recorrer ao Centro de Arbitragem de Conflitos de Consumo de Lisboa, com o sítio eletrónico na Internet www.centroarbitragemlisboa.pt.',
  '2. O disposto no número anterior não priva o consumidor do direito que lhe assiste de submeter o litígio à apreciação e decisão de um tribunal judicial.',
]

export const CLAUSULA_13_RGPD = [
  '1. Em cumprimento do disposto no Regulamento (EU) 2016/679 do Parlamento Europeu e do Conselho, de 27 de abril atinente ao Regime Geral e Proteção de Dados (RGPD) e legislação conexa, no que diz respeito ao tratamento de dados pessoais e à livre circulação desses dados, o Segundo Contraente autoriza que os seus dados pessoais recolhidos, transmitidos ou processados informaticamente pela Mediadora sejam incorporados na sua base de dados.',
  '2. Os dados referidos no número anterior destinam-se a processamentos administrativos, estatísticos e de apresentação/divulgação de produtos e serviços comercializados.',
  '3. A Mediadora compromete-se a, designadamente, não copiar, reproduzir, adaptar, modificar, alterar, apagar, destruir, divulgar ou por qualquer outra forma colocar à disposição de terceiros os dados pessoais do Segundo Contraente a que tenha tido acesso no âmbito do presente contrato, sem que para tal tenha sido expressamente autorizada, comprometendo-se a utilizá-los exclusivamente para as finalidades referidas no presente Contrato.',
  '4. As Partes declaram que, nos termos e para os efeitos previstos nos artigos 12.º a 23.º do RGPD, a Mediadora informou o Segundo Contraente e este tomou conhecimento dos direitos que lhe assistem relativamente aos seus dados pessoais.',
]

export const CLOSING_TEXT =
  'Depois de lido e ratificado, as partes comprometem-se a cumprir todas as cláusulas deste Contrato que se encontram nas páginas que antecedem e nas seguintes, segundo os ditames da boa-fé, e vão assinar. Feito em duplicado, destinando-se um exemplar a cada uma das partes intervenientes.'

export const BUSINESS_TYPE_LABEL: Record<string, string> = {
  compra: 'Compra',
  trespasse: 'Trespasse',
  arrendamento: 'Arrendamento',
}
