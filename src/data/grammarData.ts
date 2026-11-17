export interface IrregularVerbItem {
  id: string;
  base: string;
  past: string;
  participle: string;
  fr: string;
  exampleEn: string;
  group: 'Identiques' | 'Changement voyelle' | 'Fin en -ought/-aught' | 'Très fréquents';
}

export interface ModalGuideItem {
  id: string;
  modal: string;
  negative: string;
  meaningFr: string;
  usageFr: string;
  exampleEn: string;
  exampleFr: string;
}

export interface TenseGuideItem {
  id: string;
  titleEn: string;
  titleFr: string;
  whenFr: string;
  formula: string;
  affirmative: string;
  negative: string;
  question: string;
  markers: string;
}

export interface TimePrepositionItem {
  id: string;
  prep: 'AT' | 'ON' | 'IN';
  scopeFr: string;
  examplesEn: string[];
  examplesFr: string[];
}

export interface PlacePrepositionItem {
  id: string;
  en: string;
  fr: string;
  exampleEn: string;
  visualType:
    | 'in'
    | 'on'
    | 'under'
    | 'next_to'
    | 'between'
    | 'behind'
    | 'in_front_of'
    | 'opposite';
}

export const IRREGULAR_VERBS: IrregularVerbItem[] = [
  {
    id: 'iv-be',
    base: 'be',
    past: 'was / were',
    participle: 'been',
    fr: 'être',
    exampleEn: 'Yesterday, I was very happy at school.',
    group: 'Très fréquents',
  },
  {
    id: 'iv-have',
    base: 'have',
    past: 'had',
    participle: 'had',
    fr: 'avoir',
    exampleEn: 'We had a great English lesson on Tuesday.',
    group: 'Très fréquents',
  },
  {
    id: 'iv-do',
    base: 'do',
    past: 'did',
    participle: 'done',
    fr: 'faire',
    exampleEn: 'She did her homework before dinner.',
    group: 'Très fréquents',
  },
  {
    id: 'iv-go',
    base: 'go',
    past: 'went',
    participle: 'gone',
    fr: 'aller',
    exampleEn: 'Last summer, we went to London by train.',
    group: 'Très fréquents',
  },
  {
    id: 'iv-see',
    base: 'see',
    past: 'saw',
    participle: 'seen',
    fr: 'voir',
    exampleEn: 'I saw a red fox in the garden this morning.',
    group: 'Très fréquents',
  },
  {
    id: 'iv-eat',
    base: 'eat',
    past: 'ate',
    participle: 'eaten',
    fr: 'manger',
    exampleEn: 'They ate warm scones with strawberry jam.',
    group: 'Très fréquents',
  },
  {
    id: 'iv-drink',
    base: 'drink',
    past: 'drank',
    participle: 'drunk',
    fr: 'boire',
    exampleEn: 'He drank a big mug of hot chocolate.',
    group: 'Changement voyelle',
  },
  {
    id: 'iv-sing',
    base: 'sing',
    past: 'sang',
    participle: 'sung',
    fr: 'chanter',
    exampleEn: 'Bruno Mars sang his famous song on stage.',
    group: 'Changement voyelle',
  },
  {
    id: 'iv-swim',
    base: 'swim',
    past: 'swam',
    participle: 'swum',
    fr: 'nager',
    exampleEn: 'The sea turtle swam across the blue bay.',
    group: 'Changement voyelle',
  },
  {
    id: 'iv-write',
    base: 'write',
    past: 'wrote',
    participle: 'written',
    fr: 'écrire',
    exampleEn: 'I wrote a postcard to my pen pal.',
    group: 'Changement voyelle',
  },
  {
    id: 'iv-speak',
    base: 'speak',
    past: 'spoke',
    participle: 'spoken',
    fr: 'parler',
    exampleEn: 'We spoke English for twenty minutes!',
    group: 'Changement voyelle',
  },
  {
    id: 'iv-take',
    base: 'take',
    past: 'took',
    participle: 'taken',
    fr: 'prendre',
    exampleEn: 'She took lots of photos near Big Ben.',
    group: 'Changement voyelle',
  },
  {
    id: 'iv-give',
    base: 'give',
    past: 'gave',
    participle: 'given',
    fr: 'donner',
    exampleEn: 'My teacher gave me an extra star.',
    group: 'Changement voyelle',
  },
  {
    id: 'iv-buy',
    base: 'buy',
    past: 'bought',
    participle: 'bought',
    fr: 'acheter',
    exampleEn: 'We bought a new sketchbook at the corner shop.',
    group: 'Fin en -ought/-aught',
  },
  {
    id: 'iv-think',
    base: 'think',
    past: 'thought',
    participle: 'thought',
    fr: 'penser',
    exampleEn: 'I thought the quiz was super fun.',
    group: 'Fin en -ought/-aught',
  },
  {
    id: 'iv-catch',
    base: 'catch',
    past: 'caught',
    participle: 'caught',
    fr: 'attraper',
    exampleEn: 'He caught the red bus just in time.',
    group: 'Fin en -ought/-aught',
  },
  {
    id: 'iv-read',
    base: 'read',
    past: 'read (prononcé red)',
    participle: 'read (red)',
    fr: 'lire',
    exampleEn: 'I read two chapters of my book last night.',
    group: 'Identiques',
  },
  {
    id: 'iv-put',
    base: 'put',
    past: 'put',
    participle: 'put',
    fr: 'mettre / poser',
    exampleEn: 'She put her headphones on the desk.',
    group: 'Identiques',
  },
];

export const MODAL_GUIDES: ModalGuideItem[] = [
  {
    id: 'mod-can',
    modal: 'can',
    negative: "can't / cannot",
    meaningFr: 'Pouvoir / savoir faire / permission',
    usageFr: 'Pour dire ce qu’on sait faire ou demander quelque chose poliment.',
    exampleEn: 'Sea turtles can swim very fast, and I can play the guitar.',
    exampleFr: 'Les tortues marines savent nager très vite, et moi je sais jouer de la guitare.',
  },
  {
    id: 'mod-must',
    modal: 'must',
    negative: "mustn't / must not",
    meaningFr: 'Devoir (obligation forte) / Interdiction',
    usageFr: 'Must = il faut absolument. Mustn’t = il est interdit de.',
    exampleEn: 'We must protect nature. You mustn’t run in the corridor.',
    exampleFr: 'Nous devons protéger la nature. Tu ne dois pas courir dans le couloir.',
  },
  {
    id: 'mod-should',
    modal: 'should',
    negative: "shouldn't",
    meaningFr: 'Devrait (conseil)',
    usageFr: 'Pour donner un bon conseil à un ami, sans obligation stricte.',
    exampleEn: 'You are tired: you should go to bed early tonight.',
    exampleFr: 'Tu es fatigué(e) : tu devrais te coucher tôt ce soir.',
  },
  {
    id: 'mod-could',
    modal: 'could',
    negative: "couldn't",
    meaningFr: 'Pourrais-tu… (très poli) / savais (passé de can)',
    usageFr: 'Plus poli que "can" pour demander de l’aide, ou capacité au passé.',
    exampleEn: 'Excuse me, could you repeat that slowly, please?',
    exampleFr: 'Excusez-moi, pourriez-vous répéter cela lentement, s’il vous plaît ?',
  },
  {
    id: 'mod-would-like',
    modal: 'would like',
    negative: "wouldn't like",
    meaningFr: 'Voudrais / aimerais (poli)',
    usageFr: 'Indispensable au café, au restaurant ou pour exprimer une envie polie.',
    exampleEn: 'I would like a hot chocolate and a scone, please.',
    exampleFr: 'Je voudrais un chocolat chaud et un scone, s’il vous plaît.',
  },
  {
    id: 'mod-may',
    modal: 'may / might',
    negative: 'may not / might not',
    meaningFr: 'Peut-être (possibilité) / Puis-je… ?',
    usageFr: 'Pour dire qu’une chose est possible ou demander la permission en classe.',
    exampleEn: 'May I open the window? It might rain later.',
    exampleFr: 'Puis-je ouvrir la fenêtre ? Il se peut qu’il pleuve plus tard.',
  },
];

export const TENSE_GUIDES: TenseGuideItem[] = [
  {
    id: 'tense-present-simple',
    titleEn: 'Present Simple',
    titleFr: 'Présent d’habitude & vérités',
    whenFr: 'Pour parler de ses goûts, de sa routine quotidienne et des faits généraux.',
    formula: 'Base verbale (+ -s / -es avec he, she, it)',
    affirmative: 'She plays football every Saturday.',
    negative: "She doesn't play tennis. / I don't like coffee.",
    question: 'Do you listen to music? · Does he live in London?',
    markers: 'every day, always, usually, often, sometimes, never',
  },
  {
    id: 'tense-present-cont',
    titleEn: 'Present Continuous',
    titleFr: 'Présent en BE + V-ing (en train de)',
    whenFr: 'Pour décrire ce qui se passe exactement en ce moment ou sur une image.',
    formula: 'am / is / are + verbe-ing',
    affirmative: 'I am practising English with my teacher right now.',
    negative: "He isn't watching TV at the moment.",
    question: 'Are you drawing in your sketchbook?',
    markers: 'now, right now, at the moment, today, Look!',
  },
  {
    id: 'tense-past-simple',
    titleEn: 'Past Simple',
    titleFr: 'Prétérit (passé terminé)',
    whenFr: 'Pour raconter un événement fini dans le passé (hier, l’été dernier…).',
    formula: 'Verbe + -ed (régulier) OU forme irrégulière (went, saw…)',
    affirmative: 'We visited Big Ben and we ate scones yesterday.',
    negative: "We didn't visit the museum. (Attention : did + base verbale !)",
    question: 'Did you enjoy the Bruno Mars quiz?',
    markers: 'yesterday, last week, last year, two days ago, in 2024',
  },
  {
    id: 'tense-future',
    titleEn: 'Future (Will & Going to)',
    titleFr: 'Futur (Projets & Décisions)',
    whenFr: 'Going to = projet déjà prévu. Will = décision sur le moment ou prédiction.',
    formula: 'will + base verbale / am-is-are + going to + base verbale',
    affirmative: 'I am going to visit London next summer. I will help you!',
    negative: "It won't rain tomorrow. / She isn't going to stay home.",
    question: 'What are you going to do this weekend?',
    markers: 'tomorrow, next week, next summer, soon, later',
  },
];

export const TIME_PREPOSITIONS: TimePrepositionItem[] = [
  {
    id: 'tp-at',
    prep: 'AT',
    scopeFr: 'Heures précises & moments exacts',
    examplesEn: ['at 8 o’clock', 'at midday / at night', 'at the weekend'],
    examplesFr: ['à 8 heures', 'à midi / la nuit', 'le week-end (UK)'],
  },
  {
    id: 'tp-on',
    prep: 'ON',
    scopeFr: 'Jours de la semaine & dates précises',
    examplesEn: ['on Monday', 'on Saturday morning', 'on 14th November', 'on my birthday'],
    examplesFr: ['lundi', 'samedi matin', 'le 14 novembre', 'le jour de mon anniversaire'],
  },
  {
    id: 'tp-in',
    prep: 'IN',
    scopeFr: 'Mois, saisons, années & moments de la journée',
    examplesEn: ['in July', 'in summer / in winter', 'in 2026', 'in the morning / afternoon'],
    examplesFr: ['en juillet', 'en été / en hiver', 'en 2026', 'le matin / l’après-midi'],
  },
];

export const PLACE_PREPOSITIONS: PlacePrepositionItem[] = [
  {
    id: 'pp-in',
    en: 'in',
    fr: 'dans',
    exampleEn: 'The pen is in the pencil case.',
    visualType: 'in',
  },
  {
    id: 'pp-on',
    en: 'on',
    fr: 'sur',
    exampleEn: 'The sketchbook is on the desk.',
    visualType: 'on',
  },
  {
    id: 'pp-under',
    en: 'under',
    fr: 'sous',
    exampleEn: 'The cat is sleeping under the chair.',
    visualType: 'under',
  },
  {
    id: 'pp-next-to',
    en: 'next to',
    fr: 'à côté de',
    exampleEn: 'The bookshop is next to the café.',
    visualType: 'next_to',
  },
  {
    id: 'pp-between',
    en: 'between',
    fr: 'entre (deux)',
    exampleEn: 'The red bus is between the two cars.',
    visualType: 'between',
  },
  {
    id: 'pp-behind',
    en: 'behind',
    fr: 'derrière',
    exampleEn: 'Big Ben is behind the trees.',
    visualType: 'behind',
  },
  {
    id: 'pp-in-front-of',
    en: 'in front of',
    fr: 'devant',
    exampleEn: 'The bike is in front of the house.',
    visualType: 'in_front_of',
  },
  {
    id: 'pp-opposite',
    en: 'opposite / across from',
    fr: 'en face de',
    exampleEn: 'The bus stop is opposite the library.',
    visualType: 'opposite',
  },
];
