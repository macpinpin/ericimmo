import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import type { Property, PropertyMandate, PropertyOwner } from './types'
import {
  CONTRACT_TYPE_LABEL,
  CONTRACT_TYPE_REGIME_WORD,
  CLAUSULA_8_REGIME,
  mediadoraParagraph,
  CLAUSULA_2_ONUS_LIVRE,
  CLAUSULA_6_DOCUMENTOS,
  CLAUSULA_7_OBRIGACOES,
  clausula9Prazo,
  CLAUSULA_10_NUMERARIO,
  CLAUSULA_11_LITIGIOS,
  CLAUSULA_13_RGPD,
  CLOSING_TEXT,
  BUSINESS_TYPE_LABEL,
} from './cmi-template'
import { priceInWords, percentInWords } from './pt-number-words'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { fontSize: 7, color: '#666', marginBottom: 14, textAlign: 'center' },
  title: { fontSize: 13, fontWeight: 700, marginBottom: 10, textAlign: 'center' },
  sectionTitle: { fontSize: 9, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  clauseTitle: { fontSize: 9.5, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  p: { marginBottom: 4, lineHeight: 1.4, textAlign: 'justify' },
  small: { fontSize: 8, color: '#444', lineHeight: 1.4 },
  bold: { fontWeight: 700 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  signatureBlock: { width: '45%' },
  signatureLine: { borderTopWidth: 1, borderTopColor: '#333', marginTop: 30, paddingTop: 4, textAlign: 'center', fontSize: 8 },
})

function fmtDate(d: string | null | undefined): string {
  if (!d) return '……/……/……………'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}

function ownerLabel(o: PropertyOwner): string {
  if (o.kind === 'coletiva') return o.company_name || '……………'
  return [o.first_name, o.last_name].filter(Boolean).join(' ') || '……………'
}

function OwnerBlock({ owner, index }: { owner: PropertyOwner; index: number }) {
  if (owner.kind === 'coletiva') {
    return (
      <View style={{ marginBottom: 6 }}>
        <Text style={styles.bold}>PROPRIETÁRIO {index + 1} (Pessoa Coletiva)</Text>
        <Text style={styles.p}>
          Firma: {owner.company_name || '……'} · Natureza Jurídica: {owner.legal_nature || '……'} · Capital Social: {owner.share_capital ? `${owner.share_capital} €` : '……'}
        </Text>
        <Text style={styles.p}>
          Matriculada na Conservatória do Registo Comercial de {owner.registry_office || '……'} · Sede Social: {owner.registered_office || '……'}
        </Text>
        <Text style={styles.p}>
          NIF: {owner.nif || '……'}
        </Text>
        <Text style={styles.p}>
          Representada por: {owner.rep_first_name || ''} {owner.rep_last_name || ''}, na qualidade de {owner.rep_capacity || '……'}, {owner.rep_id_doc_type || 'Cartão de Cidadão'} n.º {owner.rep_id_doc_number || '……'}, NIF {owner.rep_nif || '……'}
        </Text>
      </View>
    )
  }
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={styles.bold}>PROPRIETÁRIO {index + 1}</Text>
      <Text style={styles.p}>
        {owner.civility || ''} {owner.first_name || '……'} {owner.last_name || '……'}
      </Text>
      <Text style={styles.p}>
        Data de Nascimento: {fmtDate(owner.birth_date)} · Naturalidade: {owner.birth_place || '……'} · Nacionalidade: {owner.nationality || '……'}
      </Text>
      <Text style={styles.p}>
        Morada: {owner.address || '……'}, {owner.postal_code || '……'} {owner.locality || '……'}, {owner.country || 'Portugal'}
      </Text>
      <Text style={styles.p}>
        Telefone: {owner.phone || '……'} · E-mail: {owner.email || '……'}
      </Text>
      <Text style={styles.p}>
        Estado Civil: {owner.marital_status || '……'}{owner.marital_regime ? ` (regime de bens: ${owner.marital_regime})` : ''} · Natureza do direito: {owner.ownership_nature || '……'}
      </Text>
      <Text style={styles.p}>
        {owner.id_doc_type || 'Cartão de Cidadão'} n.º {owner.id_doc_number || '……'}, válido até {fmtDate(owner.id_doc_expiry)} · NIF: {owner.nif || '……'}
      </Text>
    </View>
  )
}

export async function generateCmiPdf(property: Property, mandate: PropertyMandate, agentName: string): Promise<Buffer> {
  const type = mandate.contract_type
  const footerTitle = `Contrato de Mediação Imobiliária ${CONTRACT_TYPE_LABEL[type]} – Gerado por Habiteo`
  const owners = mandate.owners.length ? mandate.owners : ([{ kind: 'singular' }] as PropertyOwner[])
  const price = mandate.price ?? property.price

  const propertyKind =
    property.type === 'commercial' ? 'Estabelecimento comercial' : 'Habitação – Fração Autónoma / Prédio'

  const considerandos = `O Segundo Contraente é legítimo possuidor e proprietário da fração autónoma / do prédio destinado a ${propertyKind}, constituído por ${property.bedrooms ?? '……'} divisões assoalhadas, com área total de ${property.area_bruta_privativa ?? '……'} m², sito na ${property.location}, freguesia de ${property.freguesia || '……'}, concelho de ${property.concelho || '……'}${property.conservatoria_registo ? `, descrito na Conservatória do Registo Predial de ${property.conservatoria_registo}` : ''}${property.conservatoria_numero ? ` sob o n.º ${property.conservatoria_numero}` : ''}${property.matriz_artigo ? `, inscrito na matriz predial urbana com o artigo n.º ${property.matriz_artigo}` : ''}${property.certificado_energetico_numero ? `, com certificado energético n.º ${property.certificado_energetico_numero}${property.certificado_energetico_validade ? `, válido até ${fmtDate(property.certificado_energetico_validade)}` : ''}` : ''}, doravante designado por "Imóvel".`

  return renderToBuffer(
    <Document title={`CMI - ${property.title}`}>
      {/* Page de couverture / liste de documents */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{footerTitle}</Text>
        <Text style={styles.title}>CONTRATO {CONTRACT_TYPE_LABEL[type].toUpperCase()}</Text>
        <Text style={styles.sectionTitle}>Proprietário(s)</Text>
        <Text style={styles.p}>{owners.map(ownerLabel).join(', ')}</Text>
        <Text style={styles.sectionTitle}>Consultor SAFTI</Text>
        <Text style={styles.p}>{agentName}</Text>
        <Text style={styles.sectionTitle}>Lista de documentos necessários</Text>
        {[
          'Bilhete de Identidade e Cartão de Contribuinte ou Cartão de Cidadão',
          'Em caso de Pessoa Coletiva, Certidão do Registo Comercial e documento de identificação do(s) representante(s)',
          'Certidão de Teor ou Certidão do Registo Predial',
          'Caderneta Predial',
          'Licença de Habitabilidade/Utilização (para imóveis de construção posterior a 1951)',
          'Ficha Técnica do Imóvel (para licenças posteriores a março de 2004)',
          'Planta do Imóvel',
          'Certificado Energético',
          'Procuração (se necessário)',
        ].map((doc, i) => (
          <Text key={i} style={styles.small}>• {doc}</Text>
        ))}
      </Page>

      {/* Corps du contrat */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{footerTitle}</Text>

        <Text style={styles.sectionTitle}>MEDIADORA – PRIMEIRA CONTRAENTE</Text>
        <Text style={styles.p}>{mediadoraParagraph(agentName)}</Text>

        <Text style={styles.sectionTitle}>PROPRIETÁRIO – SEGUNDO CONTRAENTE</Text>
        {owners.map((o, i) => <OwnerBlock key={i} owner={o} index={i} />)}

        <Text style={styles.sectionTitle}>CONSIDERAÇÕES</Text>
        <Text style={styles.p}>Considerando que:</Text>
        <Text style={styles.p}>A. {considerandos}</Text>
        <Text style={styles.p}>B. A Mediadora é uma sociedade comercial que se dedica, entre outros, à prestação de serviços de mediação imobiliária;</Text>
        <Text style={styles.p}>C. As Partes acordam em celebrar o presente Contrato de Mediação Imobiliária (&quot;o Contrato&quot;), que é regido pelos considerandos precedentes e pelas seguintes cláusulas:</Text>
      </Page>

      {/* Clauses */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{footerTitle}</Text>

        <Text style={styles.clauseTitle}>Cláusula 1ª – OBJETO</Text>
        <Text style={styles.p}>
          1. Pelo presente Contrato, o Segundo Contraente contrata em regime de {CONTRACT_TYPE_REGIME_WORD[type]} os serviços de mediação imobiliária da Mediadora, e esta, obriga-se a prestar os referidos serviços nos termos prescritos no presente Contrato.
        </Text>
        <Text style={styles.p}>
          2. A Mediadora obriga-se a diligenciar no sentido de conseguir interessado na {BUSINESS_TYPE_LABEL[mandate.business_type]} do Imóvel, pelo preço de Quantia {price?.toLocaleString('pt-PT')} € (por extenso: {price ? priceInWords(price) : '……'}), desenvolvendo, para o efeito, ações de promoção e recolha de informações sobre os negócios pretendidos e características dos respetivos imóveis.
        </Text>
        <Text style={styles.p}>3. Qualquer alteração ao preço determinado no número precedente deverá ser comunicada de imediato e por escrito à Mediadora.</Text>
        {mandate.additional_service_fee ? (
          <Text style={styles.p}>
            4. Para além dos serviços mencionados no n.º 2 da presente Cláusula, a Mediadora poderá também prestar serviços de recolha de documentação relativa ao imóvel e às Partes interessadas, mediante retribuição no valor de Quantia {mandate.additional_service_fee.toLocaleString('pt-PT')} € (por extenso: {priceInWords(mandate.additional_service_fee)}).
          </Text>
        ) : null}

        <Text style={styles.clauseTitle}>Cláusula 2ª – ÓNUS OU ENCARGOS</Text>
        <Text style={styles.p}>{mandate.liens_free ? CLAUSULA_2_ONUS_LIVRE : `O Segundo Contratante declara que sobre o imóvel recaem os seguintes ónus e encargos: ${mandate.liens_description || '……'}`}</Text>

        <Text style={styles.clauseTitle}>Cláusula 3ª – REMUNERAÇÃO</Text>
        <Text style={styles.p}>1. A remuneração só será devida se a Mediadora conseguir interessado que concretize o negócio visado pelo presente contrato, nos termos e com as exceções previstas no artigo 19º da Lei n.º15/2013, de 8 de Fevereiro.</Text>
        <Text style={styles.p}>
          2. O Segundo Contratante obriga-se a pagar à Mediadora a título de remuneração:{' '}
          {mandate.commission_type === 'percentage'
            ? `${mandate.commission_percentage ?? '……'}% do preço pelo qual o negócio é efetivamente concretizado (por extenso: ${mandate.commission_percentage != null ? percentInWords(mandate.commission_percentage) : '……'}).`
            : `a quantia de ${mandate.commission_fixed_amount?.toLocaleString('pt-PT') ?? '……'} € (por extenso: ${mandate.commission_fixed_amount != null ? priceInWords(mandate.commission_fixed_amount) : '……'}).`}
        </Text>
        <Text style={styles.p}>3. Aos valores acima indicados, acresce IVA à taxa legal em vigor.</Text>
        <Text style={styles.p}>
          4. O pagamento da remuneração apenas será efetuado nas seguintes condições:{' '}
          {mandate.payment_full_at_deed
            ? 'o total da remuneração aquando da celebração da escritura ou conclusão do negócio visado.'
            : `${mandate.payment_split_promissory_pct ?? '……'}% após a celebração do contrato-promessa e o remanescente de ${mandate.payment_split_deed_pct ?? '……'}% com a celebração da escritura ou conclusão do negócio.`}
        </Text>
        <Text style={styles.p}>5. O direito à remuneração não é afastado pelo exercício de direito legal ou contratual de preferência sobre o imóvel.</Text>

        <Text style={styles.clauseTitle}>Cláusula 4ª – ANGARIADOR IMOBILIÁRIO</Text>
        <Text style={styles.p}>
          Na preparação do presente contrato de mediação imobiliária colaborou o Angariador Imobiliário {mandate.lister_name || agentName}, portador do Cartão de Cidadão/Bilhete de Identidade n.º {mandate.lister_id_doc || '……'} e titular do NIF {mandate.lister_nif || '……'}. Telefone: {mandate.lister_phone || '……'} · E-mail profissional: {mandate.lister_email || '……'}
        </Text>

        <Text style={styles.clauseTitle}>Cláusula 5ª – FORO COMPETENTE</Text>
        <Text style={styles.p}>
          {mandate.competent_court
            ? `Para dirimirem quaisquer litígios emergentes da execução do presente contrato, as partes acordam entre si, estabelecer como competente o Foro da Comarca de ${mandate.competent_court}, com a expressa renúncia a qualquer outro.`
            : '(Cláusula facultativa — nenhum foro específico acordado entre as partes.)'}
        </Text>

        <Text style={styles.clauseTitle}>Cláusula 6ª – OBTENÇÃO DE DOCUMENTOS</Text>
        {CLAUSULA_6_DOCUMENTOS.map((t, i) => <Text key={i} style={styles.p}>{t}</Text>)}

        <Text style={styles.clauseTitle}>Cláusula 7ª – OBRIGAÇÕES DO SEGUNDO CONTRAENTE</Text>
        {CLAUSULA_7_OBRIGACOES.map((t, i) => <Text key={i} style={styles.p}>{t}</Text>)}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{footerTitle}</Text>

        <Text style={styles.clauseTitle}>Cláusula 8ª – REGIME DE CONTRATAÇÃO</Text>
        {CLAUSULA_8_REGIME[type].map((t, i) => <Text key={i} style={styles.p}>{t}</Text>)}

        <Text style={styles.clauseTitle}>Cláusula 9ª – PRAZO DE DURAÇÃO DE CONTRATO</Text>
        <Text style={styles.p}>{clausula9Prazo(mandate.contract_duration_months)}</Text>

        <Text style={styles.clauseTitle}>Cláusula 10ª – LIMITES AOS PAGAMENTOS EM NUMERÁRIO</Text>
        <Text style={styles.p}>{CLAUSULA_10_NUMERARIO}</Text>

        <Text style={styles.clauseTitle}>Cláusula 11ª – RESOLUÇÃO ALTERNATIVA DE LITÍGIOS</Text>
        {CLAUSULA_11_LITIGIOS.map((t, i) => <Text key={i} style={styles.p}>{t}</Text>)}

        <Text style={styles.clauseTitle}>Cláusula 12ª – CONDIÇÕES PARTICULARES</Text>
        <Text style={styles.p}>{mandate.special_conditions || '(Nenhuma condição particular.)'}</Text>

        <Text style={styles.clauseTitle}>Cláusula 13ª – PROTEÇÃO DE DADOS PESSOAIS</Text>
        {CLAUSULA_13_RGPD.map((t, i) => <Text key={i} style={styles.p}>{t}</Text>)}

        <Text style={[styles.p, { marginTop: 14 }]}>{CLOSING_TEXT}</Text>

        <View style={styles.row}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>PELA MEDIADORA{'\n'}{agentName}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>SEGUNDO CONTRAENTE{'\n'}{owners.map(ownerLabel).join(', ')}</Text>
          </View>
        </View>
      </Page>

      {/* Annexe 1 — formulaire de résiliation */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{footerTitle}</Text>
        <Text style={styles.sectionTitle}>ANEXO 1 – FORMULÁRIO DE RESCISÃO</Text>
        <Text style={styles.small}>Não preencher ao assinar o Contrato — Se desejar rescindir o contrato por favor complete e envie este formulário para: SAFTI Portugal, Unipessoal Lda., Rua Rodrigo da Fonseca, 82, 2ºEsq, 1250-193 Lisboa ou digitalizado para o e-mail contacto@safti.pt</Text>
        <Text style={[styles.p, { marginTop: 10 }]}>Eu/Nós (*) notifico/notificamos (*) pelo presente a rescisão do contrato de mediação imobiliária do imóvel mencionado:</Text>
        <Text style={styles.p}>Endereço da propriedade sujeita ao mandato: {property.location}</Text>
        <Text style={styles.p}>Consultor SAFTI: {mandate.lister_name || agentName}</Text>
        <Text style={styles.p}>Nome/nomes (*) do/dos (*) signatário/signatários (*): ……………………………………………………………</Text>
        <Text style={styles.p}>Morada do/dos (*) signatário/signatários (*): ……………………………………………………………</Text>
        <Text style={styles.p}>Data: ……………………………………………………………</Text>
        <Text style={styles.p}>Assinatura do/dos (*) signatário/signatários (*): ……………………………………………………………</Text>
        <Text style={[styles.small, { marginTop: 10 }]}>(*) Riscar o que não se aplica</Text>
      </Page>
    </Document>
  )
}
