/* =============================================
   BG Помощ — Country Data
   Динамични данни по държави за wizard и услуги
   ============================================= */
'use strict';

var COUNTRY_DATA = {

  'Германия': {
    flag: '🇩🇪',
    bureauName: 'Jobcenter',
    institutions: [
      'Jobcenter', 'Kindergeld', 'Elterngeld', 'Krankenkasse',
      'Finanzamt', 'Rentenversicherung', 'Ausländerbehörde',
      'Wohngeld', 'BAföG', 'Друга'
    ],
    registration: 'Anmeldung (регистрация по адрес)',
    health: 'Krankenkasse (AOK, TK, Barmer и др.)',
    taxId: 'Steuer-ID',
    taxOffice: 'Finanzamt',
    childBenefit: 'Kindergeld',
    socialBenefits: 'Bürgergeld, Wohngeld',
    newcomerNeeds: [
      'Anmeldung (регистрация по адрес)',
      'Krankenkasse (здравна каса)',
      'Банкова сметка',
      'Steuer-ID (данъчен номер)',
      'SIM карта и интернет',
      'Ориентация и съвети',
      'Търсене на жилище',
      'Всичко от списъка'
    ],
    institutionH3: 'Jobcenter, Kindergeld, Bürgergeld и повече',
    institutionP: 'Получавате писма от Jobcenter, Kindergeld или Bürgergeld, които не разбирате? Ние превеждаме, обясняваме и пишем отговори вместо вас — бързо и точно.',
    institutionFeatures: [
      'Превод и обяснение на писма от институции',
      'Писма до Jobcenter, Kindergeld, Bürgergeld',
      'Обжалвания (Widerspruch)',
      'Finanzamt, Rentenversicherung, Ausländerbehörde',
      'Wohngeld, BAföG и всякакви социални служби',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките първи стъпки в Германия',
    newcomerP: 'Пристигнали сте в Германия и не знаете откъде да започнете? Anmeldung, Krankenkasse, Steuer-ID — ние се грижим за всичко в един пакет, за една цена, без стрес.',
    newcomerFeatures: [
      'Помощ с Anmeldung (регистрация по адрес)',
      'Krankenkasse — избор на каса и регистрация',
      'Банкова сметка — съвети и помощ при избор',
      'Steuer-ID и данъчна регистрация',
      'Ориентация и практически съвети',
      '7-дневна поддръжка след пристигането'
    ],
    coursesFunding: 'Jobcenter (Bildungsgutschein)',
    cvLanguage: 'немски',
    jobH3: 'CV на немски и кандидатстване в Германия',
    jobP: 'Немският пазар изисква CV по Lebenslauf формат и персонализирано Anschreiben. Подготвяме всичко — правилен формат, правилен тон, без грешки, готово за изпращане.',
    jobFeatures: [
      'CV по немски Lebenslauf формат',
      'Anschreiben — мотивационно писмо за конкретна обява',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ DE / EN / FR',
    docsAppeal: 'Widerspruch',
    taxH3: 'Данъчна декларация в Германия (Steuererklärung)',
    taxP: 'Подаваме вашата <strong>Steuererklärung</strong> в Finanzamt и се борим за максимален данъчен възврат. Средно нашите клиенти получават между <strong>€500 и €2 000</strong> обратно.',
    taxFeatures: [
      'Попълване на Steuererklärung онлайн — без да идвате при нас',
      'Оптимизация за максимален Steuererstattung (данъчен възврат)',
      'Приспадане на работни разходи, пътувания и наем',
      'Обработка за предходни 4 данъчни години (Nachreichung)',
      'Комуникация с Finanzamt при нужда от документи',
      'Уведомление за резултата веднага след обработка'
    ]
  },

  'Австрия': {
    flag: '🇦🇹',
    bureauName: 'AMS',
    institutions: [
      'AMS (бюро по труда)', 'Familienbeihilfe (детски)',
      'Kinderbetreuungsgeld', 'ÖGK (здравна каса)',
      'Finanzamt', 'Pensionsversicherung',
      'MA35 (чужденци — Виена)', 'Sozialhilfe', 'Друга'
    ],
    registration: 'Meldezettel (регистрация по адрес)',
    health: 'ÖGK (Österreichische Gesundheitskasse)',
    taxId: 'Steuernummer',
    taxOffice: 'Finanzamt',
    childBenefit: 'Familienbeihilfe',
    socialBenefits: 'Sozialhilfe, Wohnbeihilfe',
    newcomerNeeds: [
      'Meldezettel (регистрация по адрес)',
      'ÖGK (здравна каса)',
      'Банкова сметка',
      'Steuernummer (данъчен номер)',
      'SIM карта и интернет',
      'Ориентация и съвети',
      'Търсене на жилище',
      'Всичко от списъка'
    ],
    institutionH3: 'AMS, Familienbeihilfe, ÖGK и повече',
    institutionP: 'Получавате писма от AMS, Familienbeihilfe или ÖGK, които не разбирате? Ние превеждаме, обясняваме и пишем отговори вместо вас — бързо и точно.',
    institutionFeatures: [
      'Превод и обяснение на писма от AMS',
      'Писма до Familienbeihilfe, Kinderbetreuungsgeld',
      'Обжалвания (Berufung / Beschwerde)',
      'Finanzamt, Pensionsversicherung, MA35',
      'Sozialhilfe, Wohnbeihilfe и социални служби',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките първи стъпки в Австрия',
    newcomerP: 'Пристигнали сте в Австрия и не знаете откъде да започнете? Meldezettel, ÖGK, Steuernummer — ние се грижим за всичко в един пакет, без стрес.',
    newcomerFeatures: [
      'Помощ с Meldezettel (регистрация по адрес)',
      'ÖGK — избор на каса и регистрация',
      'Банкова сметка — съвети и помощ при избор',
      'Steuernummer и данъчна регистрация',
      'Ориентация и практически съвети',
      '7-дневна поддръжка след пристигането'
    ],
    coursesFunding: 'AMS (финансиране на курсове)',
    cvLanguage: 'немски (австрийски)',
    jobH3: 'CV на немски и кандидатстване в Австрия',
    jobP: 'Австрийският пазар е близо до немския, но с местни нюанси. CV по европейски стандарт, Bewerbungsschreiben и ориентация в AMS — ние подготвяме всичко.',
    jobFeatures: [
      'CV по австрийски / немски стандарт',
      'Bewerbungsschreiben за конкретна обява',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ DE / EN',
    docsAppeal: 'Berufung / Beschwerde',
    taxH3: 'Данъчна декларация в Австрия (Arbeitnehmerveranlagung)',
    taxP: 'Подаваме вашата <strong>Arbeitnehmerveranlagung (ANV)</strong> в австрийския Finanzamt. Данъчният възврат в Австрия може да е значителен — особено за работещи на повече от едно място.',
    taxFeatures: [
      'Попълване на ANV / Steuererklärung онлайн',
      'Оптимизация за максимален данъчен възврат',
      'Приспадане на работни разходи, пътувания и наем',
      'Обработка за предходни 5 данъчни години',
      'Комуникация с австрийския Finanzamt',
      'Уведомление за резултата веднага след обработка'
    ]
  },

  'Швейцария': {
    flag: '🇨🇭',
    bureauName: 'RAV',
    institutions: [
      'RAV (бюро по труда)', 'Familienzulagen (детски)',
      'Krankenkasse', 'Steuerverwaltung (данъчна)',
      'Migrationsamt (имиграция)', 'AHV (пенсионна)',
      'Gemeindeverwaltung (общинска)', 'Друга'
    ],
    registration: 'Anmeldung Gemeinde (регистрация в общината)',
    health: 'Krankenkasse (задължителна, избираш сам)',
    taxId: 'AHV-Nummer',
    taxOffice: 'Steuerverwaltung',
    childBenefit: 'Familienzulagen',
    socialBenefits: 'Sozialhilfe, Ergänzungsleistungen',
    newcomerNeeds: [
      'Anmeldung Gemeinde (регистрация в общината)',
      'Krankenkasse (задължителна здравна каса)',
      'Банкова сметка',
      'AHV-Nummer (данъчен номер)',
      'Aufenthaltsbewilligung (разрешително)',
      'SIM карта и интернет',
      'Ориентация и съвети',
      'Всичко от списъка'
    ],
    institutionH3: 'RAV, Krankenkasse, Steuerverwaltung и повече',
    institutionP: 'Получавате писма от RAV, Krankenkasse или Steuerverwaltung, които не разбирате? Ние превеждаме, обясняваме и пишем отговори вместо вас — бързо и точно.',
    institutionFeatures: [
      'Превод и обяснение на писма от RAV',
      'Писма до Krankenkasse, Familienzulagen',
      'Обжалвания (Einsprache / Rekurs)',
      'Steuerverwaltung, Migrationsamt, AHV',
      'Sozialhilfe и социални служби',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките първи стъпки в Швейцария',
    newcomerP: 'Пристигнали сте в Швейцария? Anmeldung Gemeinde, Krankenkasse, AHV-Nummer — ние се грижим за всичко в един пакет, без стрес.',
    newcomerFeatures: [
      'Помощ с Anmeldung в общината (Gemeinde)',
      'Krankenkasse — избор и задължителна регистрация',
      'Банкова сметка — съвети и помощ при избор',
      'AHV-Nummer и данъчна регистрация',
      'Aufenthaltsbewilligung B/C/L',
      '7-дневна поддръжка след пристигането'
    ],
    coursesFunding: 'RAV (финансиране на курсове)',
    cvLanguage: 'немски / френски / италиански',
    jobH3: 'CV и кандидатстване в Швейцария',
    jobP: 'Швейцарският пазар изисква CV на езика на кантона — немски (Zürich, Bern), френски (Genève) или италиански (Ticino). Подготвяме правилната версия за вашия регион.',
    jobFeatures: [
      'CV на немски, френски или италиански',
      'Мотивационно писмо съобразено с кантона',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ DE / FR / IT / EN',
    docsAppeal: 'Einsprache / Rekurs',
    taxH3: 'Данъчна декларация в Швейцария (Steuererklärung)',
    taxP: 'Подаваме вашата <strong>Steuererklärung</strong> в кантоналната Steuerverwaltung. Швейцарската данъчна система е сложна — правилата варират по кантон (Zürich, Bern, Genève и др.).',
    taxFeatures: [
      'Попълване на Steuererklärung по кантон',
      'Оптимизация за максимален данъчен възврат',
      'Приспадане на разходи, наем, задължителна здравна застраховка',
      'Обработка за предходни 3 данъчни години',
      'Комуникация с кантоналната Steuerverwaltung',
      'Уведомление за резултата веднага след обработка'
    ]
  },

  'Испания': {
    flag: '🇪🇸',
    bureauName: 'SEPE',
    institutions: [
      'SEPE (бюро по труда)', 'Seguridad Social',
      'Agencia Tributaria (данъчна)', 'Extranjería (чужденци)',
      'Ayuntamiento (община)', 'INSS (пенсионна)', 'Друга'
    ],
    registration: 'Empadronamiento (регистрация по адрес)',
    health: 'Tarjeta Sanitaria (здравна карта)',
    taxId: 'NIE (Número de Identidad de Extranjero)',
    taxOffice: 'Agencia Tributaria',
    childBenefit: 'Prestaciones por hijo',
    socialBenefits: 'Prestación por desempleo, Ingreso Mínimo Vital',
    newcomerNeeds: [
      'Empadronamiento (регистрация по адрес)',
      'NIE (идентификационен номер)',
      'Tarjeta Sanitaria (здравна карта)',
      'Банкова сметка',
      'SIM карта и интернет',
      'Ориентация и съвети',
      'Търсене на жилище',
      'Всичко от списъка'
    ],
    institutionH3: 'SEPE, Seguridad Social, Agencia Tributaria и повече',
    institutionP: 'Получавате писма от SEPE, Seguridad Social или Agencia Tributaria, които не разбирате? Ние превеждаме, обясняваме и пишем отговори вместо вас.',
    institutionFeatures: [
      'Превод и обяснение на писма от SEPE',
      'Писма до Seguridad Social, Extranjería',
      'Обжалвания (Recurso de alzada)',
      'Agencia Tributaria, INSS, Ayuntamiento',
      'Prestación por desempleo, Ingreso Mínimo Vital',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките първи стъпки в Испания',
    newcomerP: 'Пристигнали сте в Испания? Empadronamiento, NIE, Tarjeta Sanitaria — ние се грижим за всичко в един пакет, без стрес.',
    newcomerFeatures: [
      'Помощ с Empadronamiento (регистрация по адрес)',
      'NIE — идентификационен номер на чужденец',
      'Tarjeta Sanitaria — здравна карта',
      'Банкова сметка — съвети и помощ при избор',
      'Ориентация и практически съвети',
      '7-дневна поддръжка след пристигането'
    ],
    coursesFunding: 'SEPE (курсове за заети и безработни)',
    cvLanguage: 'испански / английски',
    jobH3: 'CV на испански и кандидатстване в Испания',
    jobP: 'Испанският пазар изисква CV по европейски стандарт и carta de motivación на испански. Подготвяме документите правилно форматирани, без грешки, готови за изпращане.',
    jobFeatures: [
      'CV на испански по европейски стандарт',
      'Carta de motivación за конкретна обява',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ ES / EN / DE',
    docsAppeal: 'Recurso de alzada',
    taxH3: 'Данъчна декларация в Испания (Declaración de la Renta)',
    taxP: 'Подаваме вашата <strong>declaración de la renta (IRPF)</strong> в Agencia Tributaria. Ако сте работили в Испания дори само за кратко, може да ви се полага данъчен възврат.',
    taxFeatures: [
      'Попълване на Modelo 100 онлайн',
      'Оптимизация за максимален данъчен възврат (IRPF)',
      'Приспадане на наем, дарения и работни разходи',
      'Комуникация с Agencia Tributaria',
      'Съвети за NIF и данъчни резиденти / нерезиденти',
      'Уведомление за резултата веднага след обработка'
    ]
  },

  'Франция': {
    flag: '🇫🇷',
    bureauName: 'France Travail',
    institutions: [
      'France Travail / Pôle Emploi', 'CAF (семейни помощи)',
      'CPAM (здравна каса)', 'Impôts / DGFiP (данъчна)',
      'Préfecture (чужденци)', 'CARSAT (пенсионна)', 'Друга'
    ],
    registration: 'Déclaration de domicile',
    health: 'Carte Vitale — CPAM',
    taxId: 'Numéro fiscal',
    taxOffice: 'Impôts / DGFiP',
    childBenefit: 'Allocations familiales (CAF)',
    socialBenefits: 'RSA, APL (жилищна помощ)',
    newcomerNeeds: [
      'Déclaration de domicile (регистрация)',
      'Carte Vitale — CPAM (здравна карта)',
      'CAF (семейни помощи)',
      'Numéro fiscal (данъчен номер)',
      'Банкова сметка',
      'SIM карта и интернет',
      'Ориентация и съвети',
      'Всичко от списъка'
    ],
    institutionH3: 'France Travail, CAF, CPAM и повече',
    institutionP: 'Получавате писма от France Travail, CAF или CPAM, които не разбирате? Ние превеждаме, обясняваме и пишем отговори вместо вас.',
    institutionFeatures: [
      'Превод и обяснение на писма от France Travail',
      'Писма до CAF, CPAM (Carte Vitale)',
      'Обжалвания (Recours)',
      'Impôts / DGFiP, Préfecture',
      'RSA, APL и социални служби',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките първи стъпки във Франция',
    newcomerP: 'Пристигнали сте във Франция? Déclaration de domicile, Carte Vitale, CAF — ние се грижим за всичко в един пакет, без стрес.',
    newcomerFeatures: [
      'Помощ с Déclaration de domicile (регистрация)',
      'CPAM — Carte Vitale (здравна карта)',
      'CAF — регистрация за семейни помощи',
      'Numéro fiscal и данъчна регистрация',
      'Банкова сметка — съвети при избор',
      '7-дневна поддръжка след пристигането'
    ],
    coursesFunding: 'France Travail (CPF — курсове за квалификация)',
    cvLanguage: 'френски',
    jobH3: 'CV на френски и кандидатстване във Франция',
    jobP: 'Французкият пазар изисква CV и lettre de motivation на перфектен френски. Ние подготвяме документите съобразно местния стандарт — кратко, ясно и убедително.',
    jobFeatures: [
      'CV по френски стандарт',
      'Lettre de motivation за конкретна обява',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ FR / EN / DE',
    docsAppeal: 'Recours',
    taxH3: 'Данъчна декларация във Франция (Déclaration des revenus)',
    taxP: 'Подаваме вашата <strong>déclaration des revenus</strong> в DGFiP (impôts.gouv.fr). Дори ако сте работили само за кратко, може да ви се полага данъчен кредит или възврат.',
    taxFeatures: [
      'Попълване на déclaration des revenus онлайн',
      'Оптимизация за максимален данъчен възврат',
      'Приспадане на семейни надбавки и данъчни кредити',
      'Комуникация с DGFiP (impôts.gouv.fr)',
      'Съвети за чужденци — résidents fiscaux',
      'Уведомление за резултата веднага след обработка'
    ]
  },

  'Италия': {
    flag: '🇮🇹',
    bureauName: 'CPI (Centro per l\'Impiego)',
    institutions: [
      'INPS (социално осигуряване)', 'Agenzia delle Entrate (данъчна)',
      'Questura (полиция / чужденци)', 'ASL (здравна служба)',
      'CAF (данъчна помощ)', 'Comune (община)', 'Друга'
    ],
    registration: 'Residenza (регистрация в comune)',
    health: 'Tessera Sanitaria / ASL',
    taxId: 'Codice Fiscale',
    taxOffice: 'Agenzia delle Entrate',
    childBenefit: 'Assegno Unico per i figli',
    socialBenefits: 'Reddito di Cittadinanza, Contributo affitti',
    newcomerNeeds: [
      'Residenza (регистрация в comune)',
      'Tessera Sanitaria / ASL (здравна карта)',
      'Codice Fiscale (данъчен код)',
      'Permesso di Soggiorno (разрешително)',
      'Банкова сметка',
      'SIM карта и интернет',
      'Ориентация и съвети',
      'Всичко от списъка'
    ],
    institutionH3: 'INPS, Agenzia delle Entrate, Questura и повече',
    institutionP: 'Получавате писма от INPS, Questura или Agenzia delle Entrate, които не разбирате? Ние превеждаме, обясняваме и пишем отговори вместо вас.',
    institutionFeatures: [
      'Превод и обяснение на писма от INPS',
      'Писма до Questura, Agenzia delle Entrate',
      'Обжалвания (Ricorso)',
      'ASL, Comune, CAF',
      'Assegno Unico, Reddito di Cittadinanza',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките първи стъпки в Италия',
    newcomerP: 'Пристигнали сте в Италия? Residenza, Codice Fiscale, Tessera Sanitaria — ние се грижим за всичко в един пакет, без стрес.',
    newcomerFeatures: [
      'Помощ с Residenza (регистрация в comune)',
      'Tessera Sanitaria / ASL — здравна карта',
      'Codice Fiscale и данъчна регистрация',
      'Permesso di Soggiorno (разрешително)',
      'Банкова сметка — съвети при избор',
      '7-дневна поддръжка след пристигането'
    ],
    coursesFunding: 'Regione / CPI (регионални курсове за квалификация)',
    cvLanguage: 'италиански / английски',
    jobH3: 'CV на италиански и кандидатстване в Италия',
    jobP: 'Италианският пазар изисква CV и lettera di presentazione. Ние подготвяме документите на правилния италиански или английски, форматирани по европейски стандарт.',
    jobFeatures: [
      'CV по италиански / европейски стандарт',
      'Lettera di presentazione за конкретна обява',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ IT / EN / DE',
    docsAppeal: 'Ricorso',
    taxH3: 'Данъчна декларация в Италия (Dichiarazione dei redditi)',
    taxP: 'Подаваме вашия <strong>Modello 730</strong> или UNICO в Agenzia delle Entrate. Помагаме ви да получите обратно платения данък и да приспаднете всички допустими разходи.',
    taxFeatures: [
      'Попълване на Modello 730 или Redditi PF онлайн',
      'Оптимизация за максимален данъчен възврат',
      'Приспадане на медицински разходи, наем, лихви по ипотека',
      'Комуникация с Agenzia delle Entrate',
      'Съвети за Codice Fiscale и данъчни резиденти',
      'Уведомление за резултата веднага след обработка'
    ]
  },

  'Нидерландия': {
    flag: '🇳🇱',
    bureauName: 'UWV',
    institutions: [
      'UWV (бюро по труда)', 'SVB (социално осигуряване)',
      'Belastingdienst (данъчна)', 'IND (имиграция)',
      'DUO (образование)', 'Gemeente (община)', 'Друга'
    ],
    registration: 'Inschrijving bij gemeente (регистрация в общината)',
    health: 'Zorgverzekering (задължителна здравна застраховка)',
    taxId: 'BSN (Burgerservicenummer)',
    taxOffice: 'Belastingdienst',
    childBenefit: 'Kinderbijslag (SVB)',
    socialBenefits: 'Huurtoeslag, Zorgtoeslag, Bijstand',
    newcomerNeeds: [
      'Inschrijving gemeente (регистрация)',
      'BSN (Burgerservicenummer)',
      'Zorgverzekering (здравна застраховка)',
      'DigiD (дигитална идентичност)',
      'Банкова сметка',
      'SIM карта и интернет',
      'Ориентация и съвети',
      'Всичко от списъка'
    ],
    institutionH3: 'UWV, Belastingdienst, IND и повече',
    institutionP: 'Получавате писма от UWV, Belastingdienst или IND, които не разбирате? Ние превеждаме, обясняваме и пишем отговори вместо вас.',
    institutionFeatures: [
      'Превод и обяснение на писма от UWV',
      'Писма до SVB, Belastingdienst, IND',
      'Обжалвания (Bezwaar)',
      'Huurtoeslag, Zorgtoeslag, Bijstand',
      'Gemeente и социални служби',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките първи стъпки в Нидерландия',
    newcomerP: 'Пристигнали сте в Нидерландия? BSN, Zorgverzekering, DigiD — ние се грижим за всичко в един пакет, без стрес.',
    newcomerFeatures: [
      'Помощ с Inschrijving в gemeente (регистрация)',
      'Zorgverzekering — задължителна здравна застраховка',
      'BSN — Burgerservicenummer',
      'Belastingdienst и данъчна регистрация',
      'DigiD и дигитални услуги',
      '7-дневна поддръжка след пристигането'
    ],
    coursesFunding: 'UWV (курсове за квалификация)',
    cvLanguage: 'нидерландски / английски',
    jobH3: 'CV на нидерландски/английски и кандидатстване в Нидерландия',
    jobP: 'Нидерландският пазар е силно международен — CV на нидерландски или английски, с motivatiebrief. Подготвяме двете версии съобразно вашия профил и конкретната обява.',
    jobFeatures: [
      'CV на нидерландски или английски',
      'Motivatiebrief за конкретна обява',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ NL / EN / DE',
    docsAppeal: 'Bezwaar',
    taxH3: 'Данъчна декларация в Нидерландия (Belastingaangifte)',
    taxP: 'Подаваме вашата <strong>aangifte inkomstenbelasting</strong> в Belastingdienst. Данъчният възврат в Нидерландия може да е много значителен — особено за работещи за първата си пълна година.',
    taxFeatures: [
      'Попълване на aangifte inkomstenbelasting онлайн',
      'Оптимизация за максимален belastingteruggave',
      'Приспадане на zorgtoeslag, huurtoeslag и пенсионни',
      'Обработка за предходни 5 данъчни години',
      'Комуникация с Belastingdienst',
      'Уведомление за резултата веднага след обработка'
    ]
  },

  'Белгия': {
    flag: '🇧🇪',
    bureauName: 'VDAB / Actiris / Forem',
    institutions: [
      'VDAB / Actiris / Forem (бюро по труда)',
      'ONSS (социално осигуряване)', 'SPF Finances (данъчна)',
      'Office des Étrangers (чужденци)', 'Commune (община)',
      'CPAS / OCMW (социална помощ)', 'Друга'
    ],
    registration: 'Inscription au registre de la population',
    health: 'Mutualité / Ziekenfonds (здравна каса)',
    taxId: 'Numéro national (национален номер)',
    taxOffice: 'SPF Finances',
    childBenefit: 'Allocations familiales',
    socialBenefits: 'CPAS/OCMW, Allocation de chômage',
    newcomerNeeds: [
      'Inscription commune (регистрация)',
      'Numéro national (национален номер)',
      'Mutualité / Ziekenfonds (здравна каса)',
      'eID карта',
      'Банкова сметка',
      'SIM карта и интернет',
      'Ориентация и съвети',
      'Всичко от списъка'
    ],
    institutionH3: 'VDAB/Actiris, ONSS, SPF Finances и повече',
    institutionP: 'Получавате писма от VDAB/Actiris, ONSS или SPF Finances, които не разбирате? Ние превеждаме, обясняваме и пишем отговори вместо вас.',
    institutionFeatures: [
      'Превод и обяснение на писма от VDAB/Actiris/Forem',
      'Писма до ONSS, SPF Finances',
      'Обжалвания (Recours / Beroep)',
      'Office des Étrangers, Commune',
      'CPAS/OCMW и социални служби',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките първи стъпки в Белгия',
    newcomerP: 'Пристигнали сте в Белгия? Inscription commune, Numéro national, Mutualité — ние се грижим за всичко в един пакет, без стрес.',
    newcomerFeatures: [
      'Помощ с Inscription в commune (регистрация)',
      'Mutualité / Ziekenfonds — здравна каса',
      'Numéro national и данъчна регистрация',
      'eID карта и дигитални услуги',
      'Банкова сметка — съвети при избор',
      '7-дневна поддръжка след пристигането'
    ],
    coursesFunding: 'VDAB / Actiris (финансиране на курсове)',
    cvLanguage: 'нидерландски / френски / английски',
    jobH3: 'CV и кандидатстване в Белгия',
    jobP: 'Белгийският пазар изисква CV на езика на региона — нидерландски (Фландрия), френски (Валония) или английски. Ние подготвяме правилната версия за вашия регион.',
    jobFeatures: [
      'CV на нидерландски, френски или английски',
      'Motivatiebrief / Lettre de motivation за конкретна обява',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ NL / FR / EN',
    docsAppeal: 'Recours / Beroep',
    taxH3: 'Данъчна декларация в Белгия (Déclaration fiscale)',
    taxP: 'Подаваме вашата <strong>déclaration à l\'impôt des personnes physiques</strong> в SPF Finances. Белгийската данъчна система е сред най-сложните в ЕС — ние я познаваме отлично.',
    taxFeatures: [
      'Попълване на déclaration fiscale онлайн (Tax-on-web)',
      'Оптимизация за максимален данъчен възврат',
      'Приспадане на деца, наем, пенсионни и профсъюзни вноски',
      'Комуникация с SPF Finances',
      'Съвети за residents vs non-residents',
      'Уведомление за резултата веднага след обработка'
    ]
  },

  'Дания': {
    flag: '🇩🇰',
    bureauName: 'Jobcenter',
    institutions: [
      'Jobcenter', 'Udbetaling Danmark (помощи)',
      'SKAT (данъчна)', 'Udlændingestyrelsen (имиграция)',
      'Kommune (община)', 'Arbejdsmarkedets Tillægspension (ATP)', 'Друга'
    ],
    registration: 'Folkeregister + CPR-nummer',
    health: 'Sundhedskort (жълта здравна карта)',
    taxId: 'CPR-nummer',
    taxOffice: 'SKAT',
    childBenefit: 'Børnefamilieydelse (Udbetaling Danmark)',
    socialBenefits: 'Kontanthjælp, Boligstøtte',
    newcomerNeeds: [
      'CPR-nummer (граждански номер)',
      'Folkeregister (регистрация)',
      'Sundhedskort (жълта здравна карта)',
      'MitID (дигитална идентичност)',
      'Банкова сметка',
      'SIM карта и интернет',
      'Ориентация и съвети',
      'Всичко от списъка'
    ],
    institutionH3: 'Jobcenter, SKAT, Udbetaling Danmark и повече',
    institutionP: 'Получавате писма от Jobcenter, SKAT или Udbetaling Danmark, които не разбирате? Ние превеждаме, обясняваме и пишем отговори вместо вас.',
    institutionFeatures: [
      'Превод и обяснение на писма от Jobcenter',
      'Писма до Udbetaling Danmark, SKAT',
      'Обжалвания (Klage)',
      'Udlændingestyrelsen, Kommune',
      'Kontanthjælp, Boligstøtte',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките първи стъпки в Дания',
    newcomerP: 'Пристигнали сте в Дания? CPR-nummer, Sundhedskort, MitID — ние се грижим за всичко в един пакет, без стрес.',
    newcomerFeatures: [
      'Помощ с Folkeregister (регистрация)',
      'Sundhedskort — жълта здравна карта',
      'CPR-nummer и данъчна регистрация',
      'MitID и дигитални услуги',
      'Банкова сметка — съвети при избор',
      '7-дневна поддръжка след пристигането'
    ],
    coursesFunding: 'Jobcenter (курсове за квалификация)',
    cvLanguage: 'датски / английски',
    jobH3: 'CV на датски/английски и кандидатстване в Дания',
    jobP: 'Датският пазар е международен — CV на датски или английски, с добре написан ansøgning. Ние подготвяме документите на правилния формат и език за вашата позиция.',
    jobFeatures: [
      'CV на датски или английски',
      'Ansøgning — мотивационно писмо за конкретна обява',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ DA / EN / DE',
    docsAppeal: 'Klage',
    taxH3: 'Данъчна декларация в Дания (Selvangivelse / Årsopgørelse)',
    taxP: 'Подаваме вашата <strong>årsopgørelse</strong> в SKAT. Данъчните ставки в Дания са високи, затова данъчният възврат може да е значителен. Помагаме с TastSelv и MitID.',
    taxFeatures: [
      'Попълване на årsopgørelse / selvangivelse онлайн',
      'Оптимизация за максимален данъчен възврат',
      'Приспадане на транспорт, синдикални вноски, наем',
      'Комуникация с SKAT',
      'Помощ с TastSelv и MitID',
      'Уведомление за резултата веднага след обработка'
    ]
  },

  'Великобритания': {
    flag: '🇬🇧',
    bureauName: 'Jobcentre Plus',
    institutions: [
      'Jobcentre Plus', 'HMRC (данъчна)',
      'Home Office (имиграция)', 'NHS (здравна система)',
      'Universal Credit', 'Local Council (общинска)', 'Друга'
    ],
    registration: 'National Insurance Number (NI Number)',
    health: 'NHS — регистрация при GP (семеен лекар)',
    taxId: 'National Insurance Number (NI)',
    taxOffice: 'HMRC',
    childBenefit: 'Child Benefit (HMRC)',
    socialBenefits: 'Universal Credit, Housing Benefit',
    newcomerNeeds: [
      'National Insurance Number (NI)',
      'NHS — регистрация при GP',
      'Банкова сметка',
      'Biometric Residence Permit (BRP)',
      'Council Tax (данък жилище)',
      'SIM карта и интернет',
      'Ориентация и съвети',
      'Всичко от списъка'
    ],
    institutionH3: 'Jobcentre Plus, HMRC, Home Office и повече',
    institutionP: 'Получавате писма от HMRC, Universal Credit или Home Office, които не разбирате? Ние превеждаме, обясняваме и пишем отговори вместо вас.',
    institutionFeatures: [
      'Превод и обяснение на писма от HMRC',
      'Писма до Universal Credit, Jobcentre Plus',
      'Обжалвания (Mandatory Reconsideration / Appeal)',
      'Home Office, Local Council',
      'Housing Benefit и социални услуги',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките първи стъпки в Обединеното кралство',
    newcomerP: 'Пристигнали сте в Обединеното кралство? NI Number, NHS GP, банкова сметка — ние се грижим за всичко в един пакет, без стрес.',
    newcomerFeatures: [
      'Помощ с National Insurance Number (NI)',
      'NHS — регистрация при семеен лекар (GP)',
      'Банкова сметка — съвети при избор',
      'HMRC и данъчна регистрация',
      'Biometric Residence Permit (BRP)',
      '7-дневна поддръжка след пристигането'
    ],
    coursesFunding: 'Jobcentre Plus (курсове за квалификация)',
    cvLanguage: 'английски',
    jobH3: 'CV на английски и кандидатстване в Обединеното кралство',
    jobP: 'Британският пазар изисква CV по UK формат — кратко, ориентирано към постиженията, с персонализирано cover letter. Ние подготвяме всичко по правилния UK стандарт.',
    jobFeatures: [
      'CV по UK формат (achievements-focused)',
      'Cover letter за конкретна обява',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ EN / DE / FR',
    docsAppeal: 'Mandatory Reconsideration / Appeal',
    taxH3: 'Данъчна декларация в Обединеното кралство (Self Assessment)',
    taxP: 'Подаваме вашата <strong>Self Assessment</strong> в HMRC. Ако сте работили на PAYE или сте самоосигуряващ се, може да ви се полага значителен данъчен възврат.',
    taxFeatures: [
      'Попълване на Self Assessment онлайн',
      'Оптимизация за максимален данъчен възврат',
      'Приспадане на работни разходи, mileage, home office',
      'Комуникация с HMRC',
      'Помощ с UTR Number и Government Gateway',
      'Уведомление за резултата веднага след обработка'
    ]
  },

  'Швеция': {
    flag: '🇸🇪',
    bureauName: 'Arbetsförmedlingen',
    institutions: [
      'Arbetsförmedlingen (бюро по труда)',
      'Försäkringskassan (социално осигуряване)',
      'Skatteverket (данъчна)', 'Migrationsverket (имиграция)',
      'Socialtjänsten (социална служба)', 'Kommun (община)', 'Друга'
    ],
    registration: 'Folkbokföring (регистрация в Skatteverket)',
    health: 'Регистрация в Vårdcentral (здравен център)',
    taxId: 'Personnummer',
    taxOffice: 'Skatteverket',
    childBenefit: 'Barnbidrag (Försäkringskassan)',
    socialBenefits: 'Bostadsbidrag, Ekonomiskt bistånd',
    newcomerNeeds: [
      'Folkbokföring (регистрация в Skatteverket)',
      'Personnummer (личен номер)',
      'Vårdcentral (здравен център)',
      'BankID (дигитална идентичност)',
      'Банкова сметка',
      'SIM карта и интернет',
      'Ориентация и съвети',
      'Всичко от списъка'
    ],
    institutionH3: 'Arbetsförmedlingen, Försäkringskassan, Skatteverket и повече',
    institutionP: 'Получавате писма от Arbetsförmedlingen, Försäkringskassan или Skatteverket, които не разбирате? Ние превеждаме, обясняваме и пишем отговори вместо вас.',
    institutionFeatures: [
      'Превод и обяснение на писма от Arbetsförmedlingen',
      'Писма до Försäkringskassan, Skatteverket',
      'Обжалвания (Överklagan)',
      'Migrationsverket, Socialtjänsten',
      'Bostadsbidrag, Barnbidrag',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките първи стъпки в Швеция',
    newcomerP: 'Пристигнали сте в Швеция? Folkbokföring, Personnummer, Vårdcentral — ние се грижим за всичко в един пакет, без стрес.',
    newcomerFeatures: [
      'Помощ с Folkbokföring (регистрация)',
      'Vårdcentral — регистрация в здравен център',
      'Personnummer и данъчна регистрация',
      'BankID и дигитални услуги',
      'Банкова сметка — съвети при избор',
      '7-дневна поддръжка след пристигането'
    ],
    coursesFunding: 'Arbetsförmedlingen (курсове за квалификация)',
    cvLanguage: 'шведски / английски',
    jobH3: 'CV на шведски/английски и кандидатстване в Швеция',
    jobP: 'Шведският пазар изисква CV на шведски или английски с персонализирано personligt brev. Подготвяме всичко съобразно вашия профил и правилния шведски стандарт.',
    jobFeatures: [
      'CV на шведски или английски',
      'Personligt brev — мотивационно писмо за конкретна обява',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ SV / EN / DE',
    docsAppeal: 'Överklagan',
    taxH3: 'Данъчна декларация в Швеция (Inkomstdeklaration)',
    taxP: 'Подаваме вашата <strong>inkomstdeklaration</strong> в Skatteverket. Данъчната система е цифрова — помагаме ви с BankID, Mina sidor и всички приспадания за pendling, ремонти и повече.',
    taxFeatures: [
      'Попълване на inkomstdeklaration онлайн',
      'Оптимизация за максимален данъчен възврат',
      'Приспадане на pendling (пътуване до работа), ремонти, ROT/RUT',
      'Комуникация с Skatteverket',
      'Помощ с BankID и Mina sidor',
      'Уведомление за резултата веднага след обработка'
    ]
  },

  'България': {
    flag: '🇧🇬',
    bureauName: 'Бюро по труда',
    institutions: [
      'Бюро по труда', 'НАП (данъчна агенция)',
      'НОИ (осигуряване)', 'НЗОК (здравна каса)',
      'Агенция за социално подпомагане', 'Община', 'Друга'
    ],
    registration: 'Адресна регистрация в община',
    health: 'НЗОК (Национална здравноосигурителна каса)',
    taxId: 'ЕГН / БУЛСТАТ',
    taxOffice: 'НАП',
    childBenefit: 'Детски надбавки (Агенция социално подпомагане)',
    socialBenefits: 'Социално подпомагане, Месечни добавки',
    newcomerNeeds: [
      'Адресна регистрация в община',
      'НЗОК (здравна осигуровка)',
      'ЕГН / Лична карта',
      'НАП (данъчна регистрация)',
      'Банкова сметка',
      'Ориентация и съвети',
      'Търсене на жилище',
      'Всичко от списъка'
    ],
    institutionH3: 'НАП, НОИ, НЗОК, Бюро по труда и повече',
    institutionP: 'Имате въпроси към НАП, НОИ, НЗОК или общинска администрация? Ние помагаме с документите и комуникацията с всички институции — бързо и точно.',
    institutionFeatures: [
      'Помощ с документи за НАП и НОИ',
      'Писма до НЗОК, Бюро по труда',
      'Жалби и обжалвания',
      'Общинска администрация',
      'Социално подпомагане, Детски надбавки',
      'Пълна комуникация от ваше лице при нужда'
    ],
    newcomerH3: 'Всичките важни стъпки в България',
    newcomerP: 'Завръщате се в България? Адресна регистрация, НЗОК, НАП — ние помагаме с всички важни стъпки наведнъж, без стрес.',
    newcomerFeatures: [
      'Помощ с адресна регистрация в община',
      'НЗОК — здравноосигурителна регистрация',
      'НАП и данъчна регистрация',
      'Документи за социално подпомагане',
      'Банкова сметка — съвети при избор',
      '7-дневна поддръжка'
    ],
    coursesFunding: 'Бюро по труда (курсове за безработни)',
    cvLanguage: 'български / английски',
    jobH3: 'CV на български/английски и кандидатстване в България',
    jobP: 'Търсите работа в България? Ние подготвяме CV и мотивационно писмо по европейски стандарт — на български или английски, готово за изпращане към работодател.',
    jobFeatures: [
      'CV по европейски стандарт на български или английски',
      'Мотивационно писмо за конкретна обява',
      'Кандидатстване от ваше лице при желание',
      '1 безплатна ревизия включена',
      'Доставка до 24 часа'
    ],
    docsLang: 'BG ↔ EN / DE / RO',
    docsAppeal: 'Жалба / Возражение',
    taxH3: 'Данъчна декларация в България (Декларация по чл. 50)',
    taxP: 'Подаваме вашата <strong>годишна данъчна декларация по чл. 50</strong> в НАП. Помагаме и с деклариране на доходи от чужбина и оптимизация на данъчната основа.',
    taxFeatures: [
      'Попълване на Декларация по чл. 50 онлайн',
      'Деклариране на доходи от чужбина (избягване на двойно данъчно облагане)',
      'Приспадане на осигурителни вноски и дарения',
      'Комуникация с НАП онлайн',
      'Помощ с e-услугите на НАП чрез КЕП',
      'Уведомление за резултата веднага след обработка'
    ]
  }

};

/* Помощна функция — връща данните за дадена държава или Германия по подразбиране */
function getCountryData(country) {
  return COUNTRY_DATA[country] || COUNTRY_DATA['Германия'];
}
