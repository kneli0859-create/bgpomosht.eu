'use strict';

// bgpomosht.eu — knowledge base for AI assistant
// Used as system prompt context so AI recommendations match real services & prices.

const COMPANY = {
  name: 'BG Помощ (bgpomosht.eu)',
  mission: 'Услуги за българи в Европа — Германия, Австрия, Швейцария, Франция, Италия, Испания. Помагаме с документи, работа, институции и ежедневни проблеми.',
  usp: 'Отговор до 30 минути. Без скрити такси. Плащане след одобрена оферта.',
  hours: '08:30 — 21:00, 7 дни в седмицата',
  whatsapp: '+49 1512 9893854',
  languages: ['български', 'немски', 'английски']
};

const SERVICES = [
  {
    key: 'job',
    name: 'Търся работа',
    from: 29,
    tiers: [
      { name: 'Само CV', price: 29, desc: 'готово до 24 часа' },
      { name: 'CV + Мотивационно писмо', price: 49, desc: 'адаптирано за конкретна позиция' },
      { name: 'CV + Писмо + Кандидатстване', price: 79, desc: 'кандидатстваме вместо клиента за до 5 обяви' }
    ],
    keywords: ['cv', 'работа', 'job', 'lebenslauf', 'anschreiben', 'bewerbung', 'мотивационно', 'кандидатстване']
  },
  {
    key: 'institution',
    name: 'Помощ с институция',
    from: 39,
    tiers: [
      { name: 'Превод + обяснение на писмо', price: 39, desc: 'разбираш какво иска институцията' },
      { name: 'Писане на молба / отговор', price: 59, desc: 'подготвяме отговор на немски/английски' },
      { name: 'Пълна комуникация с институция', price: 89, desc: 'от началo до край — водим цялата кореспонденция' }
    ],
    keywords: ['jobcenter', 'finanzamt', 'ausländerbehörde', 'krankenkasse', 'институция', 'писмо', 'brief', 'antrag', 'bescheid']
  },
  {
    key: 'arrived',
    name: 'Тъкмо пристигнах',
    from: 49,
    tiers: [
      { name: 'Стартов пакет', price: 49, desc: 'Anmeldung насоки + основни документи' },
      { name: 'Разширен пакет', price: 89, desc: 'Anmeldung + здравна каса + банкова сметка' },
      { name: 'Пълна адаптация', price: 149, desc: 'всичко горе + Kindergeld + Finanzamt регистрация + търсене жилище' }
    ],
    keywords: ['anmeldung', 'пристигнах', 'нов в германия', 'adresregistrierung', 'регистрация адрес']
  },
  {
    key: 'document',
    name: 'Документ или превод',
    from: 29,
    tiers: [
      { name: 'Превод до 1 стр.', price: 29, desc: 'бг ↔ нем/англ' },
      { name: 'Официален формуляр', price: 39, desc: 'попълваме вместо клиента' },
      { name: 'Превод до 5 стр.', price: 49, desc: 'по-обемни документи' },
      { name: 'Пълномощно / декларация', price: 35, desc: 'изготвяне на правен текст' }
    ],
    keywords: ['превод', 'документ', 'übersetzung', 'formular', 'пълномощно', 'декларация']
  },
  {
    key: 'taxes',
    name: 'Данъчна декларация (Steuererklärung)',
    from: 49,
    avgReturn: 'Средно клиентите получават обратно между €500 и €2000',
    tiers: [
      { name: 'Проста декларация', price: 59, desc: '1 работодател, без сложни случаи' },
      { name: 'Сложна декларация', price: 89, desc: 'наем, разходи, 2+ работодатели' },
      { name: 'Nachreichung (предходна година)', price: 49, desc: 'за пропусната година назад' }
    ],
    keywords: ['данъци', 'steuer', 'steuererklärung', 'данъчна', 'декларация', 'lohnsteuer', 'rückerstattung']
  },
  {
    key: 'kep',
    name: 'КЕП онлайн подпис (Evrotrust)',
    from: 19,
    tiers: [
      { name: 'Активиране на нов КЕП', price: 29, desc: 'стъпка по стъпка' },
      { name: 'Подновяване / нов сертификат', price: 19, desc: 'при изтичане' },
      { name: 'КЕП + помощ с 1 е-услуга', price: 49, desc: 'активиране + първа е-заявка' }
    ],
    keywords: ['кеп', 'evrotrust', 'електронен подпис', 'kep']
  },
  {
    key: 'bg_eservices',
    name: 'е-Услуги от България (НАП, НЗОК, ГРАО)',
    from: 39,
    tiers: [
      { name: 'Единична е-услуга', price: 39, desc: 'една заявка — НАП, НЗОК или ГРАО' },
      { name: 'Пакет 3 услуги', price: 89, desc: 'комбинация' },
      { name: 'С куриерска доставка до ЕС', price: 64, desc: '€39 услуга + €25 куриер' }
    ],
    keywords: ['нап', 'нзок', 'грао', 'е-услуга', 'удостоверение', 'българия', 'българска институция']
  },
  {
    key: 'course',
    name: 'Онлайн курс / Сертификат',
    from: 29,
    tiers: [
      { name: 'Записване + план', price: 29, desc: 'намираме подходящ курс и помагаме за записване' },
      { name: 'Придружаване', price: 59, desc: 'помагаме по време на курса' },
      { name: 'Сертификат + превод', price: 89, desc: 'легализация на сертификат' }
    ],
    keywords: ['курс', 'сертификат', 'kurs', 'zertifikat', 'volkshochschule', 'vhs']
  },
  {
    key: 'housing',
    name: 'Търсене на жилище',
    from: 39,
    tiers: [
      { name: 'Консултация + насоки', price: 39, desc: 'обясняваме как работи пазарът' },
      { name: 'Търсим вместо клиента', price: 69, desc: 'активно търсене + подготовка на документи' },
      { name: 'Търсене + договор + нанасяне', price: 119, desc: 'до ключа в ръка' }
    ],
    keywords: ['жилище', 'квартира', 'wohnung', 'mietvertrag', 'schufa', 'kaution', 'wg', 'wohngemeinschaft']
  },
  {
    key: 'full_service',
    name: 'Пълно обслужване А до Я',
    from: 99,
    tiers: [
      { name: 'Месечен пакет', price: 99, desc: 'личен консултант за 1 месец — неограничени въпроси' },
      { name: 'Годишен абонамент', price: 990, desc: '2 безплатни месеца включени' }
    ],
    keywords: ['пълно обслужване', 'консултант', 'всичко', 'личен', 'rundum']
  },
  {
    key: 'vip',
    name: 'VIP Абонамент',
    from: 149,
    monthly: true,
    tiers: [
      { name: 'VIP Монтли', price: 149, desc: 'неограничени заявки, приоритет, лична WhatsApp линия' }
    ],
    keywords: ['vip', 'абонамент', 'premium', 'приоритет']
  }
];

const PACKAGE_TIERS = {
  basic: {
    name: 'Базов',
    positioning: 'най-евтин, бърза помощ с конкретен проблем, без излишни екстри',
    fit: 'клиентът знае точно какво иска и има просто нужда'
  },
  standard: {
    name: 'Стандарт',
    positioning: 'препоръчан — комбинация от услуги, с придружаване в процеса',
    fit: 'повечето клиенти — дава стойност без да е прекалено скъпо'
  },
  full: {
    name: 'Пълен',
    positioning: 'всичко от А до Я, включително превод, попълване, комуникация с институция',
    fit: 'клиент който не иска да се занимава — плаща да му се реши всичко'
  },
  vip: {
    name: 'VIP',
    positioning: '€149/месец абонамент — неограничени заявки, лична WhatsApp линия',
    fit: 'клиенти с повтарящи се нужди или компании'
  }
};

const SALES_RULES = [
  'Винаги гледай какво клиентът реално иска, не какво пишеш в заявката.',
  'Не пробвай да продадеш скъп пакет, ако клиентът има една конкретна нужда — предложи Базов.',
  'Препоръчвай Стандарт когато има 2-3 свързани нужди (най-честият случай).',
  'Препоръчвай Пълен когато клиентът е нов в държавата или изглежда изгубен в системата.',
  'Ако клиентът е писал на немски/английски → може да не е силен с езика, пакет с превод е разумен.',
  'VIP абонамент е само ако клиентът е писал преди (2+ заявки) или има бизнес.',
  'Никога не измисляй цена — използвай точно цените от SERVICES.'
];

function formatKnowledgeForPrompt() {
  const lines = [];
  lines.push('=== КОМПАНИЯ ===');
  lines.push(COMPANY.name + ' — ' + COMPANY.mission);
  lines.push('USP: ' + COMPANY.usp);
  lines.push('Работно време: ' + COMPANY.hours + ' · WhatsApp: ' + COMPANY.whatsapp);
  lines.push('');
  lines.push('=== УСЛУГИ И ЦЕНИ (актуални, използвай ТОЧНО тези) ===');
  for (const svc of SERVICES) {
    lines.push('');
    lines.push('▸ ' + svc.name + ' — от €' + svc.from);
    if (svc.avgReturn) lines.push('  ' + svc.avgReturn);
    for (const t of svc.tiers) {
      lines.push('  · ' + t.name + ' — €' + t.price + (svc.monthly ? '/мес' : '') + ' (' + t.desc + ')');
    }
  }
  lines.push('');
  lines.push('=== ПАКЕТНИ НИВА ===');
  for (const k of Object.keys(PACKAGE_TIERS)) {
    const p = PACKAGE_TIERS[k];
    lines.push('▸ ' + p.name + ' — ' + p.positioning);
    lines.push('  Подходящ за: ' + p.fit);
  }
  lines.push('');
  lines.push('=== ПРОДАЖБЕНИ ПРАВИЛА ===');
  SALES_RULES.forEach(function(r) { lines.push('· ' + r); });
  return lines.join('\n');
}

function detectTags(text) {
  if (!text) return [];
  const t = String(text).toLowerCase();
  const tags = new Set();
  for (const svc of SERVICES) {
    for (const kw of (svc.keywords || [])) {
      if (t.includes(kw)) { tags.add(svc.key); break; }
    }
  }
  // urgency signals
  if (/\b(спешно|срочно|урген|asap|до утре|днес|веднага|dringend|urgent)\b/.test(t)) tags.add('urgent');
  // language signals
  if (/[a-z]{4,}/i.test(t) && /[äöüß]|\bich\b|\bbitte\b|\bdanke\b/i.test(t)) tags.add('writes_german');
  return Array.from(tags);
}

module.exports = {
  COMPANY,
  SERVICES,
  PACKAGE_TIERS,
  SALES_RULES,
  formatKnowledgeForPrompt,
  detectTags
};
