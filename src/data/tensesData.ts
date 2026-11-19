export interface TenseRuleItem {
  id: string;
  title: string;
  badge: string;
  ruleFr: string;
  formula: string;
  spellingRules?: Array<{ rule: string; example: string }>;
  examples: Array<{
    type: '(+) Affirmatif' | '(−) Négatif' | '(?) Question' | '(=) Réponse courte';
    en: string;
    fr: string;
    tip?: string;
  }>;
  goldenRule: string;
  markers: string[];
}

export interface ExpressionCategory {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  explanationFr: string;
  formula: string;
  items: Array<{
    keyword: string;
    meaningFr: string;
    ruleFr: string;
    exampleEn: string;
    exampleFr: string;
  }>;
  goldenTip: string;
}

export interface ConjugatorVerb {
  id: string;
  base: string;
  fr: string;
  presentThird: string;
  presentCont: string;
  pastSimple: string;
  isIrregularPast: boolean;
  notes: string;
}

export interface TenseQuizQuestion {
  id: string;
  tenseCategory: 'present-simple' | 'present-continuous' | 'past-simple' | 'expressions';
  badge: string;
  promptFr: string;
  sentenceWithBlank: string;
  options: string[];
  correctIndex: number;
  explanationFr: string;
  completedEn: string;
}

export const PRESENT_SIMPLE_DATA: TenseRuleItem = {
  id: 'present-simple',
  title: 'Le Present Simple (Présent d’habitude & vérités)',
  badge: 'Habitude · Vérités · Routine',
  ruleFr:
    'Sert à exprimer ce que l’on fait régulièrement, ses habitudes, ses goûts et des faits toujours vrais.',
  formula: 'Base Verbale (+ -S / -ES / -IES avec he, she, it)',
  spellingRules: [
    {
      rule: 'Règle générale : on ajoute un simple -s',
      example: 'play → plays · read → reads · listen → listens · like → likes',
    },
    {
      rule: 'Verbes en -o, -s, -sh, -ch, -x : on ajoute -es pour faciliter la prononciation',
      example: 'go → goes · do → does · watch → watches · wash → washes · fix → fixes',
    },
    {
      rule: 'Consonne + Y : le y se transforme en -ies',
      example: 'study → studies · fly → flies · cry → cries (MAIS voyelle + y : play → plays)',
    },
    {
      rule: 'Cas particuliers essentiels',
      example: 'have → has · be → am / is / are',
    },
  ],
  examples: [
    {
      type: '(+) Affirmatif',
      en: 'She plays the guitar every Saturday morning.',
      fr: 'Elle joue de la guitare tous les samedis matin.',
      tip: 'Avec « She », ne jamais oublier le -s !',
    },
    {
      type: '(−) Négatif',
      en: "He doesn't watch TV after eight o'clock.",
      fr: 'Il ne regarde pas la télévision après huit heures.',
      tip: 'Le -s part dans « doesn’t » : le verbe watch redevient neutre !',
    },
    {
      type: '(?) Question',
      en: 'Do you like listening to Bruno Mars?',
      fr: 'Est-ce que tu aimes écouter Bruno Mars ?',
      tip: 'Avec « you », on commence par « Do » (et « Does » avec he/she/it).',
    },
    {
      type: '(=) Réponse courte',
      en: 'Yes, I do. / No, she doesn’t.',
      fr: 'Oui. / Non.',
      tip: 'On reprend toujours l’auxiliaire Do ou Does dans la réponse.',
    },
  ],
  goldenRule:
    'Règle d’or : À la 3e personne du singulier (he, she, it, mon chat, la professeure), le verbe prend TOUJOURS un -s à la forme affirmative. À la négation et en question, c’est l’auxiliaire DOES qui prend le -s, le verbe reste à la base verbale !',
  markers: [
    'every day',
    'every week',
    'on Mondays',
    'always',
    'usually',
    'often',
    'sometimes',
    'never',
  ],
};

export const PRESENT_CONTINUOUS_DATA: TenseRuleItem = {
  id: 'present-continuous',
  title: 'Le Present Continuous (Présent en BE + V-ing)',
  badge: 'En train de · Moment présent · Image',
  ruleFr:
    'Sert à décrire une action qui se déroule en ce moment même sous nos yeux, ou ce qui se passe sur une image.',
  formula: 'am / is / are + Base Verbale-ING',
  spellingRules: [
    {
      rule: 'Règle générale : on colle -ing directement à la base verbale',
      example: 'draw → drawing · read → reading · sleep → sleeping · play → playing',
    },
    {
      rule: 'Verbes terminés par un -e muet : le -e disparaît devant -ing',
      example: 'write → writing · make → making · dance → dancing · ride → riding',
    },
    {
      rule: 'Règle 1-1-1 (1 syllabe, 1 voyelle, 1 consonne finale) : on double la consonne',
      example: 'run → running · swim → swimming · sit → sitting · stop → stopping',
    },
    {
      rule: 'Verbes terminés par -ie : le -ie devient -y',
      example: 'die → dying · lie → lying',
    },
  ],
  examples: [
    {
      type: '(+) Affirmatif',
      en: 'Look! The sea turtle is swimming across the bay.',
      fr: 'Regarde ! La tortue de mer est en train de nager à travers la baie.',
      tip: 'Look! est un signal immédiat du présent continu.',
    },
    {
      type: '(−) Négatif',
      en: 'I am not doing my homework right now.',
      fr: 'Je ne suis pas en train de faire mes devoirs en ce moment.',
      tip: 'On ajoute « not » juste après l’auxiliaire BE (am not, isn’t, aren’t).',
    },
    {
      type: '(?) Question',
      en: 'Are you sketching Big Ben in your notebook?',
      fr: 'Es-tu en train de dessiner Big Ben dans ton carnet ?',
      tip: 'On inverse BE et le sujet : Are + you + sketching... ?',
    },
    {
      type: '(=) Réponse courte',
      en: 'Yes, I am. / No, he isn’t.',
      fr: 'Oui. / Non.',
      tip: 'On répond avec le verbe BE (jamais avec do/does pour le continu).',
    },
  ],
  goldenRule:
    'Duel clé : Present Simple = HABITUDE permanente (« I drink tea every day ») VS Present Continuous = ACTION IMMÉDIATE (« Look! I am drinking tea right now »). Attention : les verbes de goût (like, love, hate, know, want) ne prennent JAMAIS la forme -ing au collège !',
  markers: ['now', 'right now', 'at the moment', 'today', 'Look!', 'Listen!'],
};

export const PAST_SIMPLE_DATA: TenseRuleItem = {
  id: 'past-simple',
  title: 'Le Past Simple / Prétérit (Le passé daté & terminé)',
  badge: 'Passé terminé · Récit · Hier',
  ruleFr:
    'Sert à raconter un événement fini, daté et coupé du présent (hier, l’été dernier, il y a 2 ans).',
  formula: 'Base Verbale + -ED (réguliers) OU Forme irrégulière par cœur',
  spellingRules: [
    {
      rule: 'Verbes réguliers classiques : on ajoute -ed',
      example: 'visit → visited · watch → watched · clean → cleaned · play → played',
    },
    {
      rule: 'Verbes terminés par -e : on ajoute simplement -d',
      example: 'live → lived · love → loved · arrive → arrived · dance → danced',
    },
    {
      rule: 'Consonne + Y : le y devient -ied',
      example: 'study → studied · tidy → tidied · cry → cried (MAIS play → played)',
    },
    {
      rule: 'Règle 1-1-1 CVC : on double la consonne finale',
      example: 'stop → stopped · plan → planned · clap → clapped',
    },
    {
      rule: 'Prononciation de -ED (3 sons)',
      example: '/t/ (watched, stopped) · /d/ (played, lived) · /ɪd/ après T et D (wanted, visited)',
    },
  ],
  examples: [
    {
      type: '(+) Affirmatif',
      en: 'Yesterday, we visited the British Museum and ate scones.',
      fr: 'Hier, nous avons visité le British Museum et mangé des scones.',
      tip: 'Visited = régulier en -ed. Ate = prétérit irrégulier de eat !',
    },
    {
      type: '(−) Négatif',
      en: "She didn't visit London last summer.",
      fr: 'Elle n’a pas visité Londres l’été dernier.',
      tip: 'Règle d’or : avec « didn’t », le verbe redevient à la base verbale (visit, pas visited) !',
    },
    {
      type: '(?) Question',
      en: 'Did you see the Queen’s guards in London?',
      fr: 'As-tu vu les gardes royaux à Londres ?',
      tip: 'Did + Sujet + Base Verbale. On utilise « see », pas « saw » !',
    },
    {
      type: '(=) Réponse courte',
      en: 'Yes, I did. / No, we didn’t.',
      fr: 'Oui. / Non.',
      tip: 'On répond toujours avec l’auxiliaire « did » ou « didn’t ».',
    },
  ],
  goldenRule:
    'La règle d’or de DID : Dès que l’auxiliaire DID ou DIDN’T est dans la phrase (négation ou question), c’est lui qui porte déjà tout le passé ! Le verbe qui suit reste TOUJOURS à sa base verbale neutre sans -ed ni changement irrégulier.',
  markers: [
    'yesterday',
    'last night',
    'last week',
    'last summer',
    'two days ago',
    'in 2024',
    'when I was six',
  ],
};

export const EXPRESSIONS_DATA: ExpressionCategory[] = [
  {
    id: 'exp-duration',
    title: 'L’expression de la durée : FOR vs SINCE vs AGO',
    subtitle: 'Comment mesurer le temps écoulé en anglais',
    badge: 'Durée & Dates',
    explanationFr:
      'Pour parler du temps écoulé, l’anglais distingue clairement la durée calculée (for), le point de départ précis (since) et l’écoulement dans le passé (ago).',
    formula: 'FOR + durée · SINCE + point de départ · durée + AGO',
    items: [
      {
        keyword: 'FOR (+ durée calculée)',
        meaningFr: 'Pendant / depuis (une quantité de temps)',
        ruleFr: 'S’utilise avec une durée dénombrable (heures, jours, années).',
        exampleEn: 'We practiced English for forty minutes.',
        exampleFr: 'Nous nous sommes entraînés en anglais pendant quarante minutes.',
      },
      {
        keyword: 'SINCE (+ point de départ précis)',
        meaningFr: 'Depuis (une date ou un moment précis)',
        ruleFr: 'S’utilise avec un repère temporel fixe (heure, jour, mois, année).',
        exampleEn: 'I have been a student in this school since September.',
        exampleFr: 'Je suis élève dans ce collège depuis septembre.',
      },
      {
        keyword: 'AGO (placé APRÈS la durée)',
        meaningFr: 'Il y a (temps écoulé dans le passé)',
        ruleFr: 'Se place TOUJOURS à la fin de la durée et s’emploie au Past Simple.',
        exampleEn: 'We arrived in London three days ago.',
        exampleFr: 'Nous sommes arrivés à Londres il y a trois jours.',
      },
    ],
    goldenTip:
      'Astuce mnémotechnique : FOR = durée mesurée (for 2 days, for 5 years). SINCE = date précise de début (since Monday, since 2022). AGO = "il y a" en fin de groupe (ten minutes ago).',
  },
  {
    id: 'exp-frequency',
    title: 'L’expression de la fréquence & des habitudes',
    subtitle: 'Always, usually, often, sometimes, never...',
    badge: 'Fréquence & Routine',
    explanationFr:
      'Les adverbes de fréquence indiquent à quel rythme une action se répète. Ils se placent selon une règle très précise dans la phrase.',
    formula: 'Sujet + Adverbe + Verbe ORDINAIRE · Sujet + BE + Adverbe',
    items: [
      {
        keyword: 'Always (100%)',
        meaningFr: 'Toujours',
        ruleFr: 'Avant le verbe d’action : I always eat fruit.',
        exampleEn: 'She always does her homework before dinner.',
        exampleFr: 'Elle fait toujours ses devoirs avant le dîner.',
      },
      {
        keyword: 'Usually / Normally (80%)',
        meaningFr: 'D’habitude / habituellement',
        ruleFr: 'Indique la routine normale de la semaine.',
        exampleEn: 'We usually walk to school together.',
        exampleFr: 'D’habitude, nous marchons jusqu’au collège ensemble.',
      },
      {
        keyword: 'Often (60%)',
        meaningFr: 'Souvent',
        ruleFr: 'Très fréquent au présent simple.',
        exampleEn: 'He often listens to music in his bedroom.',
        exampleFr: 'Il écoute souvent de la musique dans sa chambre.',
      },
      {
        keyword: 'Sometimes (40%)',
        meaningFr: 'Parfois / de temps en temps',
        ruleFr: 'Peut aussi se placer en tout début de phrase.',
        exampleEn: 'Sometimes, I read an English manga on the bus.',
        exampleFr: 'Parfois, je lis un manga anglais dans le bus.',
      },
      {
        keyword: 'Rarely / Hardly ever (10%)',
        meaningFr: 'Rarement / presque jamais',
        ruleFr: 'Exprime une fréquence très faible.',
        exampleEn: 'They rarely watch horror films.',
        exampleFr: 'Ils regardent rarement des films d’horreur.',
      },
      {
        keyword: 'Never (0%)',
        meaningFr: 'Jamais',
        ruleFr: 'La phrase est déjà négative, ne pas rajouter « don’t » !',
        exampleEn: 'My teacher is never late for our lesson.',
        exampleFr: 'Mon professeur n’est jamais en retard pour notre cours.',
      },
    ],
    goldenTip:
      'Règle d’emplacement d’or : L’adverbe de fréquence se place AVANT les verbes ordinaires (« I often play »), mais APRÈS le verbe BE (« He is always happy ») !',
  },
  {
    id: 'exp-future',
    title: 'L’expression du futur : BE GOING TO vs WILL',
    subtitle: 'Projets prévus contre décisions spontanées',
    badge: 'Futur & Projets',
    explanationFr:
      'L’anglais dispose de deux façons majeures d’exprimer l’avenir : les projets déjà planifiés et les décisions immédiates.',
    formula: 'BE GOING TO + BV (projet) · WILL + BV (spontané / promesse)',
    items: [
      {
        keyword: 'BE GOING TO + Base Verbale',
        meaningFr: 'Avoir l’intention de / aller faire (projet planifié)',
        ruleFr: 'Utilisé pour une intention déjà décidée ou un fait visible.',
        exampleEn: 'I am going to visit the London Eye tomorrow.',
        exampleFr: 'Je vais visiter le London Eye demain (c’est prévu).',
      },
      {
        keyword: 'WILL + Base Verbale',
        meaningFr: 'Décision sur le moment / promesse / prédiction générale',
        ruleFr: 'Utilisé pour proposer son aide ou réagir sur le coup.',
        exampleEn: 'The phone is ringing. I will answer it!',
        exampleFr: 'Le téléphone sonne. Je vais répondre !',
      },
      {
        keyword: 'Négation WON’T (= will not)',
        meaningFr: 'Ne... pas (au futur)',
        ruleFr: 'Forme contractée indispensable à l’oral.',
        exampleEn: 'Don’t worry, I won’t forget my notebook.',
        exampleFr: 'Ne t’inquiète pas, je n’oublierai pas mon carnet.',
      },
    ],
    goldenTip:
      'Différence clé : « I am going to buy a ticket » = projet réfléchi à l’avance. « I will buy you a ticket! » = décision spontanée ou offre gentille faite à l’instant.',
  },
  {
    id: 'exp-preferences',
    title: 'L’expression des goûts & désirs (Like, Love, Hate + V-ing)',
    subtitle: 'Comment parler de ses passions et préférences',
    badge: 'Goûts & Passions',
    explanationFr:
      'Après les verbes exprimant un sentiment durable (aimer, adorer, détester, préférer), le verbe d’activité qui suit prend la terminaison -ING.',
    formula: 'like / love / prefer / enjoy / hate + Verbe-ING',
    items: [
      {
        keyword: 'Love / Like + V-ing',
        meaningFr: 'Adorer / aimer faire quelque chose',
        ruleFr: 'L’activité générale prend -ing.',
        exampleEn: 'She loves playing video games after school.',
        exampleFr: 'Elle adore jouer aux jeux vidéo après les cours.',
      },
      {
        keyword: 'Hate / Can’t stand + V-ing',
        meaningFr: 'Détester / ne pas supporter de faire',
        ruleFr: 'S’utilise pour exprimer un dégoût ou un refus.',
        exampleEn: 'He hates waking up early on Sundays.',
        exampleFr: 'Il déteste se réveiller tôt le dimanche.',
      },
      {
        keyword: 'Would like to + Base Verbale',
        meaningFr: 'Aimerait / voudrait (souhait poli ponctuel)',
        ruleFr: 'Attention : avec « would like », on met TO + Base verbale !',
        exampleEn: 'I would like to order a warm scone, please.',
        exampleFr: 'Je voudrais commander un scone chaud, s’il vous plaît.',
      },
    ],
    goldenTip:
      'Piège fréquent : « I like drawing » (activité habituelle en -ing) VS « I would like to draw » (envie polie maintenant, avec TO + base verbale).',
  },
];

export const CONJUGATOR_VERBS: ConjugatorVerb[] = [
  {
    id: 'play',
    base: 'play',
    fr: 'jouer',
    presentThird: 'plays',
    presentCont: 'playing',
    pastSimple: 'played',
    isIrregularPast: false,
    notes: 'Voyelle + Y : simple -s au présent et -ed au passé.',
  },
  {
    id: 'watch',
    base: 'watch',
    fr: 'regarder',
    presentThird: 'watches',
    presentCont: 'watching',
    pastSimple: 'watched',
    isIrregularPast: false,
    notes: 'Termine par -ch : prend -es au présent simple (watches).',
  },
  {
    id: 'study',
    base: 'study',
    fr: 'étudier',
    presentThird: 'studies',
    presentCont: 'studying',
    pastSimple: 'studied',
    isIrregularPast: false,
    notes: 'Consonne + Y : change en -ies au présent et -ied au passé.',
  },
  {
    id: 'swim',
    base: 'swim',
    fr: 'nager',
    presentThird: 'swims',
    presentCont: 'swimming',
    pastSimple: 'swam',
    isIrregularPast: true,
    notes: 'Règle CVC : double le -m- en V-ing (swimming). Prétérit irrégulier : swam.',
  },
  {
    id: 'go',
    base: 'go',
    fr: 'aller',
    presentThird: 'goes',
    presentCont: 'going',
    pastSimple: 'went',
    isIrregularPast: true,
    notes: 'Finit par -o (+es : goes). Prétérit très irrégulier : went.',
  },
  {
    id: 'eat',
    base: 'eat',
    fr: 'manger',
    presentThird: 'eats',
    presentCont: 'eating',
    pastSimple: 'ate',
    isIrregularPast: true,
    notes: 'Prétérit irrégulier : ate. Pas de double consonne en -ing (2 voyelles ea).',
  },
  {
    id: 'live',
    base: 'live',
    fr: 'vivre / habiter',
    presentThird: 'lives',
    presentCont: 'living',
    pastSimple: 'lived',
    isIrregularPast: false,
    notes: '-e muet : perd son e devant -ing (living), ajoute juste -d au passé.',
  },
  {
    id: 'write',
    base: 'write',
    fr: 'écrire',
    presentThird: 'writes',
    presentCont: 'writing',
    pastSimple: 'wrote',
    isIrregularPast: true,
    notes: '-e muet qui tombe en V-ing (writing). Prétérit irrégulier : wrote.',
  },
  {
    id: 'listen',
    base: 'listen',
    fr: 'écouter',
    presentThird: 'listens',
    presentCont: 'listening',
    pastSimple: 'listened',
    isIrregularPast: false,
    notes: 'Le T est muet ! Toujours suivi de « to » devant un objet (listen to music).',
  },
  {
    id: 'stop',
    base: 'stop',
    fr: 's’arrêter',
    presentThird: 'stops',
    presentCont: 'stopping',
    pastSimple: 'stopped',
    isIrregularPast: false,
    notes: 'Règle 1-1-1 CVC : double le -p- au passé (stopped) et en V-ing (stopping).',
  },
];

export const TENSES_QUIZ_QUESTIONS: TenseQuizQuestion[] = [
  {
    id: 'tq-1',
    tenseCategory: 'present-simple',
    badge: 'Present Simple · 3e personne',
    promptFr: 'Accorde correctement le verbe au présent simple avec « My sister » :',
    sentenceWithBlank: 'My sister ___ English stories every evening.',
    options: ['read', 'reads', 'is reading', 'reading'],
    correctIndex: 1,
    explanationFr: 'Avec « My sister » (= she) et l’habitude « every evening », le verbe prend -s.',
    completedEn: 'My sister reads English stories every evening.',
  },
  {
    id: 'tq-2',
    tenseCategory: 'present-simple',
    badge: 'Present Simple · Négation',
    promptFr: 'Choisis la bonne forme négative avec « he » au présent simple :',
    sentenceWithBlank: 'He ___ like drinking black coffee.',
    options: ["doesn't", "don't", "isn't", "not"],
    correctIndex: 0,
    explanationFr: 'Au présent simple avec he/she/it, l’auxiliaire négatif est « doesn’t ».',
    completedEn: "He doesn't like drinking black coffee.",
  },
  {
    id: 'tq-3',
    tenseCategory: 'present-continuous',
    badge: 'Present Continuous · En ce moment',
    promptFr: 'Complète avec le présent continu pour décrire ce qui se passe maintenant :',
    sentenceWithBlank: 'Look! The sea turtle ___ across the ocean.',
    options: ['swims', 'is swimming', 'are swimming', 'swam'],
    correctIndex: 1,
    explanationFr: '« Look! » indique une action en cours : singulier is + double consonne swimming.',
    completedEn: 'Look! The sea turtle is swimming across the ocean.',
  },
  {
    id: 'tq-4',
    tenseCategory: 'present-continuous',
    badge: 'Present Continuous · Orthographe -ING',
    promptFr: 'Repère l’orthographe correcte du verbe « write » au présent continu :',
    sentenceWithBlank: 'I am ___ a postcard from London.',
    options: ['writeing', 'writing', 'writting', 'writes'],
    correctIndex: 1,
    explanationFr: 'Le -e muet disparaît devant la terminaison -ing : write → writing.',
    completedEn: 'I am writing a postcard from London.',
  },
  {
    id: 'tq-5',
    tenseCategory: 'past-simple',
    badge: 'Past Simple · Règle de DIDN’T',
    promptFr: 'Attention au piège de l’auxiliaire au prétérit négatif :',
    sentenceWithBlank: 'We ___ to the cinema yesterday.',
    options: ["didn't go", "didn't went", "not went", "didn't goes"],
    correctIndex: 0,
    explanationFr: 'Avec « didn’t », le verbe qui suit RESTE à la base verbale neutre : didn’t go !',
    completedEn: "We didn't go to the cinema yesterday.",
  },
  {
    id: 'tq-6',
    tenseCategory: 'past-simple',
    badge: 'Past Simple · Verbe irrégulier',
    promptFr: 'Trouve le prétérit du verbe « see » :',
    sentenceWithBlank: 'Last Tuesday, they ___ Big Ben in London.',
    options: ['seed', 'saw', 'seen', 'sees'],
    correctIndex: 1,
    explanationFr: '« See » est un verbe irrégulier : see → saw (prétérit).',
    completedEn: 'Last Tuesday, they saw Big Ben in London.',
  },
  {
    id: 'tq-7',
    tenseCategory: 'expressions',
    badge: 'Expression de la Durée · FOR vs SINCE',
    promptFr: 'Complète devant une durée mesurée (« three hours ») :',
    sentenceWithBlank: 'We walked in Hyde Park ___ three hours.',
    options: ['since', 'for', 'ago', 'at'],
    correctIndex: 1,
    explanationFr: 'Devant une durée calculée (three hours), on utilise TOUJOURS « for ».',
    completedEn: 'We walked in Hyde Park for three hours.',
  },
  {
    id: 'tq-8',
    tenseCategory: 'expressions',
    badge: 'Expression du Temps · AGO',
    promptFr: 'Complète pour dire « Il y a deux jours » :',
    sentenceWithBlank: 'My pen pal arrived two days ___.',
    options: ['ago', 'since', 'for', 'before'],
    correctIndex: 0,
    explanationFr: '« Ago » se place toujours après la durée pour exprimer « il y a » dans le passé.',
    completedEn: 'My pen pal arrived two days ago.',
  },
  {
    id: 'tq-9',
    tenseCategory: 'expressions',
    badge: 'Fréquence · Position de l’adverbe',
    promptFr: 'Où se place l’adverbe de fréquence « always » avec un verbe ordinaire ?',
    sentenceWithBlank: 'She ___ English vocabulary before sleeping.',
    options: [
      'always revises',
      'revises always',
      'always is revising',
      'is always revise',
    ],
    correctIndex: 0,
    explanationFr: 'L’adverbe de fréquence se place AVANT le verbe ordinaire : always revises.',
    completedEn: 'She always revises English vocabulary before sleeping.',
  },
  {
    id: 'tq-10',
    tenseCategory: 'expressions',
    badge: 'Goûts & Préférences · Verbe en -ING',
    promptFr: 'Complète après le verbe de goût « love » :',
    sentenceWithBlank: 'My friends love ___ to Bruno Mars songs.',
    options: ['listen', 'listening', 'listened', 'to listening'],
    correctIndex: 1,
    explanationFr: 'Après like, love, enjoy ou hate, le verbe d’activité prend -ing : love listening.',
    completedEn: 'My friends love listening to Bruno Mars songs.',
  },
  {
    id: 'tq-11',
    tenseCategory: 'expressions',
    badge: 'Futur · BE GOING TO',
    promptFr: 'Exprime un projet déjà planifié pour le week-end prochain :',
    sentenceWithBlank: 'Next weekend, I ___ visit my cousins in London.',
    options: ['am going to', 'will to', 'go to', 'going'],
    correctIndex: 0,
    explanationFr: 'Pour un projet préparé à l’avance, on utilise « am going to + base verbale ».',
    completedEn: 'Next weekend, I am going to visit my cousins in London.',
  },
  {
    id: 'tq-12',
    tenseCategory: 'past-simple',
    badge: 'Past Simple · Question avec DID',
    promptFr: 'Forme la question correcte au prétérit :',
    sentenceWithBlank: '___ you watch the video lesson yesterday?',
    options: ['Did', 'Do', 'Were', 'Have'],
    correctIndex: 0,
    explanationFr: 'Pour poser une question au passé simple avec un verbe ordinaire, on commence par « Did ».',
    completedEn: 'Did you watch the video lesson yesterday?',
  },
];
