const obfuscater = require('./base/obfuscator');
const recursive = require("recursive-readdir");
const fs = require('fs');
const _ = require("underscore");

const table = obfuscater.buildObfuscaterTableIfNotAlready();
const sampleString = "Test123 \r\n @$#%@#$%#@$%";

const obfuscateCompanyApps = () => {
    const attributesToObfuscate = [
        'displayname', 'description', 'app_creator', 'lastmodifier'
    ]

    const table = obfuscater.buildObfuscaterTableIfNotAlready();
    const obfuscate = (str) => obfuscater.obfuscateString(str, table);

    recursive("data/apps/company", [], function (err, files) {
        _.each(files, (file) => {            
            var company = JSON.parse(fs.readFileSync(file, "utf8"))
            if(!company.credentials) //no need to worry about companies without credentials
                return;

            _.each(company.attributes, attr => {
                
                if(attributesToObfuscate.indexOf(attr.name.toLowerCase()) >= 0){
                    attr.value = obfuscate(attr.value);
                }
            });

            _.each(company.credentials, cred => {                
                _.each(cred.attributes,  attr => {                    
                    if(attributesToObfuscate.indexOf(attr.name.toLowerCase()) >= 0){
                        attr.value = obfuscate(attr.value);
                    }
                });

                cred.consumerKey = obfuscate(cred.consumerKey);
                cred.consumerSecret = obfuscate(cred.consumerSecret);
            });
    
            fs.writeFileSync(file, JSON.stringify(company), "utf8");    
        });

        console.log(`APIGEE files has been obfusscated. Total files: ${files.length}`);
    });
};

obfuscateCompanyApps();

//console.log(`Obfuscated string is ${obfuscater.obfuscateString(sampleString, table)}`);