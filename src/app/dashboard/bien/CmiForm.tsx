'use client'

// Formulaire du contrat de médiation (CMI), affiché dans le dossier du bien.

import {
  CMI_TYPES, CMI_STATUS, DOC_CHECKLIST, emptyOwner,
  amountToWords, percentToWords, missingFields,
  type CmiData, type CmiType, type CmiStatus, type Owner, type Person,
} from '@/lib/cmi'

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400 transition-colors'

function Section({ n, title, children, hint }: { n: number; title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section id={`cmi-section-${n}`} className="bg-white rounded-2xl border border-gray-100 p-6 scroll-mt-6">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  )
}

function F({ label, value, onChange, type = 'text', placeholder, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
      <input className={inp} type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

function Sel<T extends string>({ label, value, onChange, options, className = '' }: {
  label: string; value: T; onChange: (v: T) => void; options: [T, string][]; className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
      <select className={inp} value={value} onChange={e => onChange(e.target.value as T)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function Words({ text, suffix }: { text: string; suffix: string }) {
  if (!text) return null
  return <p className="text-xs text-gray-400 mt-1 italic">Por extenso : {text} {suffix}</p>
}

function PersonFields({ p, onChange }: { p: Person; onChange: (p: Person) => void }) {
  const set = <K extends keyof Person>(k: K, v: Person[K]) => onChange({ ...p, [k]: v })
  return (
    <>
      <div className="grid grid-cols-6 gap-3">
        <Sel label="Civilité" value={p.civ} onChange={v => set('civ', v)} options={[['', '—'], ['Sr.', 'Sr.'], ['Sra.', 'Sra.']]} />
        <F className="col-span-2" label="Nome (prénom)" value={p.nome} onChange={v => set('nome', v)} />
        <F className="col-span-3" label="Apelidos (nom)" value={p.apelidos} onChange={v => set('apelidos', v)} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <F label="Date de naissance" type="date" value={p.nascimento} onChange={v => set('nascimento', v)} />
        <F label="Naturalidade (lieu)" value={p.naturalidade} onChange={v => set('naturalidade', v)} />
        <F label="Pays de naissance" value={p.pais} onChange={v => set('pais', v)} />
        <F label="Nationalité" value={p.nacionalidade} onChange={v => set('nacionalidade', v)} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <F className="col-span-2" label="Adresse" value={p.morada} onChange={v => set('morada', v)} />
        <F label="Code postal" value={p.codigoPostal} onChange={v => set('codigoPostal', v)} />
        <F label="Localité" value={p.localidade} onChange={v => set('localidade', v)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <F label="Pays (adresse)" value={p.paisMorada} onChange={v => set('paisMorada', v)} />
        <F label="Téléphone" value={p.telefone} onChange={v => set('telefone', v)} />
        <F label="E-mail" type="email" value={p.email} onChange={v => set('email', v)} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <Sel label="Pièce d'identité" value={p.docTipo} onChange={v => set('docTipo', v)}
          options={[['', '—'], ['cc', 'Cartão de Cidadão'], ['passaporte', 'Passaporte'], ['bi', 'Bilhete de Identidade']]} />
        <F label="N.º du document" value={p.docNumero} onChange={v => set('docNumero', v)} />
        <F label="Validité" type="date" value={p.docValidade} onChange={v => set('docValidade', v)} />
        <F label="NIF" value={p.nif} onChange={v => set('nif', v)} />
      </div>
    </>
  )
}

export default function CmiForm({ d, up, type, setType, status, setStatus }: {
  d: CmiData
  up: (fn: (x: CmiData) => void) => void
  type: CmiType
  setType: (t: CmiType) => void
  status: CmiStatus
  setStatus: (s: CmiStatus) => void
}) {
  const setOwner = (i: number, o: Owner) => up(x => { x.owners[i] = o })
  const im = d.imovel
  const setIm = <K extends keyof CmiData['imovel']>(k: K, v: CmiData['imovel'][K]) => up(x => { x.imovel[k] = v })

  const missing = missingFields(d)

  return (
    <div className="flex flex-col gap-6">
      {missing.length > 0 ? (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-amber-800">📋 Il reste {missing.length} information{missing.length > 1 ? 's' : ''} à compléter avant de faire signer :</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {missing.map((m, i) => (
              <button key={i} type="button" onClick={() => document.getElementById(`cmi-section-${m.section}`)?.scrollIntoView({ behavior: 'smooth' })}
                className="text-xs bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors">
                {m.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-sm font-medium text-green-700">✅ Toutes les informations principales sont remplies.</div>
      )}
        <Section n={1} title="1. Type de contrat">
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(CMI_TYPES) as CmiType[]).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${type === t ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}>
                <p className="font-semibold text-gray-900 text-sm">{CMI_TYPES[t].fr}</p>
                <p className="text-xs text-gray-400">Contrato {CMI_TYPES[t].pt}</p>
              </button>
            ))}
          </div>
          {type === 'semi_exclusivo' && <p className="text-xs text-gray-400">Si le propriétaire vend lui-même, il doit 50 % de la commission (clause 8).</p>}
          <div className="grid grid-cols-3 gap-3">
            <F label="N.º de registo SAFTI" value={d.registo} onChange={v => up(x => { x.registo = v })} />
            <F className="col-span-2" label="Consultor (représente la Mediadora)" value={d.consultor} onChange={v => up(x => { x.consultor = v })} />
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-2">Objet</span>
            <div className="flex gap-6">
              <Check label="Compra (vente)" checked={d.negocio.compra} onChange={v => up(x => { x.negocio.compra = v })} />
              <Check label="Trespasse" checked={d.negocio.trespasse} onChange={v => up(x => { x.negocio.trespasse = v })} />
              <Check label="Arrendamento (location)" checked={d.negocio.arrendamento} onChange={v => up(x => { x.negocio.arrendamento = v })} />
            </div>
          </div>
        </Section>

        <Section n={2} title="2. Vendeur(s) – Segundo Contraente" hint="Le contrat doit être signé par tous les propriétaires (ou leur représentant par procuration).">
          <div className="flex gap-2">
            {(['singular', 'coletiva'] as const).map(k => (
              <button key={k} type="button" onClick={() => up(x => { x.ownerKind = k })}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${d.ownerKind === k ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                {k === 'singular' ? '👤 Particulier(s)' : '🏢 Société'}
              </button>
            ))}
          </div>

          {d.ownerKind === 'singular' ? (
            <>
              {d.owners.map((o, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Propriétaire {i + 1}</p>
                    {d.owners.length > 1 && (
                      <button type="button" onClick={() => up(x => { x.owners.splice(i, 1) })} className="text-xs text-red-400 hover:text-red-600">Retirer</button>
                    )}
                  </div>
                  <PersonFields p={o} onChange={p => setOwner(i, { ...o, ...p })} />
                  <div className="grid grid-cols-3 gap-3">
                    <Sel label="État civil" value={o.estadoCivil} onChange={v => setOwner(i, { ...o, estadoCivil: v })}
                      options={[['', '—'], ['solteiro', 'Solteiro'], ['casado', 'Casado'], ['uniao', 'União de Facto'], ['divorciado', 'Divorciado'], ['viuvo', 'Viúvo']]} />
                    {o.estadoCivil === 'casado'
                      ? <F label="Régime matrimonial" value={o.regimeBens} onChange={v => setOwner(i, { ...o, regimeBens: v })} placeholder="comunhão de adquiridos…" />
                      : <div />}
                    <Sel label="Nature du droit" value={o.direito} onChange={v => setOwner(i, { ...o, direito: v })}
                      options={[['', '—'], ['plena', 'Propriedade Plena'], ['nua', 'Nu-proprietário/a'], ['usufruto', 'Usufrutuário/a'], ['indiviso', 'Indiviso']]} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => up(x => { x.owners.push(emptyOwner()) })}
                className="self-start text-sm text-orange-500 hover:underline font-medium">+ Ajouter un propriétaire</button>
              {d.owners.length > 2 && <p className="text-xs text-gray-400">À partir du 3ᵉ propriétaire, une page « Aditamento » est ajoutée au contrat.</p>}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <F label="Firma (raison sociale)" value={d.empresa.firma} onChange={v => up(x => { x.empresa.firma = v })} />
                <F label="Nature juridique" value={d.empresa.naturezaJuridica} onChange={v => up(x => { x.empresa.naturezaJuridica = v })} placeholder="Sociedade por quotas, Lda…" />
                <F label="Capital social (€)" value={d.empresa.capital} onChange={v => up(x => { x.empresa.capital = v })} />
                <F label="Conservatória do Registo Comercial de" value={d.empresa.conservatoria} onChange={v => up(x => { x.empresa.conservatoria = v })} />
                <F className="col-span-2" label="Siège social" value={d.empresa.sede} onChange={v => up(x => { x.empresa.sede = v })} />
                <F className="col-span-2" label="Le représentant agit en qualité de" value={d.empresa.qualidade} onChange={v => up(x => { x.empresa.qualidade = v })} placeholder="Gerente…" />
              </div>
              <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-gray-700">Représentant de la société</p>
                <PersonFields p={d.empresa.representante} onChange={p => up(x => { x.empresa.representante = p })} />
              </div>
            </>
          )}
        </Section>

        <Section n={3} title="3. Le bien – Imóvel">
          <div className="grid grid-cols-4 gap-3">
            <Sel className="col-span-2" label="Destination" value={im.destino} onChange={v => setIm('destino', v)}
              options={[['', '—'], ['fracao', 'Habitação – Fração Autónoma'], ['predio', 'Habitação – Prédio'], ['comercial', 'Estabelecimento comercial']]} />
            <Sel label="Nature" value={im.natureza} onChange={v => setIm('natureza', v)}
              options={[['', '—'], ['urbano', 'Urbano'], ['rustico', 'Rústico'], ['misto', 'Misto']]} />
            <F label="Divisões assoalhadas" value={im.divisoes} onChange={v => setIm('divisoes', v)} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <F label="Surface totale (m²)" value={im.area} onChange={v => setIm('area', v)} />
            <F className="col-span-3" label="Adresse (Rua, Avenida…)" value={im.morada} onChange={v => setIm('morada', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Freguesia" value={im.freguesia} onChange={v => setIm('freguesia', v)} />
            <F label="Concelho" value={im.concelho} onChange={v => setIm('concelho', v)} />
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Registo predial</p>
          <div className="grid grid-cols-3 gap-3">
            <F label="Conservatória de" value={im.conservatoria} onChange={v => setIm('conservatoria', v)} />
            <F label="Sob o n.º" value={im.registoNumero} onChange={v => setIm('registoNumero', v)} />
            <F label="Da freguesia" value={im.registoFreguesia} onChange={v => setIm('registoFreguesia', v)} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Licence de construction / utilisation</p>
            <Check label="Isento (inscrit à la matrice avant 1951)" checked={d.licencaIsenta} onChange={v => up(x => { x.licencaIsenta = v })} />
          </div>
          {!d.licencaIsenta && <div className="grid grid-cols-3 gap-3">
            <F label="N.º" value={im.licencaNumero} onChange={v => setIm('licencaNumero', v)} />
            <F label="Câmara Municipal de" value={im.licencaCamara} onChange={v => setIm('licencaCamara', v)} />
            <F label="Émise le" type="date" value={im.licencaData} onChange={v => setIm('licencaData', v)} />
          </div>}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Matriz predial (caderneta)</p>
          <div className="grid grid-cols-4 gap-3">
            <Sel label="Matriz" value={im.matriz} onChange={v => setIm('matriz', v)} options={[['', '—'], ['urbana', 'Urbana'], ['rustica', 'Rústica']]} />
            <F label="Artigo n.º" value={im.artigo} onChange={v => setIm('artigo', v)} />
            <F label="Freguesia" value={im.matrizFreguesia} onChange={v => setIm('matrizFreguesia', v)} />
            <F label="Concelho" value={im.matrizConcelho} onChange={v => setIm('matrizConcelho', v)} />
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Certificat énergétique</p>
          <div className="grid grid-cols-2 gap-3">
            <F label="N.º" value={im.certificadoNumero} onChange={v => setIm('certificadoNumero', v)} />
            <F label="Valable jusqu'au" type="date" value={im.certificadoValidade} onChange={v => setIm('certificadoValidade', v)} />
          </div>
        </Section>

        <Section n={4} title="4. Conditions de commercialisation">
          <div>
            <F label="Prix (€)" value={d.preco} onChange={v => up(x => { x.preco = v })} placeholder="350000" />
            <Words text={amountToWords(d.preco)} suffix="euros" />
          </div>
          <div className="flex flex-col gap-2">
            <Check label="Service de recueil des documents facturé à part (clause 1.4)" checked={d.servicoDocs} onChange={v => up(x => { x.servicoDocs = v })} />
            {d.servicoDocs && (
              <div>
                <F label="Montant du service (€)" value={d.servicoDocsValor} onChange={v => up(x => { x.servicoDocsValor = v })} />
                <Words text={amountToWords(d.servicoDocsValor)} suffix="euros" />
              </div>
            )}
          </div>

          <div className="border-t border-gray-50 pt-4 flex flex-col gap-3">
            <span className="text-xs font-medium text-gray-500">Charges (ónus ou encargos)</span>
            <div className="flex gap-6">
              <Check label="Libre de toute charge" checked={d.onusLivre} onChange={v => up(x => { x.onusLivre = v })} />
            </div>
            {!d.onusLivre && (
              <div className="grid grid-cols-2 gap-3">
                <Sel label="Type" value={d.onusTipo} onChange={v => up(x => { x.onusTipo = v })}
                  options={[['', '—'], ['hipotecas', 'Hipotecas'], ['penhoras', 'Penhoras'], ['ambas', 'Hipotecas e penhoras']]} />
                <F label="Montant (€)" value={d.onusValor} onChange={v => up(x => { x.onusValor = v })} />
              </div>
            )}
          </div>

          <div className="border-t border-gray-50 pt-4 flex flex-col gap-3">
            <span className="text-xs font-medium text-gray-500">Commission (+ IVA)</span>
            <div className="flex gap-2">
              {(['percent', 'fixo'] as const).map(m => (
                <button key={m} type="button" onClick={() => up(x => { x.remuneracaoModo = m })}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${d.remuneracaoModo === m ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                  {m === 'percent' ? '% du prix' : 'Montant fixe'}
                </button>
              ))}
            </div>
            {d.remuneracaoModo === 'percent' ? (
              <div>
                <F label="Pourcentage (%)" value={d.remuneracaoPct} onChange={v => up(x => { x.remuneracaoPct = v })} placeholder="5" />
                <Words text={percentToWords(d.remuneracaoPct)} suffix="por cento" />
              </div>
            ) : (
              <div>
                <F label="Montant (€)" value={d.remuneracaoValor} onChange={v => up(x => { x.remuneracaoValor = v })} />
                <Words text={amountToWords(d.remuneracaoValor)} suffix="euros" />
              </div>
            )}
            <Sel label="Paiement de la commission" value={d.pagamento} onChange={v => up(x => { x.pagamento = v })}
              options={[['escritura', 'Totalité à l\'escritura (acte) ou conclusion'], ['faseado', 'Une partie au CPCV, le reste à l\'escritura']]} />
            {d.pagamento === 'faseado' && (
              <div className="grid grid-cols-2 gap-3">
                <F label="% au CPCV (contrat-promesse)" value={d.pagamentoPctCpcv}
                  onChange={v => up(x => { x.pagamentoPctCpcv = v; const n = Number(v.replace(',', '.')); if (Number.isFinite(n) && v) x.pagamentoPctEscritura = String(100 - n) })} />
                <F label="% à l'escritura" value={d.pagamentoPctEscritura} onChange={v => up(x => { x.pagamentoPctEscritura = v })} />
              </div>
            )}
          </div>
        </Section>

        <Section n={5} title="5. Autres clauses" hint="Pour une clause qui ne s'applique pas, cochez « sans objet » : le contrat affichera « — » au lieu de pointillés.">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Angariador imobiliário (clause 4)</p>
            <Check label="Sans angariador" checked={d.angariadorNA} onChange={v => up(x => { x.angariadorNA = v })} />
          </div>
          {!d.angariadorNA && <div className="grid grid-cols-3 gap-3">
            <F label="Nom" value={d.angariador.nome} onChange={v => up(x => { x.angariador.nome = v })} />
            <F label="CC / BI n.º" value={d.angariador.documento} onChange={v => up(x => { x.angariador.documento = v })} />
            <F label="NIF" value={d.angariador.nif} onChange={v => up(x => { x.angariador.nif = v })} />
            <F label="Téléphone" value={d.angariador.telefone} onChange={v => up(x => { x.angariador.telefone = v })} />
            <F className="col-span-2" label="E-mail professionnel" value={d.angariador.email} onChange={v => up(x => { x.angariador.email = v })} />
          </div>}
          <div className="grid grid-cols-3 gap-3">
            <F label="Durée du contrat en mois (clause 9)" value={d.duracaoMeses} onChange={v => up(x => { x.duracaoMeses = v.replace(/[^0-9]/g, '') })} placeholder="6" />
            <div className="col-span-2">
              {d.foroNA
                ? <p className="text-xs text-gray-400 mt-6">Foro competente : sans objet (clause facultative)</p>
                : <F label="Foro da Comarca de (clause 5, facultative)" value={d.foro} onChange={v => up(x => { x.foro = v })} placeholder="Portimão" />}
              <div className="mt-1"><Check label="Sans foro" checked={d.foroNA} onChange={v => up(x => { x.foroNA = v })} /></div>
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">Clause 9 : renouvelable automatiquement par périodes égales, sauf dénonciation 10 jours avant le terme.</p>
          <label className="block">
            <span className="block text-xs font-medium text-gray-500 mb-1">Conditions particulières (clause 12)</span>
            <textarea className={inp} rows={4} placeholder="Ex. : Visitas apenas com aviso prévio de 24 horas. / A exclusividade vigora por um período inicial de 3 meses…" value={d.condicoes} onChange={e => up(x => { x.condicoes = e.target.value })} />
          </label>
        </Section>

        <Section n={6} title="6. Documents" hint="Cochez les documents présentés et reçus (page 1 du contrat).">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[70px_70px_1fr] text-xs font-semibold text-gray-400">
              <span>Présenté</span><span>Reçu</span><span />
            </div>
            {DOC_CHECKLIST.map(doc => (
              <div key={doc.key} className="grid grid-cols-[70px_70px_1fr] items-center text-sm">
                <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={d.docs[doc.key]?.apresentado || false}
                  onChange={e => up(x => { x.docs[doc.key] = { ...x.docs[doc.key], apresentado: e.target.checked } })} />
                <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={d.docs[doc.key]?.recebido || false}
                  onChange={e => up(x => { x.docs[doc.key] = { ...x.docs[doc.key], recebido: e.target.checked } })} />
                <span className="text-gray-700">{doc.label}</span>
              </div>
            ))}
          </div>
          <F label="Autres documents" value={d.outrosDocs} onChange={v => up(x => { x.outrosDocs = v })} />
        </Section>

        <Section n={7} title="7. Signature">
          <div className="grid grid-cols-3 gap-3">
            <F label="Fait à (lieu)" value={d.local} onChange={v => up(x => { x.local = v })} placeholder="Lagos" />
            <F label="Date" type="date" value={d.data} onChange={v => up(x => { x.data = v })} />
            <Sel label="Statut" value={status} onChange={setStatus}
              options={(Object.keys(CMI_STATUS) as CmiStatus[]).map(s => [s, CMI_STATUS[s].label])} />
          </div>
          <p className="text-xs text-gray-400">Signature papier : imprimez le contrat (ou enregistrez-le en PDF), faites-le signer et parapher chaque page. La signature électronique viendra plus tard.</p>
        </Section>
    </div>
  )
}
