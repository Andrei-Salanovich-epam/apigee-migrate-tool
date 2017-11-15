let fs = require('fs');
let path = require('path');
let _ = require("underscore");

const alphabet = 'abcdefghklnopqrstuvwxzy'.split('');
const digits = '1234567890'.split('');

const getRandomArbitrary = (min, max) => {
    return Math.round(Math.random() * (max - min) + min);
}

const hasOwnProperty = (obj, prop) => {
    var proto = obj.__proto__ || obj.constructor.prototype;
    return (prop in obj) &&
        (!(prop in proto) || proto[prop] !== obj[prop]);
}

exports.buildObfuscaterTableIfNotAlready = () => {
    var table = {};
    const fileName = `data/obfuscator-table.json`

    if(!fs.existsSync(fileName)){
        for(let i = 0; i < alphabet.length; i++){
            const iLowerCase = alphabet[i].toLowerCase();
            const iUpperCase = alphabet[i].toUpperCase();
    
            table[iLowerCase] = alphabet[getRandomArbitrary(0, alphabet.length - 1)];
            table[iUpperCase] = alphabet[getRandomArbitrary(0, alphabet.length - 1)].toUpperCase();
        };
    
        for(let i = 0; i < digits.length; i++){
            table[digits[i]] = digits[getRandomArbitrary(0, digits.length - 1)];
        };
    }
    else{
        table = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    }    
    fs.writeFileSync(fileName, JSON.stringify(table), 'utf8');
    return table;
};

exports.obfuscateString = (str, table) => {
    if(!str) return str;    

    let result = '';
    for(let i = 0; i < str.length; i++){
        let char = str.charAt(i);

        if(table.hasOwnProperty(char))
            result += table[char];
        else
            result += char;
    };

    return result;
};