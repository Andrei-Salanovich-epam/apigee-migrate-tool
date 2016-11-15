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

	grunt.registerMultiTask('deleteDevs', 'Delete all developers from org ' + apigee.to.org + " [" + apigee.to.version + "]", function() {
		var done = this.async();
		migration.delete(grunt, this.filesSrc, getFileName, info, done);
	});
};