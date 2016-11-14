/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var async = require('async');

var appContainer = require('../Base/BaseAppContainer.js');

var items;
var MAX_ITEMS_AT_ONCE = 50;

var containerName = 'company';
var pluralContainerName = 'companies';

module.exports = function(grunt) {
	'use strict';
	grunt.registerTask('exportCompanies', 'Export all '+pluralContainerName+' from org ' + apigee.from.org + ' [' + apigee.from.version + ']', function() {
		var done = this.async();
		appContainer.export(grunt, grunt.config.get("exportCompanies.dest.data"), containerName, pluralContainerName, done);
	});


	grunt.registerMultiTask('importCompanies', 'Import all '+pluralContainerName+' to org ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {
		var done = this.async();
		appContainer.import(grunt, grunt.config.get("importCompanies.dest.data"), containerName, pluralContainerName, done);
	});

	grunt.registerMultiTask('deleteCompanies', 'Delete all '+pluralContainerName+' from org ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {
		var done = this.async();
		appContainer.delete(grunt, grunt.config.get("deleteCompanies.dest.data"), containerName, pluralContainerName, done);
	});
};