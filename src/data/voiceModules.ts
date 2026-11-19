import type { VoiceAccent } from '../types/lesson';

export interface VoiceModuleSample {
  id: string;
  en: string;
  ukTip: string;
  usTip: string;
}

export interface VoiceAccentModule {
  id: VoiceAccent;
  shortLabel: string;
  title: string;
  regionLabel: string;
  bcp47: 'en-GB' | 'en-US';
  /** Preferred voice name fragments in priority order (case-insensitive) */
  preferredVoicePatterns: string[];
  /** Language prefixes/tags accepted natively by this module */
  acceptedLangTags: string[];
  /** Voice name tokens that belong to other regions and should be avoided */
  excludedNameTokens: string[];
  sampleSentence: string;
  pronunciationNotes: string[];
}

export const VOICE_ACCENT_MODULES: Record<VoiceAccent, VoiceAccentModule> = {
  'en-GB': {
    id: 'en-GB',
    shortLabel: 'UK',
    title: 'Module Accent Anglais (UK)',
    regionLabel: 'British English · RP / London',
    bcp47: 'en-GB',
    preferredVoicePatterns: [
      'google uk english female',
      'google uk english male',
      'microsoft libby',
      'microsoft sonia',
      'microsoft ryan',
      'microsoft maisie',
      'microsoft hazel',
      'microsoft george',
      'microsoft susan',
      'daniel',
      'serena',
      'kate',
      'arthur',
      'martha',
      'oliver',
      'stephanie',
      'amy',
      'emma',
      'brian',
      'british',
      'united kingdom',
      'uk english',
    ],
    acceptedLangTags: ['en-gb', 'en-uk'],
    excludedNameTokens: ['united states', 'us english', 'american', 'en-us', 'en_us', 'india', 'australian', 'irish', 'canadian'],
    sampleSentence: "I can't drink a glass of water at half past four.",
    pronunciationNotes: [
      'Le « r » final est doux / non roulé (water → wah-tuh)',
      'Voyelle longue « ah » dans can’t, half, glass, ask',
      'Le « t » intervocalique reste net et articulé (water, better)',
    ],
  },
  'en-US': {
    id: 'en-US',
    shortLabel: 'US',
    title: 'Module Accent Américain (US)',
    regionLabel: 'American English · General American',
    bcp47: 'en-US',
    preferredVoicePatterns: [
      'google us english',
      'microsoft aria',
      'microsoft jenny',
      'microsoft guy',
      'microsoft michelle',
      'microsoft ana',
      'microsoft christopher',
      'microsoft eric',
      'microsoft steffan',
      'microsoft david',
      'microsoft zira',
      'microsoft mark',
      'samantha',
      'alex',
      'ava',
      'allison',
      'victoria',
      'nicky',
      'matthew',
      'joanna',
      'salli',
      'joey',
      'american',
      'united states',
      'us english',
    ],
    acceptedLangTags: ['en-us'],
    excludedNameTokens: ['united kingdom', 'uk english', 'british', 'en-gb', 'en_gb', 'india', 'australian', 'irish', 'canadian'],
    sampleSentence: "I can't drink a glass of water at half past four.",
    pronunciationNotes: [
      'Le « r » est prononcé clairement partout (water → wah-der, four)',
      'Voyelle « æ » ouverte dans can’t, half, glass, ask',
      'Le « t » entre deux voyelles devient doux comme un « d » (water, better)',
    ],
  },
};

export const VOICE_COMPARISON_SAMPLES: VoiceModuleSample[] = [
  {
    id: 'water',
    en: "Can I have a bottle of water, please?",
    ukTip: 'UK : « t » bien marqué dans water (wah-tuh)',
    usTip: 'US : « t » adouci en « d » + « r » final marqué (wah-derr)',
  },
  {
    id: 'schedule',
    en: "Let's check our schedule for tomorrow morning.",
    ukTip: 'UK : « shed-joul » · tomorrow sans « r » final',
    usTip: 'US : « sked-joul » · « r » bien prononcés',
  },
  {
    id: 'cant',
    en: "I can't dance in the park today.",
    ukTip: 'UK : can’t /ah/ long (kahnt) · park sans « r »',
    usTip: 'US : can’t /æ/ ouvert · park avec « r » sonore',
  },
];
