export type ModuleTab = 'warmup' | 'vocab' | 'builder' | 'roleplay' | 'board';

export type UserRole = 'tutor' | 'student';

export type VoiceAccent = 'en-GB' | 'en-US';

export type ControlMode = 'shared' | 'tutor-only';

export interface RemoteAudioEvent {
  text: string;
  accent: VoiceAccent;
  rate: number;
  by: string;
  fromRole: UserRole;
  at: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  level: 'A1' | 'A2';
  createdAt: number;
}

export interface WordbankItem {
  id: string;
  en: string;
  fr: string;
  note: string;
  addedAt: number;
}

export interface StrokePoint {
  x: number;
  y: number;
  p?: number;
}

export interface BoardStroke {
  id: string;
  color: string;
  width: number;
  points: StrokePoint[];
}

export interface WarmupState {
  mood: string | null;
  weather: string | null;
  promptIndex: number;
  studentAnswer: string;
}

export interface VocabState {
  deckId: string;
  cardIndex: number;
  blindMode: boolean;
  mode: 'cards' | 'match';
  matchedIds: string[];
}

export interface BuilderState {
  challengeIndex: number;
  customPromptFr: string;
  customSentenceEn: string;
  isCustomActive: boolean;
  selectedIndices: number[];
  checkedStatus: 'idle' | 'correct' | 'incorrect';
}

export interface RoleplayState {
  scenarioId: string;
  activeLineIndex: number;
  hideStudentLines: boolean;
  studentRole: 'A' | 'B';
  revealedIndices: number[];
}

export type MiniGameId = 'wordsearch' | 'vocabmatch' | 'sentence' | 'grammarblitz';

export type LessonMilestoneId =
  | 'warmup'
  | 'vocab'
  | 'grammar'
  | 'games'
  | 'time'
  | 'quiz';

export interface QuizState {
  subTab: 'games' | 'time' | 'quiz' | 'dialogue';
  questionIndex: number;
  answers: Record<string, number>;
}

export interface GamesHubState {
  activeGame: MiniGameId;
  themeId: string;
}

export interface TimeModuleState {
  mode: 'explore' | 'challenge';
  hour: number;
  minute: number;
  isPm: boolean;
  showZones: boolean;
}

export type GrammarSection = 'irregular' | 'modals' | 'tenses' | 'prepositions';

export interface GuideState {
  subTab: 'tenses' | 'guide' | 'builder';
  section: GrammarSection;
  hideIrregularForms: boolean;
  tensesCategory?:
    | 'present-simple'
    | 'present-continuous'
    | 'past-simple'
    | 'expressions'
    | 'simulator'
    | 'quiz';
}

export interface WritingSpaceState {
  tutorText: string;
  studentText: string;
  tutorStrokes: BoardStroke[];
  studentStrokes: BoardStroke[];
}

export interface RecapState {
  subTab: 'writing' | 'board' | 'recap';
  studentName: string;
  oralFluency: string;
  oralPronunciation: string;
  oralComprehension: string;
  oralNotes: string;
  writtenSyntax: string;
  writtenSpelling: string;
  writtenGrammar: string;
  writtenNotes: string;
  nextGoal: string;
}

export interface SavedSessionRecap {
  id: string;
  savedAt: number;
  dateLabel: string;
  studentName: string;
  stars: number;
  wordCount: number;
  summaryText: string;
  nextGoal: string;
}

export interface RoomParticipant {
  id: string;
  name: string;
  role: UserRole;
}

export interface RoomState {
  roomCode: string;
  controlMode: ControlMode;
  audioSync: boolean;
  activeTab: ModuleTab;
  stars: number;
  sessionBaseStars: number;
  completedModules: LessonMilestoneId[];
  warmup: WarmupState;
  vocab: VocabState;
  builder: BuilderState;
  roleplay: RoleplayState;
  quiz: QuizState;
  games: GamesHubState;
  timeModule: TimeModuleState;
  guide: GuideState;
  recap: RecapState;
  writingSpace: WritingSpaceState;
  wordbank: WordbankItem[];
  strokes: BoardStroke[];
  boardNote: string;
}

export interface VocabCard {
  id: string;
  en: string;
  fr: string;
  phonetic: string;
  partOfSpeech: string;
  level: 'A1' | 'A2';
  exampleEn: string;
  exampleFr: string;
}

export interface VocabDeck {
  id: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  imageUrl: string;
  cards: VocabCard[];
}

export interface SentenceChallenge {
  id: string;
  topicFr: string;
  grammarHintFr: string;
  promptFr: string;
  targetEn: string;
  level: 'A1' | 'A2';
}

export interface DialogueLine {
  speaker: 'A' | 'B';
  en: string;
  fr: string;
  tip?: string;
}

export interface RoleplayScenario {
  id: string;
  titleFr: string;
  titleEn: string;
  settingFr: string;
  roleAName: string;
  roleBName: string;
  level: 'A1' | 'A2';
  lines: DialogueLine[];
}

export interface IcebreakerPrompt {
  id: string;
  questionEn: string;
  questionFr: string;
  starterEn: string;
  optionA: string;
  optionB: string;
}
