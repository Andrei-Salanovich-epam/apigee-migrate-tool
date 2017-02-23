/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var async = require('async');
var migration = require('../base/migration-lib');

var info = {
	single: 'developer',
	plural: 'developers'
}; 

var getFileName = function(d) { return d.email; };

module.exports = function(grunt) {
	'use strict';
	grunt.registerTask('exportDevs', 'Export all developers from org ' + apigee.from.org + " [" + apigee.from.version + "]", function() {
		var done = this.async();
		
		migration.export(grunt, grunt.config.get("exportDevs.dest.data"), info, getFileName, done);
	});


	grunt.registerMultiTask('importDevs', 'Import all developers to org ' + apigee.to.org + " [" + apigee.to.version + "]", function() {
		var files;		
		var f = grunt.option('src');
		if (f)
		{
			grunt.verbose.writeln('src pattern = ' + f);
			files = grunt.file.expand(opts,f);
		}
		else
		{
			files = this.filesSrc;
		}

		var done = this.async();
		migration.import(grunt, files, info, done);
	});

	grunt.registerMultiTask('importDevCompanies', 'Import updates developer companies ' + apigee.to.org + " [" + apigee.to.version + "]", function() {
		var files = this.filesSrc;

		var url = apigee.to.url;						
		var userid = apigee.to.userid;
		var passwd = apigee.to.passwd;
		var org = apigee.to.org;	
		var done = this.async();

		var completedFiles = 0;		

		for(var i = 0; i < files.length; i++){
			var filepath = files[i];
			grunt.log.writeln(filepath);
			var content = grunt.file.read(filepath);
			var developer = JSON.parse(content);
			var completedCompanies = 0;

			grunt.verbose.writeln('Coimpanies ' + JSON.stringify(developer.companies));	
			
			for(var j = 0; j < developer.companies.length; j++){
				var company = developer.companies[j];
				var requestUrl = url + '/v1/organizations/' + org + '/companies/' + company + '/developers';
				var bodyContent =  JSON.stringify({
					developer:[{
						email: developer.userName,
						role: "owner"
					}]}
				);

				grunt.log.writeln('[POST] ' + requestUrl + ' -> ' + bodyContent);

				request.post({
					headers: {'Content-Type' : 'application/json'},
					url:    requestUrl,
					body:   bodyContent					
				}, function(error, response, body){
					if(error)
						grunt.log.error('[ERROR] Resp [' + response.statusCode + '] ' + ' -> ' + error);											

					grunt.log.writeln('Resp [' + response.statusCode + '] ' + ' -> ' + body);

					if((files.length === i + 1) && (j + 1 === developer.companies.length))
						done();

				}).auth(userid, passwd, true);
			}
		}
	});

	grunt.registerMultiTask('deleteDevs', 'Delete all developers from org ' + apigee.to.org + " [" + apigee.to.version + "]", function() {
		var done = this.async();
		migration.delete(grunt, this.filesSrc, getFileName, info, done);
	});
};