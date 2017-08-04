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

getAllEmails();
