// Contrat de Médiation Immobilière imprimable (A4), reprenant le texte du
// modèle SAFTI V11. Les valeurs saisies sont insérées à la place des pointillés.

import {
  CMI_TYPES, CMI_VERSION, MEDIADORA, DOC_CHECKLIST,
  amountToWords, percentToWords, formatAmount, fmtDate, integerToWords, parseAmount,
  type CmiData, type CmiType, type Owner, type Person,
} from '@/lib/cmi'

/** Valeur insérée dans le texte ; « — » si sans objet ; sinon pointillés à remplir. */
function V({ v, w = 24, na = false }: { v?: string | null; w?: number; na?: boolean }) {
  if (v && v.trim()) return <span className="cmi-v">{v}</span>
  if (na) return <span className="cmi-na">—</span>
  return <span className="cmi-blank" style={{ minWidth: `${w}mm` }} />
}

function B({ on }: { on: boolean }) {
  return <span className="cmi-box">{on ? '✕' : ''}</span>
}

function Opt({ on, children }: { on: boolean; children: React.ReactNode }) {
  return <span className="cmi-opt"><B on={on} /> {children}</span>
}

function Footer({ type, page, total }: { type: CmiType; page: number; total: number }) {
  return (
    <div className="cmi-footer">
      <span>{page}/{total}</span>
      <span>{MEDIADORA.name} | NIPC {MEDIADORA.nipc} | AMI {MEDIADORA.ami}</span>
      <span>Contrato de Mediação Imobiliária {CMI_TYPES[type].pt} – {CMI_VERSION}</span>
    </div>
  )
}

function Initials() {
  return (
    <div className="cmi-initials">
      <div><span>Consultor {MEDIADORA.brand}</span><div className="cmi-sig" /></div>
      <div><span>Proprietário(s)</span><div className="cmi-sig" /></div>
      <p>ASSINATURAS</p>
    </div>
  )
}

function Header({ registo }: { registo: string }) {
  return (
    <div className="cmi-header">
      <span className="cmi-brand">{MEDIADORA.brand}</span>
      <span>Número de registo {MEDIADORA.brand}: <V v={registo} w={30} /></span>
    </div>
  )
}

function docLabel(p: Person) {
  return (
    <>
      <Opt on={p.docTipo === 'cc'}>Cartão de Cidadão</Opt>{' '}
      <Opt on={p.docTipo === 'passaporte'}>Passaporte</Opt>{' '}
      <Opt on={p.docTipo === 'bi'}>Bilhete de Identidade</Opt>{' '}
      n.º: <V v={p.docNumero} /> · Data de Validade: <V v={fmtDate(p.docValidade)} w={18} />
    </>
  )
}

function PersonBlock({ p }: { p: Person }) {
  return (
    <>
      <p><Opt on={p.civ === 'Sr.'}>Sr.</Opt> <Opt on={p.civ === 'Sra.'}>Sra.</Opt> Nome: <V v={p.nome} w={50} /> Apelidos: <V v={p.apelidos} w={50} /></p>
      <p>Data de Nascimento: <V v={fmtDate(p.nascimento)} w={18} /> Naturalidade: <V v={p.naturalidade} /> País: <V v={p.pais} /> Nacionalidade: <V v={p.nacionalidade} /></p>
      <p>Morada: <V v={p.morada} w={70} /> Código Postal: <V v={p.codigoPostal} w={16} /> Localidade: <V v={p.localidade} /> País: <V v={p.paisMorada} w={18} /></p>
      <p>Telefone: <V v={p.telefone} /> E-mail: <V v={p.email} w={40} /></p>
      <p>Documentos de identificação: {docLabel(p)}</p>
      <p>N.º de Identificação Fiscal: <V v={p.nif} /></p>
    </>
  )
}

function OwnerBlock({ o, n }: { o: Owner; n: number }) {
  return (
    <div className="cmi-party">
      <p className="cmi-sub">PROPRIETÁRIO {n}</p>
      <PersonBlock p={o} />
      <p>Estado Civil:{' '}
        <Opt on={o.estadoCivil === 'solteiro'}>Solteiro</Opt>{' '}
        <Opt on={o.estadoCivil === 'casado'}>Casado sob o regime de bens: <V v={o.estadoCivil === 'casado' ? o.regimeBens : ''} w={30} na={!!o.estadoCivil && o.estadoCivil !== 'casado'} /></Opt>{' '}
        <Opt on={o.estadoCivil === 'uniao'}>União de Facto</Opt>{' '}
        <Opt on={o.estadoCivil === 'divorciado'}>Divorciado</Opt>{' '}
        <Opt on={o.estadoCivil === 'viuvo'}>Viúvo</Opt>
      </p>
      <p>Natureza do direito:{' '}
        <Opt on={o.direito === 'plena'}>Propriedade Plena</Opt>{' '}
        <Opt on={o.direito === 'nua'}>Nu-proprietário/a</Opt>{' '}
        <Opt on={o.direito === 'usufruto'}>Usufrutuário/a</Opt>{' '}
        <Opt on={o.direito === 'indiviso'}>Indiviso</Opt>
      </p>
    </div>
  )
}

export default function CmiDocument({ d, type }: { d: CmiData; type: CmiType }) {
  const t = CMI_TYPES[type]
  const im = d.imovel
  const singular = d.ownerKind === 'singular'
  const owners = singular ? d.owners : []
  const extraOwners = owners.slice(2)
  const total = extraOwners.length ? 6 : 5
  const pct = d.remuneracaoModo === 'percent'
  const months = Math.max(1, Math.round(parseAmount(d.duracaoMeses) || 6))
  const [dd, mm, yyyy] = (fmtDate(d.data) || '').split('/')
  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const month = mm ? MONTHS[Number(mm) - 1] : ''

  return (
    <div className="cmi-doc" style={{ ['--cmi-color' as string]: MEDIADORA.color }}>

      {/* ── Page 1 : couverture et documents ── */}
      <div className="cmi-page">
        <h1 className="cmi-title">CONTRATO {t.pt.toUpperCase()}</h1>
        <p className="cmi-big">Número de registo {MEDIADORA.brand}: <V v={d.registo} w={40} /></p>
        <p className="cmi-label">Nome do(s) Proprietário(s):</p>
        <p className="cmi-big"><V v={singular ? owners.map(o => [o.nome, o.apelidos].filter(Boolean).join(' ')).filter(Boolean).join(', ') : d.empresa.firma} w={150} /></p>
        <p className="cmi-label">Nome do Consultor {MEDIADORA.brand}:</p>
        <p className="cmi-big"><V v={d.consultor} w={150} /></p>
        <p className="cmi-label">Lista de documentos necessários:</p>
        <table className="cmi-docs">
          <thead><tr><th>Apresentado</th><th>Recebido</th><th /></tr></thead>
          <tbody>
            {DOC_CHECKLIST.map(doc => (
              <tr key={doc.key}>
                <td><B on={!!d.docs[doc.key]?.apresentado} /></td>
                <td><B on={!!d.docs[doc.key]?.recebido} /></td>
                <td>{doc.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="cmi-label">Outros documentos:</p>
        <p><V v={d.outrosDocs} w={150} na /></p>
        <Initials />
        <Footer type={type} page={1} total={total} />
      </div>

      {/* ── Page 2 : les parties ── */}
      <div className="cmi-page">
        <Header registo={d.registo} />
        <p className="cmi-h">MEDIADORA – PRIMEIRA CONTRAENTE</p>
        <p className="cmi-j">
          {MEDIADORA.name}, pessoa coletiva com sede social sita na {MEDIADORA.address}, com o capital social de {MEDIADORA.capital},
          matriculada na Conservatória do Registo Comercial de {MEDIADORA.conservatoria}, com o NIPC {MEDIADORA.nipc}, detentora da licença AMI n.º {MEDIADORA.ami},
          emitida pelo Instituto dos Mercados Públicos, do Imobiliário e da Construção, I. P. (IMPIC, I. P.), titular do seguro de responsabilidade civil titulado por apólice
          da seguradora {MEDIADORA.insurer} com o n.º {MEDIADORA.policy}, e com capital seguro de {MEDIADORA.insuredCapital}, neste ato
          representada por: <V v={d.consultor} w={60} /> na qualidade de Mandatário com poderes para o ato, daqui em diante a “Mediadora”.
        </p>
        <p className="cmi-h">PROPRIETÁRIO – SEGUNDO CONTRAENTE</p>

        <p className="cmi-sub"><B on={singular} /> PESSOA SINGULAR <span className="cmi-right">Anexo: <Opt on={extraOwners.length > 0}>Sim</Opt> <Opt on={singular && extraOwners.length === 0}>Não</Opt></span></p>
        <p className="cmi-note">Este Contrato deverá ser assinado por todos os proprietários ou por quem, mediante procuração com poderes para tal, os represente.</p>
        {singular ? (
          <>
            {owners.slice(0, 2).map((o, i) => <OwnerBlock key={i} o={o} n={i + 1} />)}
            {owners.length < 2 && <div className="cmi-party"><p className="cmi-sub">PROPRIETÁRIO 2</p><p className="cmi-note">—</p></div>}
          </>
        ) : <p className="cmi-note">—</p>}
        <p className="cmi-note">Se houver mais de dois proprietários, utilize o aditamento para a sua identificação</p>

        <p className="cmi-sub"><B on={!singular} /> PESSOA COLETIVA</p>
        {!singular ? (
          <div className="cmi-party">
            <p>Firma: <V v={d.empresa.firma} w={60} /> Natureza Jurídica: <V v={d.empresa.naturezaJuridica} /></p>
            <p>com o Capital Social de (em euros): <V v={d.empresa.capital} /> matriculada na Conservatória do Registo Comercial de <V v={d.empresa.conservatoria} /></p>
            <p>Sede Social sita em: <V v={d.empresa.sede} w={80} /></p>
            <p>Neste ato representada por: <V v={[d.empresa.representante.nome, d.empresa.representante.apelidos].filter(Boolean).join(' ')} w={50} /> Atuando na qualidade de: <V v={d.empresa.qualidade} /> com poderes para o ato, com domicílio profissional na sede da sua representada</p>
            <p className="cmi-sub">DADOS DO REPRESENTANTE DA PESSOA COLETIVA:</p>
            <PersonBlock p={d.empresa.representante} />
          </div>
        ) : <p className="cmi-note">—</p>}
        <p className="cmi-note">Se houver mais de um representante, utilize o aditamento para a sua identificação</p>
        <p>daqui em diante o “Segundo Contraente”</p>
        <Initials />
        <Footer type={type} page={2} total={total} />
      </div>

      {/* ── Page 3 : considérations et clauses 1 à 6 ── */}
      <div className="cmi-page cmi-small">
        <Header registo={d.registo} />
        <p className="cmi-h">CONSIDERAÇÕES</p>
        <p>Considerando que:</p>
        <p className="cmi-j">A. O Segundo Contraente é legítimo possuidor e proprietário da fração autónoma / do prédio destinado a:</p>
        <p className="cmi-ind">
          <Opt on={im.destino === 'fracao'}>a. Habitação – Fração Autónoma</Opt>{' '}
          <Opt on={im.destino === 'predio'}>b. Habitação – Prédio</Opt>{' '}
          <Opt on={im.destino === 'comercial'}>c. Estabelecimento comercial</Opt>{' '}
          ( <Opt on={im.natureza === 'rustico'}>rústico</Opt> / <Opt on={im.natureza === 'urbano'}>urbano</Opt> / <Opt on={im.natureza === 'misto'}>misto</Opt> )
        </p>
        <p className="cmi-j cmi-ind">
          constituído por <V v={im.divisoes} w={10} /> divisões assoalhadas, com área total de <V v={im.area} w={14} /> m²,
          sito na (Rua, Avenida) <V v={im.morada} w={60} />, (freguesia) <V v={im.freguesia} />, (concelho) <V v={im.concelho} />,
          descrito na Conservatória do Registo Predial de <V v={im.conservatoria} />, sob o n.º <V v={im.registoNumero} w={14} />, da freguesia <V v={im.registoFreguesia} />,
          com Licença de construção/utilização n.º: <V v={d.licencaIsenta ? 'isento' : im.licencaNumero} w={14} /> emitida pela Câmara Municipal de <V v={im.licencaCamara} na={d.licencaIsenta} /> em <V v={fmtDate(im.licencaData)} w={18} na={d.licencaIsenta} />
          {' '}e inscrito na matriz predial ( <Opt on={im.matriz === 'urbana'}>urbana</Opt> / <Opt on={im.matriz === 'rustica'}>rústica</Opt> ), com o artigo n.º <V v={im.artigo} w={14} /> da freguesia de <V v={im.matrizFreguesia} />, concelho
          de <V v={im.matrizConcelho} />, e com certificado energético n.º <V v={im.certificadoNumero} />, válido até <V v={fmtDate(im.certificadoValidade)} w={18} />, doravante designado por “Imóvel”;
        </p>
        <p className="cmi-j">B. A Mediadora é uma sociedade comercial que se dedica, entre outros, à prestação de serviços de mediação imobiliária;</p>
        <p className="cmi-j">C. As Partes acordam em celebrar o presente Contrato de Mediação Imobiliária (“o Contrato”), que é regido pelos considerandos precedentes e pelas seguintes cláusulas:</p>

        <p className="cmi-h">Cláusula 1.ª – OBJETO</p>
        <p className="cmi-j">1. Pelo presente Contrato, o Segundo Contraente contrata em regime de {t.regime} os serviços de mediação imobiliária da Mediadora, e esta obriga-se a prestar os referidos serviços nos termos prescritos no presente Contrato.</p>
        <p className="cmi-j">2. A Mediadora obriga-se a diligenciar no sentido de conseguir interessado na{' '}
          <Opt on={d.negocio.compra}>Compra</Opt> <Opt on={d.negocio.trespasse}>Trespasse</Opt> <Opt on={d.negocio.arrendamento}>Arrendamento</Opt> do Imóvel, pelo preço de
          Quantia <V v={d.preco && formatAmount(d.preco)} w={30} /> € — Por extenso <V v={amountToWords(d.preco)} w={70} /> Euros,
          desenvolvendo, para o efeito, ações de promoção e recolha de informações sobre os negócios pretendidos e características dos respetivos imóveis.</p>
        <p className="cmi-j">3. Qualquer alteração ao preço determinado no número precedente deverá ser comunicada de imediato e por escrito à Mediadora.</p>
        <p className="cmi-j">4. (eventual) Para além dos serviços mencionados no n.º 2 da presente Cláusula, a Mediadora poderá também prestar serviços de recolha de documentação relativa ao imóvel e às Partes interessadas, mediante retribuição no valor de
          Quantia <V v={d.servicoDocs ? formatAmount(d.servicoDocsValor) : ''} w={24} na={!d.servicoDocs} /> € — Por extenso <V v={d.servicoDocs ? amountToWords(d.servicoDocsValor) : ''} w={60} na={!d.servicoDocs} /> Euros</p>

        <p className="cmi-h">Cláusula 2.ª – ÓNUS OU ENCARGOS</p>
        <p><Opt on={d.onusLivre}>O Imóvel encontra-se livre de ónus ou encargos.</Opt></p>
        <p className="cmi-j"><Opt on={!d.onusLivre}>O Segundo Contraente declara que sobre o imóvel descrito no número anterior recaem os seguintes ónus e encargos</Opt>{' '}
          <Opt on={!d.onusLivre && d.onusTipo === 'hipotecas'}>hipotecas</Opt> / <Opt on={!d.onusLivre && d.onusTipo === 'penhoras'}>penhoras</Opt> / <Opt on={!d.onusLivre && d.onusTipo === 'ambas'}>hipotecas e penhoras</Opt>{' '}
          Pelo valor <V v={!d.onusLivre ? formatAmount(d.onusValor) : ''} w={30} na={d.onusLivre} /> €</p>

        <p className="cmi-h">Cláusula 3.ª – REMUNERAÇÃO</p>
        <p className="cmi-j">1. A remuneração só será devida se a Mediadora conseguir interessado que concretize o negócio visado pelo presente contrato, nos termos e com as exceções previstas no artigo 19.º da Lei n.º 15/2013, de 8 de fevereiro.</p>
        <p className="cmi-j">2. O Segundo Contraente obriga-se a pagar à Mediadora a título de remuneração:{' '}
          <Opt on={pct}><V v={pct ? d.remuneracaoPct : ''} w={10} na={!pct} /> % do preço pelo qual o negócio é efetivamente concretizado (por extenso <V v={pct ? percentToWords(d.remuneracaoPct) : ''} w={30} na={!pct} /> %)</Opt>{' '}
          Ou <Opt on={!pct}>A quantia de <V v={!pct ? formatAmount(d.remuneracaoValor) : ''} w={20} na={pct} /> € (por extenso <V v={!pct ? amountToWords(d.remuneracaoValor) : ''} w={40} na={pct} /> euros)</Opt></p>
        <p className="cmi-j">3. Aos valores acima indicados, acresce IVA à taxa legal em vigor.</p>
        <p className="cmi-j">4. O pagamento da remuneração apenas será efetuado nas seguintes condições:{' '}
          <Opt on={d.pagamento === 'escritura'}>O total da remuneração aquando da celebração da escritura ou conclusão do negócio visado.</Opt>{' '}
          <Opt on={d.pagamento === 'faseado'}><V v={d.pagamento === 'faseado' ? d.pagamentoPctCpcv : ''} w={10} na={d.pagamento !== 'faseado'} /> % após a celebração do contrato-promessa e o remanescente de <V v={d.pagamento === 'faseado' ? d.pagamentoPctEscritura : ''} w={10} na={d.pagamento !== 'faseado'} /> % com a celebração da escritura ou conclusão do negócio.</Opt></p>
        <p className="cmi-j">5. O direito à remuneração não é afastado pelo exercício de direito legal ou contratual de preferência sobre o imóvel.</p>

        <p className="cmi-h">Cláusula 4.ª – ANGARIADOR IMOBILIÁRIO</p>
        <p className="cmi-j">Na preparação do presente contrato de mediação imobiliária colaborou o Angariador Imobiliário (nome) <V v={d.angariadorNA ? '' : d.angariador.nome} w={50} na={d.angariadorNA} />, portador do
          Cartão de Cidadão/Bilhete de Identidade n.º <V v={d.angariadorNA ? '' : d.angariador.documento} na={d.angariadorNA} /> e titular do NIF <V v={d.angariadorNA ? '' : d.angariador.nif} na={d.angariadorNA} />
          {' '}Telefone: <V v={d.angariadorNA ? '' : d.angariador.telefone} na={d.angariadorNA} /> E-mail profissional <V v={d.angariadorNA ? '' : d.angariador.email} w={40} na={d.angariadorNA} /></p>

        <p className="cmi-h">Cláusula 5.ª – FORO COMPETENTE</p>
        <p className="cmi-j">Para dirimirem quaisquer litígios emergentes da execução do presente contrato, as partes acordam entre si estabelecer como competente o Foro da Comarca de
          {' '}<V v={d.foroNA ? '' : d.foro} na={d.foroNA} />, com a expressa renúncia a qualquer outro. (Esta cláusula é facultativa e só deverá ser preenchida se as partes assim o pretenderem e acordarem.)</p>

        <p className="cmi-h">Cláusula 6.ª – OBTENÇÃO DE DOCUMENTOS</p>
        <p className="cmi-j">1. A Mediadora, na qualidade de mandatária sem representação e sem prejuízo do dever de colaboração do Segundo Contraente, presta os serviços conducentes à obtenção da documentação necessária à concretização do negócio visado pelo presente Contrato.</p>
        <p className="cmi-j">2. A remuneração da prestação dos serviços referidos no número anterior da presente Cláusula considera-se incluída no valor determinado na Cláusula 3.ª e só será devida nos termos e condições aí descritos.</p>
        <p className="cmi-j">3. Sem prejuízo do número 2 da presente Cláusula, a Mediadora tem sempre o direito ao reembolso das despesas efetuadas no decurso da prestação dos serviços descritos no número 1 da presente Cláusula, devendo, para o efeito, apresentar fatura titulada por NIF que corresponda à despesa incorrida.</p>
        <Initials />
        <Footer type={type} page={3} total={total} />
      </div>

      {/* ── Page 4 : clauses 7 à 13 et signatures ── */}
      <div className="cmi-page cmi-small">
        <Header registo={d.registo} />
        <p className="cmi-h">Cláusula 7.ª – OBRIGAÇÕES DO SEGUNDO CONTRAENTE</p>
        <p className="cmi-j">1. O Segundo Contraente compromete-se a colaborar com a Mediadora de acordo com os princípios da boa-fé contratual, disponibilizando-lhe todos os elementos necessários para o conhecimento das exatas qualidades do Imóvel e apresentação do mesmo ao mercado.</p>
        <p className="cmi-j">2. O Segundo Contraente declara e garante que, no âmbito das disposições legais aplicáveis de natureza preventiva e repressiva de combate ao branqueamento de capitais e ao financiamento do terrorismo, e em relação a todos os atos e operações abrangidas pelo presente contrato, se obriga a cooperar na disponibilização de informação relevante à Mediadora, designadamente sobre a identidade das partes contratantes, do objeto do negócio imobiliário e dos meios de pagamento das transações imobiliárias.</p>
        <p className="cmi-j">3. O Segundo Contraente obriga-se ainda a cumprir todas as disposições legais e regulamentares decorrentes do Sistema de Certificação Energética, designadamente a obrigação de providenciar, nos termos e prazos devidos, pela emissão do respetivo Certificado Energético em relação ao imóvel objeto do presente contrato, se aplicável.</p>
        <p className="cmi-j">4. O Segundo Contraente obriga-se, também, a dar cumprimento às regras referentes à Ficha Técnica da Habitação, nos termos do disposto no Decreto-Lei n.º 68/2004, de 25 de março, nos termos e prazos devidos, se aplicável.</p>

        <p className="cmi-h">Cláusula 8.ª – REGIME DE CONTRATAÇÃO</p>
        {type === 'exclusivo' && <>
          <p className="cmi-j">1. O Segundo Contraente celebra com a Mediadora um contrato com regime de exclusividade, determinando, com efeito, que o Segundo Contraente se faz representar, para efeitos de venda do imóvel, apenas pela Mediadora.</p>
          <p className="cmi-j">2. O regime de exclusividade previsto no presente contrato implica que só a Mediadora contratada tem o direito de promover o negócio objeto do contrato de mediação imobiliária durante o respetivo período de vigência.</p>
          <p className="cmi-j">3. Tendo presente o disposto no número anterior, o Segundo Contraente encontra-se obrigado ao pagamento pontual e integral da remuneração prevista na Cláusula 3.ª, n.º 2, ainda que a venda decorra da publicitação do ativo em outras agências de mediação imobiliária.</p>
          <p className="cmi-j">4. O Segundo Contraente encontra-se obrigado ao pagamento pontual e integral da remuneração prevista na Cláusula 3.ª, n.º 2, nos casos em que o negócio visado não se concretize por causa que lhe seja imputável.</p>
        </>}
        {type === 'semi_exclusivo' && <>
          <p className="cmi-j">1. O Segundo Contraente celebra com a Mediadora um contrato com regime de semi-exclusividade, determinando, com efeito, que o Segundo Contraente se faz representar, para efeitos de venda do imóvel, apenas pela Mediadora.</p>
          <p className="cmi-j">2. O regime de semi-exclusividade previsto no presente contrato implica que apenas a Mediadora contratada tem o direito de promover o negócio objeto do contrato de mediação imobiliária durante o respetivo período de vigência.</p>
          <p className="cmi-j">3. Caso o Segundo Contraente concretize diretamente a transação, pelos seus próprios meios, compromete-se a remunerar a Mediadora em 50% do valor previsto na Cláusula 3.ª, n.º 2.</p>
        </>}
        {type === 'nao_exclusivo' && (
          <p className="cmi-j">O Segundo Contraente celebra com a Mediadora um contrato com regime de não exclusividade, determinando, com efeito, que o presente contrato não prejudica o direito de o Segundo Contraente celebrar contratos de mediação imobiliária com outras mediadoras.</p>
        )}

        <p className="cmi-h">Cláusula 9.ª – PRAZO DE DURAÇÃO DO CONTRATO</p>
        <p className="cmi-j">O presente contrato tem uma validade de {months} ({integerToWords(months)}) {months === 1 ? 'mês' : 'meses'} contados a partir da data da sua celebração, renovando-se automaticamente por iguais e sucessivos períodos de tempo, caso não seja denunciado por qualquer das partes contratantes através de carta registada ou outro meio equivalente, com a antecedência mínima de 10 dias em relação ao seu termo.</p>

        <p className="cmi-h">Cláusula 10.ª – LIMITES AOS PAGAMENTOS EM NUMERÁRIO</p>
        <p className="cmi-j">Os intervenientes no presente contrato de mediação imobiliária abstêm-se de celebrar ou de algum modo participar em quaisquer negócios de que resulte a violação dos limites à utilização de numerário previstos no artigo 63.º-E da Lei Geral Tributária, aprovada pelo Decreto-Lei n.º 398/98, de 17 de dezembro, aditado pela Lei n.º 92/2017, de 22 de agosto, e de acordo com o artigo 10.º da Lei n.º 83/2017, de 18 de agosto.</p>

        <p className="cmi-h">Cláusula 11.ª – RESOLUÇÃO ALTERNATIVA DE LITÍGIOS</p>
        <p className="cmi-j">1. Nos termos do disposto no artigo 18.º da Lei n.º 144/2015, de 8 de setembro, na redação atual, em caso de litígio ou insatisfação com o serviço prestado poderá o Segundo Contraente recorrer ao Centro de Arbitragem de Conflitos de Consumo de Lisboa, com o sítio eletrónico na Internet www.centroarbitragemlisboa.pt</p>
        <p className="cmi-j">2. O disposto no número anterior não priva o consumidor do direito que lhe assiste de submeter o litígio à apreciação e decisão de um tribunal judicial.</p>

        <p className="cmi-h">Cláusula 12.ª – CONDIÇÕES PARTICULARES</p>
        {d.condicoes.trim()
          ? <p className="cmi-j cmi-v-block">{d.condicoes}</p>
          : <p><V na /></p>}

        <p className="cmi-h">Cláusula 13.ª – PROTEÇÃO DE DADOS PESSOAIS</p>
        <p className="cmi-j">1. Em cumprimento do disposto no Regulamento (UE) 2016/679 do Parlamento Europeu e do Conselho, de 27 de abril de 2016 (Regulamento Geral sobre a Proteção de Dados – RGPD), e na legislação conexa, no que diz respeito ao tratamento de dados pessoais e à livre circulação desses dados, o Segundo Contraente autoriza que os seus dados pessoais recolhidos, transmitidos ou processados informaticamente pela Mediadora sejam incorporados na sua base de dados.</p>
        <p className="cmi-j">2. Os dados referidos no número anterior destinam-se a processamentos administrativos, estatísticos e de apresentação/divulgação de produtos e serviços comercializados.</p>
        <p className="cmi-j">3. A Mediadora compromete-se a, designadamente, não copiar, reproduzir, adaptar, modificar, alterar, apagar, destruir, divulgar ou por qualquer outra forma colocar à disposição de terceiros os dados pessoais do Segundo Contraente a que tenha tido acesso no âmbito do presente contrato, sem que para tal tenha sido expressamente autorizada, comprometendo-se a utilizá-los exclusivamente para as finalidades referidas no presente Contrato.</p>
        <p className="cmi-j">4. As Partes declaram que, nos termos e para os efeitos previstos nos artigos 12.º a 23.º do RGPD, a Mediadora informou o Segundo Contraente e este tomou conhecimento dos direitos que lhe assistem relativamente aos seus dados pessoais.</p>

        <p className="cmi-j" style={{ marginTop: '4mm' }}>Depois de lido e ratificado, as partes comprometem-se a cumprir todas as cláusulas deste Contrato que se encontram nas páginas que antecedem e nas seguintes, segundo os ditames da boa-fé, e vão assinar. Feito em duplicado, destinando-se um exemplar a cada uma das partes intervenientes, em <V v={d.local} w={30} />,
          {' '}<V v={dd} w={8} /> de <V v={month} w={20} /> de <V v={yyyy} w={12} /></p>
        <div className="cmi-final-sig">
          <div><p>PELA MEDIADORA</p><div className="cmi-sig" /></div>
          <div><p>SEGUNDO CONTRAENTE</p><div className="cmi-sig" /></div>
        </div>
        <Footer type={type} page={4} total={total} />
      </div>

      {/* ── Page 5 : formulaire de résiliation ── */}
      <div className="cmi-page">
        <Header registo={d.registo} />
        <p className="cmi-h">ANEXO 1 – FORMULÁRIO DE RESCISÃO</p>
        <p className="cmi-note">Não preencher ao assinar o Contrato. Se desejar rescindir o contrato, preencha e envie este formulário para:</p>
        <p>{MEDIADORA.name}, {MEDIADORA.address} ou digitalizado para o e-mail {MEDIADORA.email}</p>
        <p className="cmi-j">Eu/Nós (*) notifico/notificamos (*) pelo presente a rescisão do contrato de mediação imobiliária relativo ao imóvel identificado no mesmo:</p>
        <p>N.º de registo: <V v={d.registo} w={30} /> · Consultor {MEDIADORA.brand}: <V v={d.consultor} w={50} /></p>
        <p>Nome/nomes (*) do/dos (*) signatário/signatários (*): <V w={100} /></p>
        <p><V w={180} /></p>
        <p>Morada do/dos (*) signatário/signatários (*): <V w={100} /></p>
        <p><V w={180} /></p>
        <p>Data: <V w={40} /></p>
        <p>Assinatura do/dos (*) signatário/signatários (*): <V w={100} /></p>
        <p className="cmi-note">(*) Riscar o que não se aplica</p>
        <Footer type={type} page={5} total={total} />
      </div>

      {/* ── Aditamento : propriétaires 3 et suivants ── */}
      {extraOwners.length > 0 && (
        <div className="cmi-page">
          <Header registo={d.registo} />
          <p className="cmi-h">ADITAMENTO – IDENTIFICAÇÃO DOS PROPRIETÁRIOS ADICIONAIS</p>
          {extraOwners.map((o, i) => <OwnerBlock key={i} o={o} n={i + 3} />)}
          <Initials />
          <Footer type={type} page={6} total={total} />
        </div>
      )}
    </div>
  )
}

export const CMI_DOC_CSS = `
.cmi-doc { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 8.6pt; line-height: 1.45; }
.cmi-page { width: 210mm; min-height: 297mm; padding: 12mm 13mm 18mm; margin: 0 auto 8mm; background: #fff; position: relative; box-shadow: 0 1px 6px rgba(0,0,0,.12); box-sizing: border-box; overflow: hidden; }
.cmi-small { font-size: 7.4pt; line-height: 1.38; }
.cmi-page p { margin: 0 0 1.4mm; }
.cmi-title { font-size: 20pt; font-weight: 800; color: var(--cmi-color); margin: 6mm 0 10mm; letter-spacing: .5px; }
.cmi-big { font-size: 10.5pt; margin-bottom: 5mm !important; }
.cmi-label { font-weight: 700; margin-top: 5mm !important; }
.cmi-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid var(--cmi-color); padding-bottom: 2mm; margin-bottom: 3mm; }
.cmi-brand { font-weight: 900; font-size: 13pt; color: var(--cmi-color); letter-spacing: 1px; }
.cmi-h { font-weight: 700; color: var(--cmi-color); margin-top: 2.6mm !important; text-transform: none; }
.cmi-sub { font-weight: 700; margin-top: 2mm !important; }
.cmi-note { font-style: italic; color: #555; }
.cmi-j { text-align: justify; }
.cmi-ind { padding-left: 4mm; }
.cmi-right { float: right; font-weight: 400; }
.cmi-party { border-left: 2px solid #eee; padding-left: 3mm; margin: 1mm 0 2mm; }
.cmi-v { font-weight: 700; color: #0b2a6f; border-bottom: 1px dotted #999; padding: 0 1px; }
.cmi-v-block { font-weight: 600; color: #0b2a6f; white-space: pre-wrap; }
.cmi-na { font-weight: 700; padding: 0 2mm; }
.cmi-blank { display: inline-block; border-bottom: 1px dotted #777; height: 1em; vertical-align: baseline; }
.cmi-box { display: inline-flex; width: 3mm; height: 3mm; border: 1px solid #333; align-items: center; justify-content: center; font-size: 7pt; font-weight: 700; vertical-align: -0.4mm; line-height: 1; }
.cmi-opt { white-space: normal; }
.cmi-docs { width: 100%; border-collapse: collapse; margin-top: 2mm; }
.cmi-docs th { font-size: 7.5pt; text-align: left; font-weight: 600; color: #555; padding-bottom: 1mm; }
.cmi-docs th:nth-child(-n+2), .cmi-docs td:nth-child(-n+2) { width: 20mm; }
.cmi-docs td { padding: 1.2mm 0; vertical-align: top; border-bottom: 1px solid #f0f0f0; }
.cmi-initials { position: absolute; left: 13mm; right: 13mm; bottom: 10mm; display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; font-size: 7pt; color: #555; }
.cmi-initials p { grid-column: 1 / -1; text-align: center; margin: -1mm 0 0 !important; letter-spacing: 2px; font-size: 6.5pt; }
.cmi-initials .cmi-sig { height: 9mm; border: 1px solid #ddd; border-radius: 1mm; margin-top: 1mm; }
.cmi-final-sig { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; margin-top: 4mm; font-weight: 700; }
.cmi-final-sig .cmi-sig { height: 14mm; border-bottom: 1px solid #333; }
.cmi-footer { position: absolute; left: 13mm; right: 13mm; bottom: 4mm; display: flex; justify-content: space-between; gap: 4mm; font-size: 6.3pt; color: #777; border-top: 1px solid #eee; padding-top: 1mm; }
.cmi-page:has(.cmi-initials) { padding-bottom: 34mm; }
.cmi-editing .cmi-page { outline: 2px dashed #93c5fd; outline-offset: -1px; cursor: text; }
.cmi-editing [contenteditable], .cmi-editing { caret-color: #2563eb; }
@media print {
  /* Safari ignore « margin: 0 » et impose ses propres marges (~6 mm) : on
     prévoit donc 6 mm partout et une page de 280 mm, qui tient dans la zone
     imprimable de tous les navigateurs (sinon une page blanche s'intercale). */
  @page { size: A4; margin: 6mm; }
  html, body, main { background: #fff !important; padding: 0 !important; margin: 0 !important; min-height: 0 !important; }
  .no-print { display: none !important; }
  .cmi-page { width: auto; margin: 0 !important; box-shadow: none; outline: none !important; height: 280mm; min-height: 0; overflow: hidden;
    padding: 4mm 7mm 12mm; page-break-after: always; break-after: page; page-break-inside: avoid; break-inside: avoid; }
  .cmi-page:has(.cmi-initials) { padding-bottom: 27mm; }
  .cmi-initials { left: 7mm; right: 7mm; bottom: 6mm; }
  .cmi-footer { left: 7mm; right: 7mm; bottom: 0; }
  .cmi-page:last-child { page-break-after: auto; break-after: auto; }
  .cmi-v { color: #000; }
  .cmi-v-block { color: #000; }
}
`
