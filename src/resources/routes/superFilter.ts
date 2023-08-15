import dictPtBr from '../../dicts/pt_BR';
import { Op } from 'sequelize';

const { like, or } = Op;

const spellingDictionary = dictPtBr;

function fixText(text: string): string[] {
  const words = text.toLowerCase().split(' ');
  const fixedWords = words.map((word) => {
    if (spellingDictionary[word]) {
      return spellingDictionary[word];
    } else {
      return word;
    }
  });
  return fixedWords;
}

const formaCondition = (searchTerm: string) => {
  return {
    [like]: `%${searchTerm}%`
  };
};

const addTerm = (target: any[], fullTarget: string): any[] => {
  const history = [fullTarget];
  target.push(formaCondition(fullTarget));
  const targetSplit = fullTarget.split(' ');

  if (targetSplit.length > 1) {
    targetSplit.forEach((word) => {
      const formated = formaCondition(word);
      const firstLetterUpper = formaCondition(word.charAt(0).toUpperCase() + word.slice(1));
      const upperCase = formaCondition(word.toUpperCase());
      const lowerCase = formaCondition(word.toLowerCase());

      if (history.indexOf(`%${word}%`) === -1) {
        history.push(`%${word}%`);
        target.push(formated);
        target.push(firstLetterUpper);
        target.push(firstLetterUpper);
        target.push(upperCase);
        target.push(lowerCase);
      }
    });
  }

  return target;
};

const superFilter = (fields: string[], searchTerm: string) => {
  let term = addTerm([], searchTerm);

  const textFixed = fixText(searchTerm);
  const textFixedJoin = textFixed.join(' ');

  if (searchTerm !== textFixedJoin) {
    term = addTerm(term, textFixedJoin);
  }

  const termNotAccents = removeAccents(searchTerm);

  if (searchTerm !== termNotAccents && textFixedJoin !== termNotAccents) {
    term = addTerm(term, termNotAccents);
  }

  const termFields: any[] = [];

  fields.forEach((field) => {
    term.forEach((item) => {
      termFields.push({
        [field]: item
      });
    });
  });

  return {
    [or]: termFields
  };
};

function removeAccents(text: string): string {
  const accentMap: { [key: string]: string } = {
    a: '[aàáâãäå]',
    ae: 'æ',
    c: 'ç',
    e: '[eèéêë]',
    i: '[iìíîï]',
    n: 'ñ',
    o: '[oòóôõö]',
    oe: 'œ',
    u: '[uùúûűü]',
    y: '[yÿ]'
  };

  for (let letter in accentMap) {
    const regex = new RegExp(accentMap[letter], 'gi');
    text = text.replace(regex, letter);
  }

  return text;
}

export { superFilter };
