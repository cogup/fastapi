"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.superFilter = void 0;
const pt_BR_1 = __importDefault(require("../../dicts/pt_BR"));
const sequelize_1 = require("sequelize");
const { like, or } = sequelize_1.Op;
const spellingDictionary = pt_BR_1.default;
function fixText(text) {
    const words = text.toLowerCase().split(' ');
    const fixedWords = words.map((word) => {
        if (spellingDictionary[word]) {
            return spellingDictionary[word];
        }
        else {
            return word;
        }
    });
    return fixedWords;
}
const formaCondition = (searchTerm, op = like) => {
    return {
        [op]: `%${searchTerm}%`
    };
};
const addTerm = (target, fullTarget, op) => {
    const history = [fullTarget];
    target.push(formaCondition(fullTarget, op));
    const targetSplit = fullTarget.split(' ');
    if (targetSplit.length > 1) {
        targetSplit.forEach((word) => {
            const formated = formaCondition(word);
            const firstLetterUpper = formaCondition(word.charAt(0).toUpperCase() + word.slice(1), op);
            const upperCase = formaCondition(word.toUpperCase(), op);
            const lowerCase = formaCondition(word.toLowerCase(), op);
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
const superFilter = (fields, searchTerm, op) => {
    let term = addTerm([], searchTerm, op);
    const textFixed = fixText(searchTerm);
    const textFixedJoin = textFixed.join(' ');
    if (searchTerm !== textFixedJoin) {
        term = addTerm(term, textFixedJoin, op);
    }
    const termNotAccents = removeAccents(searchTerm);
    if (searchTerm !== termNotAccents && textFixedJoin !== termNotAccents) {
        term = addTerm(term, termNotAccents, op);
    }
    const termFields = [];
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
exports.superFilter = superFilter;
function removeAccents(text) {
    const accentMap = {
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
    for (const letter in accentMap) {
        const regex = new RegExp(accentMap[letter], 'gi');
        text = text.replace(regex, letter);
    }
    return text;
}
