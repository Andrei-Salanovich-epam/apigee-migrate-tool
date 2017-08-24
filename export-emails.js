let fs = require('fs');
let path = require('path');
let _ = require("underscore");
let recursive = require("recursive-readdir");

let getDevEmails = () => {
    let result = {};
    fs.readdir('data/devs', (err, files) => {
        _.each(files, file => {
            result[file] = file;            
        })
    });

    return result;
}

var getCompanyEmail = function(done){
    var result = {};

    recursive("data/apps/company", [], function (err, files) {
        _.each(files, (file) => {            
            var company = JSON.parse(fs.readFileSync(file, "utf8"))
            var attr = _.find(company.attributes, attr => {
                return attr.name == "app_creator"
            });

            if(attr){
                result[attr.value] = attr.value
            }
        });

        done(result);
    });    
}

var getAllEmails = function(){
    var dev = getDevEmails();
    getCompanyEmail((company) => {
        for(var i in dev){
            company[i] = dev[i];
        }   

        let text = '';
        for(var email in company){
            if(email.indexOf('dispostable') >= 0)
                continue;

            text += company[email] + '\n';
            console.log('Email found %s', company[email]);
        }

        fs.writeFileSync('data/emails', text, "utf8");
    });
}

var getSqlScriptData = function(){
    var dev = getDevEmails();
    getCompanyEmail((company) => {
        for(var i in dev){
            company[i] = dev[i];
        }   

        let text = '';
        for(var email in company){            
            text += `'${company[email]}'` + ',\n';
            console.log('Email found %s', company[email]);
        }

        text = text.substring(0, text.length - 2);

        let sqlScript = `SELECT '"' + ua.Email + '"' as Email, '"' + convert(nvarchar(50), c.CompanyGUID) + ':' + c.CompanyName + '"' as CompanyId, '"' + c.CompanyName + '"' as CompanyName FROM UserAccount as ua
                    INNER JOIN UserCompany as uc ON uc.UserId = ua.UserId
                    INNER JOIN Company as c ON c.CompanyId = uc.CompanyId
                    WHERE ua.[Enabled] = '1'
                        AND c.[Status] NOT IN (3, 4)
                        AND ua.Email IN (${text})`;

        fs.writeFileSync('data/scriptEmails', sqlScript, "utf8");
    });
}

var getKeys = function(){
    let text  = '';

    recursive("data/apps/company", [], function (err, files) {
        _.each(files, (file) => {            
            var company = JSON.parse(fs.readFileSync(file, "utf8"))
            if(!company.credentials)
                return;

            let credentials = _.first(company.credentials);                        
            let authorization = new Buffer(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
            text += `${credentials.consumerKey},Basic ${authorization}\n`           
        });

        fs.writeFileSync('data/keys', text, "utf8");
    });    
}

//getKeys();
//getAllEmails();
getSqlScriptData();
