/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var async = require('async');
var migration = require('../base/migration-lib');

var info = {
	single: 'company',
	plural: 'companies'
}; 

var getFileName = function(d) { return d.name; };


module.exports = function(grunt) {
	'use strict';
	grunt.registerTask('exportCompanies', 'Export all ' + info.plural + ' from org ' + apigee.from.org + ' [' + apigee.from.version + ']', function() {
		var done = this.async();	
		migration.export(grunt, grunt.config.get("exportCompanies.dest.data"), info, getFileName,  done);
	});

	grunt.registerMultiTask('importCompanies', 'Import all '+info.single+' to org ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {
		var files;
		var opts = {flatten: false};
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

	grunt.registerMultiTask('deleteCompanies', 'Delete all '+ info.single+' from org ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {
		var done = this.async();				
		migration.delete(grunt, this.filesSrc, getFileName, info, done);
	});
};