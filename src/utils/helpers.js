const { randomInt } = require('crypto');

const PREFIXES = ['The', 'Project', 'Operation', 'Codename', 'Agent', 'Mission'];
const NOUNS = [
  'Nightingale',
  'Kraken',
  'Phoenix',
  'Shadow',
  'Dragon',
  'Falcon',
  'Viper',
  'Cobra',
  'Raven',
  'Wolf',
  'Panther',
  'Specter',
  'Tempest',
  'Cyclone',
  'Mirage',
  'Sentinel',
  'Cipher',
  'Eclipse',
  'Harbinger',
  'Basilisk',
  'Chimera',
  'Griffin',
  'Hydra',
  'Lynx',
  'Mongoose',
  'Orca',
  'Scorpion',
  'Stingray',
  'Valkyrie',
  'Wraith',
];

const pick = (list) => list[randomInt(list.length)];

/** Random codename such as "Operation Kraken" (180 combinations). */
const generateCodename = () => `${pick(PREFIXES)} ${pick(NOUNS)}`;

/** Codename with a short numeric tag, used once the plain combinations collide. */
const generateTaggedCodename = () => `${generateCodename()} ${randomInt(100, 1000)}`;

/** Six-character upper-case confirmation code, e.g. "X7K2QD". */
const generateConfirmationCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += alphabet[randomInt(alphabet.length)];
  return code;
};

/** Whole-number mission success probability from 60 to 100 inclusive. */
const randomSuccessProbability = () => randomInt(60, 101);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value) => typeof value === 'string' && UUID_RE.test(value);

module.exports = {
  generateCodename,
  generateTaggedCodename,
  generateConfirmationCode,
  randomSuccessProbability,
  isUuid,
  PREFIXES,
  NOUNS,
};
