var fs = require('fs');
var path = require('path');
var apigee = require('../config.js');
var _ = require("underscore");
var async = require('async');

module.exports = function(grunt) {
	'use strict';
	grunt.registerMultiTask('exportDevEmails', 'Export Dev Emails ' + apigee.from.org + ' [' + apigee.from.version + ']', function() {
		
		let files = grunt.file.expand('data/dev/*');		
		let done = this.async();

		// grunt.log.writeln('Files : ' + JSON.stringify(files));

		// async.eachSeries(files, (file, callback) => {
		
		// 	try{
		// 		var email = path.basename(file);
				
		// 	}
		// 	catch(e){

		// 	}			
		// },
		// (error) => {
		// 	done();
		// })

        _.each(files, function(file){
				grunt.log.writeln('Email: ' + file);
        });
	});	
};