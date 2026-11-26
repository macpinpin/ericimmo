// Contrat de Médiation Immobilière imprimable (A4). Texte et mise en page du
// modèle SAFTI V11 (couverture, barres de titre orange, propriétaires sur deux
// colonnes, bloc « ASSINATURAS »). Les valeurs saisies remplacent les pointillés.

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

function Bar({ children }: { children: React.ReactNode }) {
  return <div className="cmi-bar">{children}</div>
}

function Footer({ type, page, total }: { type: CmiType; page: number; total: number }) {
  return (
    <div className="cmi-foot">
      <div className="cmi-pnum">{page}/{total}</div>
      <div className="cmi-footline">
        <span>{MEDIADORA.name} | NIPC {MEDIADORA.nipc} | AMI {MEDIADORA.ami}</span>
        <span>Contrato de Mediação Imobiliária {CMI_TYPES[type].pt} – {CMI_VERSION}</span>
      </div>
    </div>
  )
}

function Initials({ left }: { left?: React.ReactNode }) {
  return (
    <div className="cmi-initials-row">
      <div className="cmi-initials-left">{left}</div>
      <div className="cmi-initials">
        <div className="cmi-init-labels"><span>Consultor {MEDIADORA.brand}</span><span>Proprietário(s)</span></div>
        <div className="cmi-init-bar"><b>ASSINATURAS</b><i /><i /></div>
      </div>
    </div>
  )
}

function RegBox({ registo, variant }: { registo: string; variant: 'cover' | 'page' }) {
  return (
    <div className={variant === 'cover' ? 'cmi-reg cmi-reg-cover' : 'cmi-reg cmi-reg-page'}>
      <span>Número de registo {MEDIADORA.brand}:</span>
      <span className="cmi-reg-box">{registo || '…………………………'}</span>
    </div>
  )
}

/** Logo SAFTI simplifié (maison + nom). */
function Logo() {
  return (
    <div className="cmi-logo">
      <svg viewBox="0 0 40 34" aria-hidden="true">
        <path d="M3 16 L20 3 L37 16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 14 V31 H32 V14" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        <rect x="16" y="20" width="8" height="11" rx="1" fill="currentColor" />
      </svg>
      <div>
        <span className="cmi-logo-name">{MEDIADORA.brand}</span>
        <span className="cmi-logo-tag">A chave do teu sorriso</span>
      </div>
    </div>
  )
}

// ── Propriétaire / représentant sur deux colonnes ──────────────────────

function PersonLeft({ p }: { p: Person }) {
  return (
    <>
      <p><Opt on={p.civ === 'Sr.'}>Sr.</Opt> <Opt on={p.civ === 'Sra.'}>Sra.</Opt></p>
      <p>Nome: <V v={p.nome} w={60} /></p>
      <p>Apelidos: <V v={p.apelidos} w={70} /></p>
      <p>Data de Nascimento: <V v={fmtDate(p.nascimento)} w={18} /> Naturalidade: <V v={p.naturalidade} w={28} /></p>
      <p>País: <V v={p.pais} w={22} /> Nacionalidade: <V v={p.nacionalidade} w={28} /></p>
      <p><b>Morada</b>: <V v={p.morada} w={75} /></p>
      <p>Código Postal: <V v={p.codigoPostal} w={18} /> Localidade: <V v={p.localidade} w={32} /></p>
      <p>País: <V v={p.paisMorada} w={30} /></p>
      <p>Telefone: <V v={p.telefone} w={22} /> E-mail: <V v={p.email} w={40} /></p>
    </>
  )
}

function DocFields({ p, nif = true }: { p: Person; nif?: boolean }) {
  return (
    <>
      <p className="cmi-lbl">Documentos de identificação:</p>
      <p>
        <Opt on={p.docTipo === 'cc'}>Cartão de Cidadão</Opt>{' '}
        <Opt on={p.docTipo === 'passaporte'}>Passaporte</Opt>{' '}
        <Opt on={p.docTipo === 'bi'}>Bilhete de Identidade</Opt> n.º: <V v={p.docNumero} w={20} />
      </p>
      <p>Data de Validade: <V v={fmtDate(p.docValidade)} w={22} /></p>
      {nif && <p className="cmi-gap">N.º de Identificação Fiscal: <V v={p.nif} w={22} /></p>}
    </>
  )
}

function OwnerBlock({ o, n }: { o: Owner; n: number }) {
  return (
    <div className="cmi-owner">
      <p className="cmi-owner-title">PROPRIETÁRIO {n}</p>
      <div className="cmi-2col">
        <div><PersonLeft p={o} /></div>
        <div>
          <p className="cmi-lbl">Estado Civil:</p>
          <p><Opt on={o.estadoCivil === 'solteiro'}>Solteiro</Opt></p>
          <p><Opt on={o.estadoCivil === 'casado'}>Casado sob o regime de bens:</Opt> <V v={o.estadoCivil === 'casado' ? o.regimeBens : ''} w={30} na={!!o.estadoCivil && o.estadoCivil !== 'casado'} /></p>
          <p><Opt on={o.estadoCivil === 'uniao'}>União de Facto</Opt></p>
          <p><Opt on={o.estadoCivil === 'divorciado'}>Divorciado</Opt> <Opt on={o.estadoCivil === 'viuvo'}>Viúvo</Opt></p>
          <p className="cmi-lbl cmi-gap">Natureza do direito:</p>
          <p>
            <Opt on={o.direito === 'plena'}>Propriedade Plena</Opt>{' '}
            <Opt on={o.direito === 'nua'}>Nu-proprietário/a</Opt>{' '}
            <Opt on={o.direito === 'usufruto'}>Usufrutuário/a</Opt>{' '}
            <Opt on={o.direito === 'indiviso'}>Indiviso</Opt>
          </p>
          <div className="cmi-gap"><DocFields p={o} /></div>
        </div>
      </div>
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
  const faseado = d.pagamento === 'faseado'
  const months = Math.max(1, Math.round(parseAmount(d.duracaoMeses) || 6))
  const [dd, mm, yyyy] = (fmtDate(d.data) || '').split('/')
  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const month = mm ? MONTHS[Number(mm) - 1] : ''
  const rep = d.empresa.representante
  const ang = d.angariadorNA ? null : d.angariador
  const SC = <b>Segundo Contraente</b>
  const MED = <b>Mediadora</b>

  return (
    <div className="cmi-doc" style={{ ['--cmi-color' as string]: MEDIADORA.color }}>

      {/* ── Page 1 : couverture et documents ── */}
      <div className="cmi-page cmi-p1">
        <div className="cmi-cover">
          <div className="cmi-cover-left">
            <Logo />
            <h1>CONTRATO DE<br />MEDIAÇÃO<br />IMOBILIÁRIA</h1>
            <p className="cmi-cover-sub">CONTRATO {t.pt.toUpperCase()}</p>
          </div>
          <div className="cmi-cover-right">
            <div className="cmi-slogan">Juntos conseguiremos que o teu projeto imobiliário seja um êxito!</div>
            <div className="cmi-diamonds"><i /><i /><i /><i /></div>
          </div>
        </div>
        <RegBox registo={d.registo} variant="cover" />

        <p className="cmi-u">Nome do(s) Proprietário(s):</p>
        <p className="cmi-fill"><V v={singular ? owners.map(o => [o.nome, o.apelidos].filter(Boolean).join(' ')).filter(Boolean).join(', ') : d.empresa.firma} w={180} /></p>
        <p className="cmi-u">Nome do Consultor {MEDIADORA.brand}:</p>
        <p className="cmi-fill"><V v={d.consultor} w={180} /></p>

        <p className="cmi-u">Lista de documentos necessários:</p>
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
        <p className="cmi-gap2">Outros documentos:</p>
        <p className="cmi-fill"><V v={d.outrosDocs} w={180} na /></p>
        <Initials />
        <Footer type={type} page={1} total={total} />
      </div>

      {/* ── Page 2 : les parties ── */}
      <div className="cmi-page cmi-p2">
        <RegBox registo={d.registo} variant="page" />
        <Bar>MEDIADORA – PRIMEIRA CONTRAENTE</Bar>
        <p className="cmi-j">
          <b>{MEDIADORA.name}</b>, pessoa coletiva com sede social sita na {MEDIADORA.address}, com o capital social de {MEDIADORA.capital},
          matriculada na Conservatória do Registo Comercial de {MEDIADORA.conservatoria}, com o NIPC {MEDIADORA.nipc}, detentora da licença AMI n.º {MEDIADORA.ami},
          emitida pelo Instituto dos Mercados Públicos, do Imobiliário e da Construção, I. P. (IMPIC, I. P.), titular do seguro de responsabilidade civil titulado por apólice
          da seguradora {MEDIADORA.insurer} com o n.º {MEDIADORA.policy}, e com capital seguro de {MEDIADORA.insuredCapital}, neste ato
          representada por: <V v={d.consultor} w={60} /> na qualidade de Mandatário com poderes para o ato, daqui em diante a “<b>Mediadora</b>”.
        </p>
        <Bar>PROPRIETÁRIO – SEGUNDO CONTRAENTE</Bar>

        <div className="cmi-kind"><span><B on={singular} /> <b className="cmi-u">PESSOA SINGULAR</b></span>
          <span className="cmi-annex"><b>Anexo:</b> <Opt on={extraOwners.length > 0}>Sim</Opt> <Opt on={singular && extraOwners.length === 0}>Não</Opt></span></div>
        <p className="cmi-orange-i">Este Contrato deverá ser assinado por todos os proprietários ou por quem, mediante procuração com poderes para tal, os represente.</p>
        {singular ? (
          <>
            {owners.slice(0, 2).map((o, i) => <OwnerBlock key={i} o={o} n={i + 1} />)}
            {owners.length < 2 && <div className="cmi-owner"><p className="cmi-owner-title">PROPRIETÁRIO 2</p><p><V na /></p></div>}
          </>
        ) : <p><V na /></p>}
        <p className="cmi-orange">Se houver mais de dois proprietários, utilize o aditamento para a sua identificação</p>

        <div className="cmi-kind cmi-gap2"><span><B on={!singular} /> <b className="cmi-u">PESSOA COLETIVA</b></span></div>
        {!singular ? (
          <>
            <p className="cmi-orange-i">Todos os campos devem ser preenchidos</p>
            <div className="cmi-2col">
              <div>
                <p>Firma: <V v={d.empresa.firma} w={60} /></p>
                <p>Natureza Jurídica: <V v={d.empresa.naturezaJuridica} w={50} /></p>
                <p>com o Capital Social de (em euros): <V v={d.empresa.capital} w={30} /></p>
                <p>matriculada na Conservatória do Registo Comercial de <V v={d.empresa.conservatoria} w={25} /></p>
              </div>
              <div>
                <p>Sede Social sita em: <V v={d.empresa.sede} w={55} /></p>
                <p>Neste ato representada por: <V v={[rep.nome, rep.apelidos].filter(Boolean).join(' ')} w={45} /></p>
                <p>Atuando na qualidade de: <V v={d.empresa.qualidade} w={45} /></p>
                <p>com poderes para o ato, com domicílio profissional na sede da sua representada</p>
              </div>
            </div>
            <p className="cmi-u cmi-i cmi-gap"><b>DADOS DO REPRESENTANTE DA PESSOA COLETIVA</b>:</p>
            <div className="cmi-2col">
              <div><PersonLeft p={rep} /></div>
              <div>
                <p className="cmi-lbl">Dados de contacto do representante:</p>
                <p>Telefone: <V v={rep.telefone} w={22} /> E-mail: <V v={rep.email} w={35} /></p>
                <div className="cmi-gap"><DocFields p={rep} nif={false} /></div>
              </div>
            </div>
          </>
        ) : <p><V na /></p>}
        <Initials left={<>
          <p>Se houver mais de um representante, utilize o aditamento para a sua identificação</p>
          <p>daqui em diante o “<b>Segundo Contraente</b>”</p>
        </>} />
        <Footer type={type} page={2} total={total} />
      </div>

      {/* ── Page 3 : considérations et clauses 1 à 6 ── */}
      <div className="cmi-page cmi-small">
        <Bar>CONSIDERAÇÕES</Bar>
        <p><b>Considerando que:</b></p>
        <ol className="cmi-ol cmi-alpha">
          <li>
            <b>O Segundo Contraente</b> é legítimo possuidor e proprietário da fração autónoma / do prédio destinado a:
            <ol className="cmi-ol cmi-sub-alpha">
              <li><Opt on={im.destino === 'fracao'}>Habitação – Fração Autónoma</Opt> ( <Opt on={im.destino === 'fracao' && im.natureza === 'rustico'}>rústico</Opt> / <Opt on={im.destino === 'fracao' && im.natureza === 'urbano'}>urbano</Opt> / <Opt on={im.destino === 'fracao' && im.natureza === 'misto'}>misto</Opt> )</li>
              <li><Opt on={im.destino === 'predio'}>Habitação – Prédio</Opt> ( <Opt on={im.destino === 'predio' && im.natureza === 'rustico'}>rústico</Opt> / <Opt on={im.destino === 'predio' && im.natureza === 'urbano'}>urbano</Opt> / <Opt on={im.destino === 'predio' && im.natureza === 'misto'}>misto</Opt> )</li>
              <li><Opt on={im.destino === 'comercial'}>Estabelecimento comercial</Opt></li>
            </ol>
            <div className="cmi-lines">
              <p>constituído por <V v={im.divisoes} w={14} /> divisões assoalhadas, com área total de <V v={im.area} w={18} /> m²,</p>
              <p>sito na (Rua, Avenida) <V v={im.morada} w={70} />, (freguesia) <V v={im.freguesia} w={30} />, (concelho) <V v={im.concelho} w={25} />,</p>
              <p>descrito na Conservatória do Registo Predial de <V v={im.conservatoria} w={45} />, sob o n.º <V v={im.registoNumero} w={14} />, da freguesia <V v={im.registoFreguesia} w={35} />,</p>
              <p>com Licença de construção/utilização n.º: <V v={d.licencaIsenta ? 'isento' : im.licencaNumero} w={16} /> emitida pela Câmara Municipal de <V v={im.licencaCamara} w={35} na={d.licencaIsenta} /> em <V v={fmtDate(im.licencaData)} w={20} na={d.licencaIsenta} /></p>
              <p>e inscrito na matriz predial ( <Opt on={im.matriz === 'urbana'}>urbana</Opt> / <Opt on={im.matriz === 'rustica'}>rústica</Opt> ), com o artigo n.º <V v={im.artigo} w={20} /> da freguesia de <V v={im.matrizFreguesia} w={40} />, concelho</p>
              <p>de <V v={im.matrizConcelho} w={25} />, e com certificado energético n.º <V v={im.certificadoNumero} w={35} />, válido até <V v={fmtDate(im.certificadoValidade)} w={20} />, doravante designado por “<b>Imóvel</b>”;</p>
            </div>
          </li>
          <li>A <b>Mediadora</b> é uma sociedade comercial que se dedica, entre outros, à prestação de serviços de mediação imobiliária;</li>
          <li>As Partes acordam em celebrar o presente Contrato de Mediação Imobiliária (“o Contrato”), que é regido pelos considerandos precedentes e pelas seguintes cláusulas:</li>
        </ol>

        <Bar>Cláusula 1.ª – OBJETO</Bar>
        <ol className="cmi-ol">
          <li>Pelo presente Contrato, o {SC} contrata em regime de {t.regime} os serviços de mediação imobiliária da {MED}, e esta obriga-se a prestar os referidos serviços nos termos prescritos no presente Contrato.</li>
          <li>A {MED} obriga-se a diligenciar no sentido de conseguir interessado na <Opt on={d.negocio.compra}>Compra</Opt> <Opt on={d.negocio.trespasse}>Trespasse</Opt> <Opt on={d.negocio.arrendamento}>Arrendamento</Opt> do Imóvel, pelo preço de
            <div className="cmi-lines">
              <p>Quantia <V v={d.preco && formatAmount(d.preco)} w={150} /> €</p>
              <p>Por extenso <V v={amountToWords(d.preco)} w={150} /> Euros</p>
            </div>
            desenvolvendo, para o efeito, ações de promoção e recolha de informações sobre os negócios pretendidos e características dos respetivos imóveis.</li>
          <li>Qualquer alteração ao preço determinado no número precedente deverá ser comunicada de imediato e por escrito à {MED}.</li>
          <li><b><i>(eventual)</i></b> Para além dos serviços mencionados no n.º 2 da presente Cláusula, a {MED} poderá também prestar serviços de recolha de documentação relativa ao imóvel e às Partes interessadas, mediante retribuição no valor de
            <div className="cmi-lines">
              <p>Quantia <V v={d.servicoDocs ? formatAmount(d.servicoDocsValor) : ''} w={150} na={!d.servicoDocs} /> €</p>
              <p>Por extenso <V v={d.servicoDocs ? amountToWords(d.servicoDocsValor) : ''} w={150} na={!d.servicoDocs} /> Euros</p>
            </div>
          </li>
        </ol>

        <Bar>Cláusula 2.ª – ÓNUS OU ENCARGOS</Bar>
        <p><Opt on={d.onusLivre}>O Imóvel encontra-se livre de ónus ou encargos.</Opt></p>
        <p><Opt on={!d.onusLivre}>O {SC} declara que sobre o imóvel descrito no número anterior recaem os seguintes ónus e encargos</Opt></p>
        <div className="cmi-lines cmi-ind2">
          <p><Opt on={!d.onusLivre && d.onusTipo === 'hipotecas'}>hipotecas</Opt> / <Opt on={!d.onusLivre && d.onusTipo === 'penhoras'}>penhoras</Opt> / <Opt on={!d.onusLivre && d.onusTipo === 'ambas'}>hipotecas e penhoras</Opt></p>
          <p>Pelo valor <V v={!d.onusLivre ? formatAmount(d.onusValor) : ''} w={60} na={d.onusLivre} /> €</p>
        </div>

        <Bar>Cláusula 3.ª – REMUNERAÇÃO</Bar>
        <ol className="cmi-ol">
          <li>A remuneração só será devida se a {MED} conseguir interessado que concretize o negócio visado pelo presente contrato, nos termos e com as exceções previstas no artigo 19.º da Lei n.º 15/2013, de 8 de fevereiro.</li>
          <li>O {SC} obriga-se a pagar à {MED} a título de remuneração:
            <div className="cmi-rem">
              <div>
                <p><B on={pct} /> <V v={pct ? d.remuneracaoPct : ''} w={16} na={!pct} /> % do preço pelo qual o negócio é efetivamente concretizado</p>
                <p>Por extenso <V v={pct ? percentToWords(d.remuneracaoPct) : ''} w={45} na={!pct} /> %</p>
              </div>
              <div className="cmi-ou"><b className="cmi-u">Ou</b></div>
              <div>
                <p><B on={!pct} /> A quantia de <V v={!pct ? formatAmount(d.remuneracaoValor) : ''} w={30} na={pct} /> €</p>
                <p>Por extenso <V v={!pct ? amountToWords(d.remuneracaoValor) : ''} w={45} na={pct} /> euros</p>
              </div>
            </div>
          </li>
          <li><b className="cmi-u">Aos valores acima indicados, acresce IVA à taxa legal em vigor.</b></li>
          <li>O pagamento da remuneração apenas será efetuado nas seguintes condições:
            <div className="cmi-lines">
              <p><Opt on={!faseado}>O total da remuneração aquando da celebração da escritura ou conclusão do negócio visado.</Opt></p>
              <p><B on={faseado} /> <V v={faseado ? d.pagamentoPctCpcv : ''} w={14} na={!faseado} /> % após a celebração do contrato-promessa e o remanescente de <V v={faseado ? d.pagamentoPctEscritura : ''} w={14} na={!faseado} /> % com a celebração da escritura ou conclusão do negócio.</p>
            </div>
          </li>
          <li>O direito à remuneração não é afastado pelo exercício de direito legal ou contratual de preferência sobre o imóvel.</li>
        </ol>

        <Bar>Cláusula 4.ª – ANGARIADOR IMOBILIÁRIO</Bar>
        <div className="cmi-lines cmi-ind2">
          <p>Na preparação do presente contrato de mediação imobiliária colaborou o Angariador Imobiliário (nome) <V v={ang?.nome} w={60} na={!ang} />, portador do</p>
          <p>Cartão de Cidadão/Bilhete de Identidade n.º <V v={ang?.documento} w={40} na={!ang} /> e titular do NIF <V v={ang?.nif} w={35} na={!ang} /></p>
          <p>Telefone: <V v={ang?.telefone} w={40} na={!ang} /> E-mail profissional <V v={ang?.email} w={70} na={!ang} /></p>
        </div>

        <Bar>Cláusula 5.ª – FORO COMPETENTE</Bar>
        <div className="cmi-lines cmi-ind2">
          <p>Para dirimirem quaisquer litígios emergentes da execução do presente contrato, as partes acordam entre si estabelecer como competente o Foro da Comarca de</p>
          <p><V v={d.foroNA ? '' : d.foro} w={30} na={d.foroNA} />, com a expressa renúncia a qualquer outro. (Esta cláusula é facultativa e só deverá ser preenchida se as partes assim o pretenderem e acordarem.)</p>
        </div>

        <Bar>Cláusula 6.ª – OBTENÇÃO DE DOCUMENTOS</Bar>
        <ol className="cmi-ol">
          <li>A {MED}, na qualidade de mandatária sem representação e sem prejuízo do dever de colaboração do {SC}, presta os serviços conducentes à obtenção da documentação necessária à concretização do negócio visado pelo presente <b>Contrato</b>.</li>
          <li>A remuneração da prestação dos serviços referidos no número anterior da presente Cláusula considera-se incluída no valor determinado na Cláusula 3.ª e só será devida nos termos e condições aí descritos.</li>
          <li>Sem prejuízo do número 2 da presente Cláusula, a {MED} tem sempre o direito ao reembolso das despesas efetuadas no decurso da prestação dos serviços descritos no número 1 da presente Cláusula, devendo, para o efeito, apresentar fatura titulada por NIF que corresponda à despesa incorrida.</li>
        </ol>
        <Initials />
        <Footer type={type} page={3} total={total} />
      </div>

      {/* ── Page 4 : clauses 7 à 13 et signatures ── */}
      <div className="cmi-page cmi-small">
        <Bar>Cláusula 7.ª – OBRIGAÇÕES DO SEGUNDO CONTRAENTE</Bar>
        <ol className="cmi-ol">
          <li>O {SC} compromete-se a colaborar com a {MED} de acordo com os princípios da boa-fé contratual, disponibilizando-lhe todos os elementos necessários para o conhecimento das exatas qualidades do Imóvel e apresentação do mesmo ao mercado.</li>
          <li>O {SC} declara e garante que, no âmbito das disposições legais aplicáveis de natureza preventiva e repressiva de combate ao branqueamento de capitais e ao financiamento do terrorismo, e em relação a todos os atos e operações abrangidas pelo presente contrato, se obriga a cooperar na disponibilização de informação relevante à {MED}, designadamente sobre a identidade das partes contratantes, do objeto do negócio imobiliário e dos meios de pagamento das transações imobiliárias.</li>
          <li>O {SC} obriga-se ainda a cumprir todas as disposições legais e regulamentares decorrentes do Sistema de Certificação Energética, designadamente a obrigação de providenciar, nos termos e prazos devidos, pela emissão do respetivo Certificado Energético em relação ao imóvel objeto do presente contrato, se aplicável.</li>
          <li>O {SC} obriga-se, também, a dar cumprimento às regras referentes à Ficha Técnica da Habitação, nos termos do disposto no Decreto-Lei n.º 68/2004, de 25 de março, nos termos e prazos devidos, se aplicável.</li>
        </ol>

        <Bar>Cláusula 8.ª – REGIME DE CONTRATAÇÃO</Bar>
        {type === 'exclusivo' && (
          <ol className="cmi-ol">
            <li>O {SC} celebra com a {MED} um contrato com regime de exclusividade, determinando, com efeito, que o {SC} se faz representar, para efeitos de venda do imóvel, apenas pela {MED}.</li>
            <li>O regime de exclusividade previsto no presente contrato implica que só a {MED} contratada tem o direito de promover o negócio objeto do contrato de mediação imobiliária durante o respetivo período de vigência.</li>
            <li>Tendo presente o disposto no número anterior, o {SC} encontra-se obrigado ao pagamento pontual e integral da remuneração prevista na Cláusula 3.ª, n.º 2, ainda que a venda decorra da publicitação do ativo em outras agências de mediação imobiliária.</li>
            <li>O {SC} encontra-se obrigado ao pagamento pontual e integral da remuneração prevista na Cláusula 3.ª, n.º 2, nos casos em que o negócio visado não se concretize por causa que lhe seja imputável.</li>
          </ol>
        )}
        {type === 'semi_exclusivo' && (
          <ol className="cmi-ol">
            <li>O {SC} celebra com a {MED} um contrato com regime de semi-exclusividade, determinando, com efeito, que o {SC} se faz representar, para efeitos de venda do imóvel, apenas pela {MED}.</li>
            <li>O regime de semi-exclusividade previsto no presente contrato implica que apenas a {MED} contratada tem o direito de promover o negócio objeto do contrato de mediação imobiliária durante o respetivo período de vigência.</li>
            <li>Caso o {SC} concretize diretamente a transação, pelos seus próprios meios, compromete-se a remunerar a {MED} em 50% do valor previsto na Cláusula 3.ª, n.º 2.</li>
          </ol>
        )}
        {type === 'nao_exclusivo' && (
          <p className="cmi-j">O {SC} celebra com a {MED} um contrato com regime de não exclusividade, determinando, com efeito, que o presente contrato não prejudica o direito de o {SC} celebrar contratos de mediação imobiliária com outras mediadoras.</p>
        )}

        <Bar>Cláusula 9.ª – PRAZO DE DURAÇÃO DO CONTRATO</Bar>
        <p className="cmi-j">O presente contrato tem uma validade de {months} ({integerToWords(months)}) {months === 1 ? 'mês' : 'meses'} contados a partir da data da sua celebração, renovando-se automaticamente por iguais e sucessivos períodos de tempo, caso não seja denunciado por qualquer das partes contratantes através de carta registada ou outro meio equivalente, com a antecedência mínima de 10 dias em relação ao seu termo.</p>

        <Bar>Cláusula 10.ª – LIMITES AOS PAGAMENTOS EM NUMERÁRIO</Bar>
        <p className="cmi-j">Os intervenientes no presente contrato de mediação imobiliária abstêm-se de celebrar ou de algum modo participar em quaisquer negócios de que resulte a violação dos limites à utilização de numerário previstos no artigo 63.º-E da Lei Geral Tributária, aprovada pelo Decreto-Lei n.º 398/98, de 17 de dezembro, aditado pela Lei n.º 92/2017, de 22 de agosto, e de acordo com o artigo 10.º da Lei n.º 83/2017, de 18 de agosto.</p>

        <Bar>Cláusula 11.ª – RESOLUÇÃO ALTERNATIVA DE LITÍGIOS</Bar>
        <ol className="cmi-ol">
          <li>Nos termos do disposto no artigo 18.º da Lei n.º 144/2015, de 8 de setembro, na redação atual, em caso de litígio ou insatisfação com o serviço prestado poderá o {SC} recorrer ao Centro de Arbitragem de Conflitos de Consumo de Lisboa, com o sítio eletrónico na Internet www.centroarbitragemlisboa.pt</li>
          <li>O disposto no número anterior não priva o consumidor do direito que lhe assiste de submeter o litígio à apreciação e decisão de um tribunal judicial.</li>
        </ol>

        <Bar>Cláusula 12.ª – CONDIÇÕES PARTICULARES</Bar>
        {d.condicoes.trim()
          ? <p className="cmi-j cmi-v-block">{d.condicoes}</p>
          : <p><V na /></p>}

        <Bar>Cláusula 13.ª – PROTEÇÃO DE DADOS PESSOAIS</Bar>
        <ol className="cmi-ol">
          <li>Em cumprimento do disposto no Regulamento (UE) 2016/679 do Parlamento Europeu e do Conselho, de 27 de abril de 2016 (Regulamento Geral sobre a Proteção de Dados – RGPD), e na legislação conexa, no que diz respeito ao tratamento de dados pessoais e à livre circulação desses dados, o {SC} autoriza que os seus dados pessoais recolhidos, transmitidos ou processados informaticamente pela {MED} sejam incorporados na sua base de dados.</li>
          <li>Os dados referidos no número anterior destinam-se a processamentos administrativos, estatísticos e de apresentação/divulgação de produtos e serviços comercializados.</li>
          <li>A {MED} compromete-se a, designadamente, não copiar, reproduzir, adaptar, modificar, alterar, apagar, destruir, divulgar ou por qualquer outra forma colocar à disposição de terceiros os dados pessoais do {SC} a que tenha tido acesso no âmbito do presente contrato, sem que para tal tenha sido expressamente autorizada, comprometendo-se a utilizá-los exclusivamente para as finalidades referidas no presente Contrato.</li>
          <li>As <b>Partes</b> declaram que, nos termos e para os efeitos previstos nos artigos 12.º a 23.º do RGPD, a {MED} informou o {SC} e este tomou conhecimento dos direitos que lhe assistem relativamente aos seus dados pessoais.</li>
        </ol>

        <p className="cmi-closing">Depois de lido e ratificado, as partes comprometem-se a cumprir todas as cláusulas deste Contrato que se encontram nas páginas que antecedem e nas seguintes, segundo os ditames da boa-fé, e vão assinar. Feito em duplicado, destinando-se um exemplar a cada uma das partes intervenientes, em <V v={d.local} w={45} />,
          {' '}<V v={dd} w={8} /> de <V v={month} w={35} /> de <V v={yyyy} w={12} /></p>
        <div className="cmi-final-sig">
          <div><p>PELA MEDIADORA</p><div className="cmi-sig" /></div>
          <div><p>SEGUNDO CONTRAENTE</p><div className="cmi-sig" /></div>
        </div>
        <Footer type={type} page={4} total={total} />
      </div>

      {/* ── Page 5 : formulaire de résiliation ── */}
      <div className="cmi-page">
        <Bar>ANEXO 1 – FORMULÁRIO DE RESCISÃO</Bar>
        <p className="cmi-orange cmi-gap2">Não preencher ao assinar o Contrato. Se desejar rescindir o contrato, preencha e envie este formulário para:</p>
        <p>{MEDIADORA.name}, {MEDIADORA.address} ou digitalizado para o e-mail {MEDIADORA.email}</p>
        <p>Eu/Nós (*) notifico/notificamos (*) pelo presente a rescisão do contrato de mediação imobiliária relativo ao imóvel identificado no mesmo:</p>
        <div className="cmi-annex-grid">
          <div>
            <p>Nome/nomes (*) do/dos (*) signatário/signatários (*):</p>
            <p><V w={110} /></p>
            <p>Morada do/dos (*) signatário/signatários (*):</p>
            <p><V w={130} /></p>
          </div>
          <div className="cmi-annex-box">
            <p>N.º de registo: <V v={d.registo} w={30} /></p>
            <p>Consultor {MEDIADORA.brand}: <V v={d.consultor} w={30} /></p>
          </div>
        </div>
        <p className="cmi-gap">Data: <V w={40} /></p>
        <p>Assinatura do/dos (*) signatário/signatários (*): <V w={120} /></p>
        <p className="cmi-orange-i">(*) Riscar o que não se aplica</p>
        <Footer type={type} page={5} total={total} />
      </div>

      {/* ── Aditamento : propriétaires 3 et suivants ── */}
      {extraOwners.length > 0 && (
        <div className="cmi-page cmi-p2">
          <RegBox registo={d.registo} variant="page" />
          <Bar>ADITAMENTO – IDENTIFICAÇÃO DOS PROPRIETÁRIOS ADICIONAIS</Bar>
          {extraOwners.map((o, i) => <OwnerBlock key={i} o={o} n={i + 3} />)}
          <Initials />
          <Footer type={type} page={6} total={total} />
        </div>
      )}
    </div>
  )
}

export const CMI_DOC_CSS = `
.cmi-doc { --o: var(--cmi-color, #EC6A1F); --brick: #B23A17; --beige: #F6EFE9; --tan: #E3CDBF;
  --pt: 10mm; --px: 11mm; font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 7.6pt; line-height: 1.42; }
.cmi-page { width: 210mm; min-height: 297mm; padding: var(--pt) var(--px) 6mm; margin: 0 auto 8mm; background: #fff; box-shadow: 0 1px 6px rgba(0,0,0,.12);
  box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; }
.cmi-small { font-size: 7pt; line-height: 1.36; }
.cmi-page p { margin: 0 0 1.1mm; }
.cmi-j { text-align: justify; }
.cmi-gap { margin-top: 2mm !important; }
.cmi-gap2 { margin-top: 3.5mm !important; }
.cmi-u { text-decoration: underline; }
.cmi-i { font-style: italic; }
.cmi-orange { color: var(--o); }
.cmi-orange-i { color: var(--o); font-style: italic; }
.cmi-lbl { font-weight: 700; margin-bottom: .6mm !important; }

/* Couverture */
.cmi-cover { display: grid; grid-template-columns: 1fr 72mm; margin: calc(-1 * var(--pt)) calc(-1 * var(--px)) 4mm; height: 72mm; }
.cmi-cover-left { background: var(--beige); padding: 8mm 10mm 0 11mm; }
.cmi-cover-left h1 { font-family: 'Arial Black', Arial, sans-serif; font-weight: 900; color: var(--brick); font-size: 21pt; line-height: 1.22; letter-spacing: .5px; margin: 5mm 0 1.5mm; }
.cmi-cover-sub { font-weight: 700; color: #c9bfb8; font-size: 7pt; letter-spacing: .3px; }
.cmi-cover-right { display: grid; grid-template-rows: 1fr 1fr; }
.cmi-slogan { background: var(--o); color: #fff; font-weight: 800; font-size: 10.5pt; line-height: 1.45; text-align: center; padding: 8mm 7mm 0; }
.cmi-diamonds { background: var(--brick); position: relative; }
.cmi-diamonds i { position: absolute; width: 8.5mm; height: 8.5mm; background: var(--o); border-radius: 1.6mm; transform: rotate(45deg); left: calc(50% - 4.25mm); top: calc(50% - 4.25mm); }
.cmi-diamonds i:nth-child(1) { margin: -6.5mm 0 0 -6.5mm; } .cmi-diamonds i:nth-child(2) { margin: -6.5mm 0 0 6.5mm; }
.cmi-diamonds i:nth-child(3) { margin: 6.5mm 0 0 -6.5mm; } .cmi-diamonds i:nth-child(4) { margin: 6.5mm 0 0 6.5mm; }
.cmi-logo { display: flex; align-items: center; gap: 2mm; color: var(--o); }
.cmi-logo svg { width: 13mm; height: 11mm; }
.cmi-logo-name { display: block; font-size: 21pt; font-weight: 700; letter-spacing: 2px; line-height: 1; }
.cmi-logo-tag { display: block; font-size: 7.5pt; color: var(--brick); margin-left: 5mm; }

/* Numéro de registo */
.cmi-reg { display: flex; align-items: center; justify-content: space-between; border-radius: 1.6mm; font-weight: 700; }
.cmi-reg-cover { background: var(--o); color: #fff; width: 128mm; margin: 0 0 7mm 5mm; padding: 1.6mm 2mm 1.6mm 4mm; font-size: 8.5pt; }
.cmi-reg-page { background: var(--beige); color: var(--o); width: 115mm; margin: 0 auto 3mm; padding: 1.6mm 2mm 1.6mm 6mm; font-size: 8.5pt; }
.cmi-reg-box { background: #fff; color: #111; border-radius: 1mm; min-width: 38mm; padding: .6mm 3mm; text-align: center; font-weight: 700; }

/* Page 1 */
.cmi-p1 { font-size: 8pt; }
.cmi-p1 .cmi-u { font-weight: 700; margin-top: 3.5mm !important; }
.cmi-fill { border-bottom: 1px dotted #888; min-height: 4.5mm; }
.cmi-fill .cmi-blank, .cmi-fill .cmi-v { border: 0; }
.cmi-docs { border-collapse: collapse; margin-top: 1.5mm; }
.cmi-docs th { font-weight: 400; text-align: left; padding: 0 6mm 2mm 0; }
.cmi-docs td { padding: .35mm 0; vertical-align: top; }
.cmi-docs td:nth-child(1) { width: 22mm; padding-left: 4mm; } .cmi-docs td:nth-child(2) { width: 24mm; padding-left: 5mm; }

/* Barres de titre */
.cmi-bar { background: var(--o); color: #fff; font-weight: 700; padding: .5mm 1.6mm; margin: 2mm 0 1.4mm; font-size: 7.8pt; break-after: avoid; page-break-after: avoid; }

/* Page 2 */
.cmi-kind { display: flex; justify-content: space-between; align-items: center; margin-top: 2mm; font-size: 8.5pt; }
.cmi-annex { font-size: 7.4pt; }
.cmi-owner { margin-bottom: 1.5mm; }
.cmi-owner-title { font-weight: 700; font-size: 8.5pt; margin: 2mm 0 1mm !important; }
.cmi-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 0 5mm; }
.cmi-2col > div:last-child { border-left: 1px solid #ddd; padding-left: 3mm; }

/* Pages de clauses */
.cmi-ol { margin: 0 0 1mm; padding-left: 7mm; list-style: decimal; }
.cmi-ol > li { margin-bottom: .9mm; text-align: justify; }
.cmi-alpha { list-style: upper-alpha; }
.cmi-sub-alpha { list-style: lower-alpha; padding-left: 9mm; margin: 1.2mm 0; }
.cmi-lines p { margin: 0 0 1.2mm; }
.cmi-lines { margin-top: 1.4mm; }
.cmi-ind2 { padding-left: 7mm; }
.cmi-rem { display: grid; grid-template-columns: 1fr 10mm 1fr; gap: 3mm; margin: 1.6mm 0; }
.cmi-ou { text-align: center; padding-top: .5mm; }
.cmi-closing { color: var(--o); line-height: 1.9; margin-top: 6mm !important; text-align: justify; }
.cmi-final-sig { display: grid; grid-template-columns: 1fr 1fr; gap: 14mm; margin-top: 3mm; text-align: center; }
.cmi-final-sig .cmi-sig { height: 14mm; border-bottom: 1px solid #555; margin: 0 6mm; }

/* Pages de clauses denses : espacements resserrés comme dans l'original */
.cmi-small p { margin-bottom: .5mm; }
.cmi-small .cmi-bar { margin: 1.3mm 0 .8mm; padding: .3mm 1.6mm; font-size: 7.2pt; }
.cmi-small .cmi-ol > li { margin-bottom: .3mm; }
.cmi-small .cmi-lines { margin-top: .6mm; }
.cmi-small .cmi-lines p { margin-bottom: .9mm; }
.cmi-small .cmi-sub-alpha { margin: .6mm 0; }
.cmi-small .cmi-rem { margin: .8mm 0; }
.cmi-small .cmi-initials-row { padding-top: 2mm; }

/* Annexe */
.cmi-annex-grid { display: grid; grid-template-columns: 1fr 68mm; gap: 6mm; align-items: start; }
.cmi-annex-box { background: var(--beige); padding: 2mm 3mm; font-size: 6.8pt; }

/* Valeurs */
.cmi-v { font-weight: 700; color: #0b2a6f; border-bottom: 1px dotted #999; padding: 0 1px; }
.cmi-v-block { font-weight: 600; color: #0b2a6f; white-space: pre-wrap; }
.cmi-na { font-weight: 700; padding: 0 2mm; }
.cmi-blank { display: inline-block; border-bottom: 1px dotted #777; height: 1em; vertical-align: baseline; }
.cmi-box { display: inline-flex; width: 2.9mm; height: 2.9mm; border: 1px solid #222; align-items: center; justify-content: center; font-size: 6.5pt; font-weight: 700; vertical-align: -0.45mm; line-height: 1; background: #fff; }
.cmi-opt { white-space: normal; }

/* Bloc signatures + pied de page (en bas de page) */
.cmi-initials-row { margin-top: auto; padding-top: 4mm; display: flex; justify-content: space-between; align-items: flex-end; gap: 4mm; break-inside: avoid; page-break-inside: avoid; }
.cmi-initials-left { font-size: 7pt; }
.cmi-initials-left p { margin: 0 0 1.5mm; }
.cmi-initials { width: 108mm; flex-shrink: 0; }
.cmi-init-labels { display: grid; grid-template-columns: 22mm 1fr 1fr; font-style: italic; font-size: 6.3pt; text-align: center; margin-bottom: .8mm; }
.cmi-init-labels span:first-child { grid-column: 2; }
.cmi-init-bar { display: grid; grid-template-columns: 22mm 1fr 1fr; gap: 1.2mm; background: var(--tan); border-radius: 1.2mm; padding: 1.2mm; align-items: center; }
.cmi-init-bar b { color: var(--brick); font-size: 6.3pt; text-align: center; }
.cmi-init-bar i { display: block; height: 6mm; background: #fff; border-radius: .8mm; }
.cmi-foot { margin-top: 3mm; }
.cmi-page:not(:has(.cmi-initials-row)) .cmi-foot { margin-top: auto; }
.cmi-pnum { color: var(--o); font-size: 7.5pt; margin-bottom: 1mm; }
.cmi-footline { display: flex; justify-content: space-between; color: var(--o); font-size: 5.3pt; padding: 0 0 0 13mm; }

/* Correction à la main */
.cmi-editing .cmi-page { outline: 2px dashed #93c5fd; outline-offset: -1px; cursor: text; }
.cmi-editing { caret-color: #2563eb; }

@media print {
  /* Les navigateurs n'ont pas tous la même zone imprimable (Safari garde des
     marges plus grandes, surtout en bas) : pas de hauteur fixe, chaque page
     s'écoule avec une hauteur minimale qui tient partout, et se termine par
     le bloc signatures + pied de page. */
  @page { size: A4; margin: 6mm; }
  html, body, main { background: #fff !important; padding: 0 !important; margin: 0 !important; min-height: 0 !important; }
  .no-print { display: none !important; }
  .cmi-doc { --pt: 2mm; --px: 5mm; }
  .cmi-page { width: auto; min-height: 240mm; margin: 0 !important; padding: var(--pt) var(--px) 0 !important; box-shadow: none; outline: none !important;
    overflow: visible; page-break-after: always; break-after: page; }
  .cmi-page:last-child { page-break-after: auto; break-after: auto; }
  .cmi-cover { margin: calc(-1 * var(--pt)) calc(-1 * var(--px)) 4mm; height: 66mm; }
  .cmi-small { font-size: 6.6pt; line-height: 1.26; }
  .cmi-v, .cmi-v-block { color: #000; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`
