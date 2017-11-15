const obfuscater = require('./base/obfuscator');
const recursive = require("recursive-readdir");
const fs = require('fs');
const _ = require("underscore");

const table = obfuscater.buildObfuscaterTableIfNotAlready();

const obfuscateCsv = () => {
    const fileName = 'data/csv.csv';
    if(!fs.existsSync(fileName)){
        return console.error(`${fileName} doesn't exists. Please add this file and run command again`);
    }

    const fileContent = fs.readFileSync(fileName, 'utf8');
    const lines = fileContent.split('\n');
    let newContent = lines[0] + '\n';
    lines.splice(0,1);
    
    _.each(lines, (l) => {
        newContent += obfuscater.obfuscateString(l, table) + '\n';
    });

    fs.writeFileSync(fileName, newContent, "utf8");
    console.log('CSV file has been obfuscated!')
};

obfuscateCsv();
