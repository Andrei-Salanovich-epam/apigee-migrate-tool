let fs = require('fs');
let path = require('path');
let _ = require("underscore");
let recursive = require("recursive-readdir");


 recursive("data/apps/company", [], function (err, files) {
    _.each(files, (file) => {            
        var company = JSON.parse(fs.readFileSync(file, "utf8"))
        if(!company.credentials)
            return;

        const attrbutesToUpdate = ["displayname", "description"]

        _.each(company.attributes, attr => {
            if(attrbutesToUpdate.indexOf(attr.name.toLowerCase()) < 0)
                return;

            let maxLenght = 50;
            if(attr.name === 'DisplayName'){
                if(attr.value.match(/^\d+$/)){
                    console.log(`application name contains only digits: ${attr.value}. Updated to _${attr.value}`);
                    attr.value = `_${attr.value}`;
                }
            }
                

            if(attr.value && attr.value.length >= maxLenght){
                attr.value = attr.value.substring(0, maxLenght - 4) + '...';
                console.log(`attribute: ${attr.name} has been cut on ${file}`);
            }

            if(attr.value.indexOf('\r\n') > 0){
                attr.value = attr.value.replace(/\r\n/g, " ");
                console.log(`new line has been removed from attribute: ${attr.name}`);
            }   

            if(attr.value.match(/[\u0250-\ue007]/g)){
                console.log(`non-latin chars have been removed from: ${attr.name}`);
                attr.value = attr.value.replace(/[\u0250-\ue007]/g, '');
            }

            if(attr.value.match(/\t/g)){
                console.log(`non-latin (square) chars have been removed from: ${attr.name}`);
                attr.value = attr.value.replace(/\t/g, '');
            }

            if(attr.value.match(/\\t/g)){
                console.log(`non-latin (non-square) chars have been removed from: ${attr.name}`);
                attr.value = attr.value.replace(/\\t/g, '');
            }
			
			if(attr.value.indexOf('\t') > 0){
                console.log(`non-latin (non-square) (non-regex) chars have been removed from: ${attr.name}`);
                attr.value = attr.value.replace('\t', '');
            }
        });

        fs.writeFileSync(file, JSON.stringify(company), "utf8");
    });
});    