export interface WordSearchEntry {
  word: string;
  fr: string;
  hintEn: string;
}

export interface WordSearchTheme {
  id: string;
  titleFr: string;
  words: WordSearchEntry[];
}

export const WORD_SEARCH_THEMES: WordSearchTheme[] = [
  {
    id: 'hobbies',
    titleFr: 'Collège & Loisirs',
    words: [
      { word: 'SKETCH', fr: 'croquis / dessiner', hintEn: 'I like to sketch in my notebook.' },
      { word: 'MUSIC', fr: 'musique', hintEn: 'She listens to pop music.' },
      { word: 'GUITAR', fr: 'guitare', hintEn: 'He can play the guitar.' },
      { word: 'SCHOOL', fr: 'école / collège', hintEn: 'I go to school at eight.' },
      { word: 'FRIEND', fr: 'ami(e)', hintEn: 'My best friend lives nearby.' },
      { word: 'PENCIL', fr: 'crayon', hintEn: 'Take a pencil to draw.' },
    ],
  },
  {
    id: 'nature',
    titleFr: 'Animaux & Nature',
    words: [
      { word: 'FOREST', fr: 'forêt', hintEn: 'Owls live in the quiet forest.' },
      { word: 'TURTLE', fr: 'tortue', hintEn: 'A sea turtle can swim fast.' },
      { word: 'OCEAN', fr: 'océan', hintEn: 'Blue whales live in the ocean.' },
      { word: 'CLEVER', fr: 'malin / intelligent', hintEn: 'The red fox is very clever.' },
      { word: 'RIVER', fr: 'rivière', hintEn: 'Look at the bridge over the river.' },
      { word: 'TIGER', fr: 'tigre', hintEn: 'A tiger runs through the jungle.' },
    ],
  },
  {
    id: 'food',
    titleFr: 'Goûter & Café',
    words: [
      { word: 'SCONE', fr: 'petit pain anglais', hintEn: 'A warm scone with strawberry jam.' },
      { word: 'MUFFIN', fr: 'muffin', hintEn: 'I would like a berry muffin.' },
      { word: 'BERRY', fr: 'baie / fruit rouge', hintEn: 'Blueberry is a sweet berry.' },
      { word: 'SWEET', fr: 'sucré / doux', hintEn: 'This hot chocolate is sweet.' },
      { word: 'APPLE', fr: 'pomme', hintEn: 'An apple for my afternoon snack.' },
      { word: 'JUICE', fr: 'jus de fruit', hintEn: 'Orange juice, please!' },
    ],
  },
  {
    id: 'london',
    titleFr: 'Londres & Voyage',
    words: [
      { word: 'BRIDGE', fr: 'pont', hintEn: 'Westminster Bridge is near Big Ben.' },
      { word: 'TICKET', fr: 'billet', hintEn: 'Buy a train ticket at the station.' },
      { word: 'LONDON', fr: 'Londres', hintEn: 'London is the capital of the UK.' },
      { word: 'TRAIN', fr: 'train', hintEn: 'We went to London by train.' },
      { word: 'STREET', fr: 'rue', hintEn: 'The bookshop is across the street.' },
      { word: 'CLOCK', fr: 'horloge', hintEn: 'Big Ben has a huge clock.' },
    ],
  },
  {
    id: 'time',
    titleFr: 'L’heure & La journée',
    words: [
      { word: 'OCLOCK', fr: 'heure pile', hintEn: 'It is three o’clock.' },
      { word: 'QUARTER', fr: 'quart d’heure', hintEn: 'A quarter past two.' },
      { word: 'MIDDAY', fr: 'midi', hintEn: 'We eat lunch at midday.' },
      { word: 'MINUTE', fr: 'minute', hintEn: 'Wait just one minute!' },
      { word: 'MORNING', fr: 'matin', hintEn: 'Good morning, everyone!' },
      { word: 'NIGHT', fr: 'nuit', hintEn: 'Look at the stars at night.' },
    ],
  },
];

export interface SentenceExpressRound {
  id: string;
  grammarTag: string;
  promptFr: string;
  targetEn: string;
  distractor?: string;
  tipFr: string;
}

export const SENTENCE_EXPRESS_ROUNDS: SentenceExpressRound[] = [
  {
    id: 'se-1',
    grammarTag: 'Présent simple · 3e personne',
    promptFr: 'Elle joue de la guitare tous les vendredis.',
    targetEn: 'She plays guitar every Friday',
    distractor: 'play',
    tipFr: 'Avec « She » au présent simple, le verbe prend -s : plays.',
  },
  {
    id: 'se-2',
    grammarTag: 'Question avec Do',
    promptFr: 'Est-ce que tu aimes lire des mangas ?',
    targetEn: 'Do you like reading manga',
    distractor: 'Does',
    tipFr: 'Avec « you », on commence la question par « Do » (jamais Does).',
  },
  {
    id: 'se-3',
    grammarTag: 'Modal Can (capacité)',
    promptFr: 'Mon chat peut sauter très haut.',
    targetEn: 'My cat can jump very high',
    distractor: 'to',
    tipFr: 'Après « can », il n’y a jamais « to » devant le verbe !',
  },
  {
    id: 'se-4',
    grammarTag: 'Modal Must (devoir)',
    promptFr: 'Nous devons protéger les tortues marines.',
    targetEn: 'We must protect sea turtles',
    distractor: 'musts',
    tipFr: 'Les modaux comme « must » sont invariables (jamais de -s).',
  },
  {
    id: 'se-5',
    grammarTag: 'Préposition de temps · AT',
    promptFr: 'Mon cours d’anglais commence à cinq heures.',
    targetEn: 'My English lesson starts at five',
    distractor: 'on',
    tipFr: 'Devant une heure précise, on utilise toujours « AT ».',
  },
  {
    id: 'se-6',
    grammarTag: 'Préposition de lieu · UNDER',
    promptFr: 'Le livre rouge est sous le bureau.',
    targetEn: 'The red book is under the desk',
    distractor: 'between',
    tipFr: 'En anglais, l’adjectif « red » se place AVANT le nom « book ».',
  },
  {
    id: 'se-7',
    grammarTag: 'Prétérit irrégulier · GO',
    promptFr: 'Hier, nous sommes allés au cinéma.',
    targetEn: 'Yesterday we went to the cinema',
    distractor: 'goed',
    tipFr: '« Go » est irrégulier au passé : « went » !',
  },
  {
    id: 'se-8',
    grammarTag: 'Présent en BE + V-ing',
    promptFr: 'J’écoute Bruno Mars en ce moment.',
    targetEn: 'I am listening to Bruno Mars now',
    distractor: 'listen',
    tipFr: 'Action en cours maintenant = am / is / are + verbe-ing.',
  },
  {
    id: 'se-9',
    grammarTag: 'Demande polie · Could',
    promptFr: 'Pourrais-tu parler plus lentement s’il te plaît ?',
    targetEn: 'Could you speak more slowly please',
    distractor: 'caned',
    tipFr: '« Could you... please? » est la formule super polie pour demander.',
  },
  {
    id: 'se-10',
    grammarTag: 'Futur · Going to',
    promptFr: 'Nous allons visiter Londres l’été prochain.',
    targetEn: 'We are going to visit London next summer',
    distractor: 'is',
    tipFr: 'Avec « We », l’auxiliaire être est « are » : We are going to...',
  },
  {
    id: 'se-11',
    grammarTag: 'Préposition de temps · ON',
    promptFr: 'J’ai cours de dessin lundi matin.',
    targetEn: 'I have art class on Monday morning',
    distractor: 'in',
    tipFr: 'Avec un jour de la semaine (« Monday »), c’est toujours « ON » !',
  },
  {
    id: 'se-12',
    grammarTag: 'L’heure · Half past',
    promptFr: 'Il est exactement huit heures et demie.',
    targetEn: 'It is half past eight',
    distractor: 'to',
    tipFr: 'Pour la demi-heure (:30), on dit toujours « half past ».',
  },
];

export interface GrammarBlitzQuestion {
  id: string;
  category: 'irregular' | 'modals' | 'prepositions' | 'tenses';
  categoryLabelFr: string;
  promptFr: string;
  sentenceWithBlank: string;
  options: string[];
  correctIndex: number;
  explanationFr: string;
  completedEn: string;
}

export const GRAMMAR_BLITZ_QUESTIONS: GrammarBlitzQuestion[] = [
  {
    id: 'gb-1',
    category: 'prepositions',
    categoryLabelFr: 'Prépositions AT / ON / IN',
    promptFr: 'Complète avec la bonne préposition devant une heure :',
    sentenceWithBlank: 'My bus arrives ___ half past four.',
    options: ['at', 'on', 'in'],
    correctIndex: 0,
    explanationFr: 'On utilise « at » devant toutes les heures précises.',
    completedEn: 'My bus arrives at half past four.',
  },
  {
    id: 'gb-2',
    category: 'prepositions',
    categoryLabelFr: 'Prépositions AT / ON / IN',
    promptFr: 'Complète devant un jour de la semaine :',
    sentenceWithBlank: 'We have English ___ Wednesday afternoon.',
    options: ['at', 'on', 'in'],
    correctIndex: 1,
    explanationFr: 'Dès qu’il y a un jour (Monday, Wednesday…), c’est « on ».',
    completedEn: 'We have English on Wednesday afternoon.',
  },
  {
    id: 'gb-3',
    category: 'prepositions',
    categoryLabelFr: 'Prépositions AT / ON / IN',
    promptFr: 'Complète devant un mois ou une saison :',
    sentenceWithBlank: 'My birthday is ___ July!',
    options: ['at', 'on', 'in'],
    correctIndex: 2,
    explanationFr: 'Pour les mois, saisons et années, on utilise « in ».',
    completedEn: 'My birthday is in July!',
  },
  {
    id: 'gb-4',
    category: 'irregular',
    categoryLabelFr: 'Verbes irréguliers',
    promptFr: 'Trouve le prétérit (passé) de « go » :',
    sentenceWithBlank: 'Last weekend, I ___ to the bookshop.',
    options: ['goed', 'went', 'gone'],
    correctIndex: 1,
    explanationFr: 'Go → went (prétérit) → gone (participe passé).',
    completedEn: 'Last weekend, I went to the bookshop.',
  },
  {
    id: 'gb-5',
    category: 'irregular',
    categoryLabelFr: 'Verbes irréguliers',
    promptFr: 'Trouve le prétérit (passé) de « see » :',
    sentenceWithBlank: 'We ___ a clever red fox in the garden!',
    options: ['saw', 'seed', 'seen'],
    correctIndex: 0,
    explanationFr: 'See → saw (prétérit) → seen (participe passé).',
    completedEn: 'We saw a clever red fox in the garden!',
  },
  {
    id: 'gb-6',
    category: 'irregular',
    categoryLabelFr: 'Verbes irréguliers',
    promptFr: 'Trouve le prétérit (passé) de « eat » :',
    sentenceWithBlank: 'They ___ delicious scones with strawberry jam.',
    options: ['eated', 'ate', 'eaten'],
    correctIndex: 1,
    explanationFr: 'Eat → ate (prétérit) → eaten (participe passé).',
    completedEn: 'They ate delicious scones with strawberry jam.',
  },
  {
    id: 'gb-7',
    category: 'modals',
    categoryLabelFr: 'Modaux',
    promptFr: 'Exprime une interdiction claire au collège :',
    sentenceWithBlank: 'You ___ run in the school corridor.',
    options: ['mustn’t', 'don’t can', 'should to'],
    correctIndex: 0,
    explanationFr: '« Mustn’t » signifie qu’il est interdit de faire quelque chose.',
    completedEn: "You mustn't run in the school corridor.",
  },
  {
    id: 'gb-8',
    category: 'modals',
    categoryLabelFr: 'Modaux',
    promptFr: 'Donne un gentil conseil à un ami fatigué :',
    sentenceWithBlank: 'You look sleepy: you ___ go to bed early.',
    options: ['should', 'mustn’t', 'coulds'],
    correctIndex: 0,
    explanationFr: '« Should » = tu devrais (conseil bienveillant).',
    completedEn: 'You look sleepy: you should go to bed early.',
  },
  {
    id: 'gb-9',
    category: 'modals',
    categoryLabelFr: 'Modaux',
    promptFr: 'Demande poliment au café :',
    sentenceWithBlank: 'I ___ a hot chocolate, please.',
    options: ['would like', 'can to have', 'musts'],
    correctIndex: 0,
    explanationFr: '« I would like... » (Je voudrais…) est parfait pour commander.',
    completedEn: 'I would like a hot chocolate, please.',
  },
  {
    id: 'gb-10',
    category: 'tenses',
    categoryLabelFr: 'Temps simples',
    promptFr: 'Accorde correctement au présent simple (he/she/it) :',
    sentenceWithBlank: 'My sister ___ in her sketchbook every day.',
    options: ['draw', 'draws', 'drawing'],
    correctIndex: 1,
    explanationFr: 'Avec « my sister » (= she) au présent d’habitude, on ajoute -s.',
    completedEn: 'My sister draws in her sketchbook every day.',
  },
  {
    id: 'gb-11',
    category: 'tenses',
    categoryLabelFr: 'Temps simples',
    promptFr: 'Choisis la bonne forme négative au prétérit :',
    sentenceWithBlank: 'Yesterday, it ___ rain in London.',
    options: ["didn't", "wasn't", "don't"],
    correctIndex: 0,
    explanationFr: 'Au passé simple négatif avec un verbe ordinaire, on utilise « didn’t + base verbale ».',
    completedEn: "Yesterday, it didn't rain in London.",
  },
  {
    id: 'gb-12',
    category: 'tenses',
    categoryLabelFr: 'Temps simples',
    promptFr: 'Décris une action qui se passe en ce moment même :',
    sentenceWithBlank: 'Look! The sea turtle ___ across the blue bay.',
    options: ['swims', 'is swimming', 'swam'],
    correctIndex: 1,
    explanationFr: 'Avec « Look! » (maintenant), on utilise BE + V-ing : is swimming.',
    completedEn: 'Look! The sea turtle is swimming across the blue bay.',
  },
];
