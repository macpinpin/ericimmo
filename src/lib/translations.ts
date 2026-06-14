export const LANGS = [
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'pt', flag: '🇵🇹', label: 'PT' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'de', flag: '🇩🇪', label: 'DE' },
  { code: 'nl', flag: '🇳🇱', label: 'NL' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
]

export type Lang = typeof LANGS[number]['code']

export const T: Record<string, Record<string, string>> = {
  network: {
    fr: 'SAFTI Portugal', pt: 'SAFTI Portugal', en: 'SAFTI Portugal',
    es: 'SAFTI Portugal', de: 'SAFTI Portugal', zh: 'SAFTI Portugal',
    it: 'SAFTI Portugal', nl: 'SAFTI Portugal', ru: 'SAFTI Portugal', ar: 'SAFTI Portugal',
  },
  bio: {
    fr: 'Mandataire immobilier spécialisé en Algarve.\nAchat - Vente\nDemandez votre évaluation gratuite',
    pt: 'Consultor imobiliário especializado no Algarve.\nCompra - Venda\nPeça a sua avaliação gratuita',
    en: 'Real estate agent specialised in the Algarve.\nBuy - Sell\nRequest your free valuation',
    es: 'Agente inmobiliario especializado en el Algarve.\nCompra - Venta\nSolicite su valoración gratuita',
    de: 'Immobilienmakler spezialisiert auf die Algarve.\nKaufen - Verkaufen\nFordern Sie Ihre kostenlose Bewertung an',
    zh: '专注阿尔加维地区的房产经纪人。\n购买 - 出售\n申请免费估价',
    it: 'Agente immobiliare specializzato in Algarve.\nAcquisto - Vendita\nRichiedi la tua valutazione gratuita',
    nl: 'Makelaar gespecialiseerd in de Algarve.\nKopen - Verkopen\nVraag uw gratis waardebepaling aan',
    ru: 'Агент по недвижимости, специализирующийся на Алгарве.\nПокупка - Продажа\nЗапросите бесплатную оценку',
    ar: 'وكيل عقاري متخصص في منطقة الغاربي.\nشراء - بيع\nاطلب تقييمك المجاني',
  },
  myProperties: {
    fr: 'Mes biens', pt: 'Os meus imóveis', en: 'My properties',
    es: 'Mis propiedades', de: 'Meine Immobilien', zh: '我的房产',
    it: 'I miei immobili', nl: 'Mijn woningen', ru: 'Мои объекты', ar: 'عقاراتي',
  },
  seeOnSafti: {
    fr: 'Voir sur SAFTI →', pt: 'Ver no SAFTI →', en: 'See on SAFTI →',
    es: 'Ver en SAFTI →', de: 'Auf SAFTI ansehen →', zh: '在SAFTI查看 →',
    it: 'Vedi su SAFTI →', nl: 'Bekijk op SAFTI →', ru: 'Смотреть на SAFTI →', ar: '← عرض على SAFTI',
  },
  noBiens: {
    fr: 'Aucun bien disponible pour le moment.', pt: 'Nenhum imóvel disponível de momento.',
    en: 'No properties available at the moment.', es: 'Ninguna propiedad disponible por el momento.',
    de: 'Keine Immobilien derzeit verfügbar.', zh: '目前没有可用的房产。',
    it: 'Nessuna proprietà disponibile al momento.', nl: 'Geen woningen beschikbaar op dit moment.',
    ru: 'Нет доступных объектов в данный момент.', ar: 'لا توجد عقارات متاحة في الوقت الحالي.',
  },
  contact: {
    fr: '✉️ Contacter', pt: '✉️ Contactar', en: '✉️ Contact',
    es: '✉️ Contactar', de: '✉️ Kontakt', zh: '✉️ 联系',
    it: '✉️ Contatta', nl: '✉️ Contact', ru: '✉️ Связаться', ar: '✉️ تواصل',
  },
  vtour: {
    fr: '🥽 Visite virtuelle 360°', pt: '🥽 Visita virtual 360°', en: '🥽 Virtual tour 360°',
    es: '🥽 Visita virtual 360°', de: '🥽 Virtuelle Tour 360°', zh: '🥽 虚拟参观 360°',
    it: '🥽 Tour virtuale 360°', nl: '🥽 Virtuele rondleiding 360°', ru: '🥽 Виртуальный тур 360°', ar: '🥽 جولة افتراضية 360°',
  },
  sqm: {
    fr: 'm² hab.', pt: 'm² hab.', en: 'sq.ft hab.', es: 'm² hab.',
    de: 'm² Wfl.', zh: '平方米', it: 'm² ab.', nl: 'm² woon.', ru: 'м² жил.', ar: 'م² مسكن',
  },
  land: {
    fr: 'm² terrain', pt: 'm² terreno', en: 'sq.ft land', es: 'm² terreno',
    de: 'm² Grund.', zh: '平方米地块', it: 'm² terreno', nl: 'm² grond', ru: 'м² участок', ar: 'م² أرض',
  },
  rooms: {
    fr: 'chambres', pt: 'quartos', en: 'bedrooms', es: 'habitaciones',
    de: 'Zimmer', zh: '卧室', it: 'camere', nl: 'slaapkamers', ru: 'комнат', ar: 'غرف',
  },
  baths: {
    fr: 'sdb', pt: 'wc', en: 'baths', es: 'baños',
    de: 'Bäder', zh: '浴室', it: 'bagni', nl: 'badkamers', ru: 'ванн', ar: 'حمامات',
  },
}

export function t(key: string, lang: string): string {
  return T[key]?.[lang] || T[key]?.['fr'] || key
}
