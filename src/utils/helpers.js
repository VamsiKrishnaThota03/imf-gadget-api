const generateCodename = () => {
  const prefixes = ['The', 'Project', 'Operation'];
  const nouns = ['Nightingale', 'Kraken', 'Phoenix', 'Shadow', 'Dragon', 'Falcon'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${prefix} ${noun}`;
};

const generateConfirmationCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

module.exports = {
  generateCodename,
  generateConfirmationCode,
}; 