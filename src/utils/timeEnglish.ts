const NUMBER_WORDS: Record<number, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
  20: 'twenty',
  21: 'twenty-one',
  22: 'twenty-two',
  23: 'twenty-three',
  24: 'twenty-four',
  25: 'twenty-five',
  26: 'twenty-six',
  27: 'twenty-seven',
  28: 'twenty-eight',
  29: 'twenty-nine',
};

export interface EnglishTimeReadout {
  analogEn: string;
  digitalEn: string;
  numeric24: string;
  numeric12: string;
  periodEn: string;
  periodFr: string;
  zone: 'exact' | 'past' | 'half' | 'to';
  ruleFr: string;
}

function getHourWord(hour12: number): string {
  const normalized = ((hour12 - 1 + 12) % 12) + 1;
  return NUMBER_WORDS[normalized] || String(normalized);
}

function formatDigitalMinutes(minute: number): string {
  if (minute === 0) return "o'clock";
  if (minute < 10) return `oh-${NUMBER_WORDS[minute]}`;
  if (minute <= 29) return NUMBER_WORDS[minute];
  const tens = Math.floor(minute / 10) * 10;
  const units = minute % 10;
  const tensWord = tens === 30 ? 'thirty' : tens === 40 ? 'forty' : 'fifty';
  return units === 0 ? tensWord : `${tensWord}-${NUMBER_WORDS[units]}`;
}

export function formatEnglishTime(
  hour12Input: number,
  minuteInput: number,
  isPm: boolean
): EnglishTimeReadout {
  const hour12 = ((hour12Input - 1 + 12) % 12) + 1;
  const minute = ((minuteInput % 60) + 60) % 60;
  const hour24 = isPm
    ? hour12 === 12
      ? 12
      : hour12 + 12
    : hour12 === 12
      ? 0
      : hour12;

  const nextHour12 = (hour12 % 12) + 1;
  const hourWord = getHourWord(hour12);
  const nextHourWord = getHourWord(nextHour12);

  const numeric24 = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const numeric12 = `${hour12}:${String(minute).padStart(2, '0')} ${isPm ? 'p.m.' : 'a.m.'}`;

  let periodEn = 'in the morning';
  let periodFr = 'le matin';
  if (hour24 === 12 && minute === 0) {
    periodEn = 'at midday / noon';
    periodFr = 'à midi';
  } else if (hour24 === 0 && minute === 0) {
    periodEn = 'at midnight';
    periodFr = 'à minuit';
  } else if (hour24 >= 12 && hour24 < 18) {
    periodEn = 'in the afternoon';
    periodFr = "l'après-midi";
  } else if (hour24 >= 18 && hour24 < 22) {
    periodEn = 'in the evening';
    periodFr = 'le soir';
  } else if (hour24 >= 22 || hour24 < 5) {
    periodEn = 'at night';
    periodFr = 'la nuit';
  }

  let analogEn = '';
  let zone: 'exact' | 'past' | 'half' | 'to' = 'exact';
  let ruleFr = '';

  if (minute === 0) {
    if (hour24 === 12) {
      analogEn = "It's midday (twelve o'clock).";
      ruleFr = "À 12:00 en journée, on dit « midday » (ou « noon »), ou simplement « twelve o'clock ».";
    } else if (hour24 === 0) {
      analogEn = "It's midnight (twelve o'clock).";
      ruleFr = "À 00:00 la nuit, on dit « midnight » (minuit).";
    } else {
      analogEn = `It's ${hourWord} o'clock.`;
      ruleFr = `Heure pile (:00) : on place l’heure suivie de « o'clock ».`;
    }
    zone = 'exact';
  } else if (minute === 15) {
    analogEn = `It's a quarter past ${hourWord}.`;
    zone = 'past';
    ruleFr = `Aiguille à droite (:15) : « a quarter past ${hourWord} » = un quart d’heure après ${hour12} h.`;
  } else if (minute === 30) {
    analogEn = `It's half past ${hourWord}.`;
    zone = 'half';
    ruleFr = `Demi-heure (:30) : « half past ${hourWord} » = la moitié après ${hour12} h (toujours « past », jamais « to » !).`;
  } else if (minute === 45) {
    analogEn = `It's a quarter to ${nextHourWord}.`;
    zone = 'to';
    ruleFr = `Aiguille à gauche (:45) : il manque 15 minutes pour aller à ${nextHour12} h → « a quarter to ${nextHourWord} ».`;
  } else if (minute < 30) {
    const minWord = NUMBER_WORDS[minute];
    const minLabel = minute % 5 === 0 ? minWord : `${minWord} ${minute === 1 ? 'minute' : 'minutes'}`;
    analogEn = `It's ${minLabel} past ${hourWord}.`;
    zone = 'past';
    ruleFr = `Zone PAST (01 à 29 min, à droite) : on annonce les minutes écoulées depuis ${hour12} h (« ${minLabel} past ${hourWord} »).`;
  } else {
    const remaining = 60 - minute;
    const remWord = NUMBER_WORDS[remaining];
    const remLabel = remaining % 5 === 0 ? remWord : `${remWord} ${remaining === 1 ? 'minute' : 'minutes'}`;
    analogEn = `It's ${remLabel} to ${nextHourWord}.`;
    zone = 'to';
    ruleFr = `Zone TO (31 à 59 min, à gauche) : on compte les ${remaining} min restantes AVANT l’heure suivante (${nextHour12} h) → « ${remLabel} to ${nextHourWord} ».`;
  }

  const digitalEn =
    minute === 0
      ? hour24 === 12
        ? "It's twelve noon."
        : hour24 === 0
          ? "It's twelve midnight."
          : `It's ${hourWord} o'clock.`
      : `It's ${hourWord} ${formatDigitalMinutes(minute)}.`;

  return {
    analogEn,
    digitalEn,
    numeric24,
    numeric12,
    periodEn,
    periodFr,
    zone,
    ruleFr,
  };
}
