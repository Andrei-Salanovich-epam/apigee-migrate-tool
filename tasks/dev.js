/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var async = require('async');
var devs;
var MAX_ITEMS_AT_ONCE = 50;
module.exports = function(grunt) {
	'use strict';
	grunt.registerTask('exportDevs', 'Export all developers from org ' + apigee.from.org + " [" + apigee.from.version + "]", function() {
		var url = apigee.from.url;
		var org = apigee.from.org;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportDevs.dest.data");
		var done_count =0;
		var err_count =0;

		grunt.verbose.write("getting developers..." + url);
		url = url + "/v1/organizations/" + org + "/developers";

		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
			    devs =  JSON.parse(body);

			    grunt.log.writeln("Found " + devs.length + " developers. Exporting...")
				// perform reading by MAX_ITEMS_AT_ONCE devs in one async     
				async.forEachLimit(devs, MAX_ITEMS_AT_ONCE, function(devEmail, callback) {
				    var dev_url = url + "/" + devEmail;
				    grunt.file.mkdir(filepath);
					grunt.verbose.write(devEmail + ' ');
				    //Call developer details
					request(dev_url, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							grunt.verbose.write(body);
						    var dev_detail =  JSON.parse(body);
						    var dev_file = filepath + "/" + dev_detail.email;
						    grunt.file.write(dev_file, body);
						}
						else
						{
							grunt.log.error(error);
							err_count++;
						}
						done_count++;
						
						if (done_count == devs.length)
						{
							grunt.log.ok('Exported ' + done_count + ' developers. ' + 'Failed: ' + err_count);
							done();
						}
						callback();
					}).auth(userid, passwd, true);
				    // End Developer details        
			    }, function(err) {
			        if (err) {
						grunt.log.error(err);
			        	return done(false);
			        }
			        done();
			    });
			} 
			else
			{
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
		var done = this.async();
	});


	grunt.registerMultiTask('importDevs', 'Import all developers to org ' + apigee.to.org + " [" + apigee.to.version + "]", function() {
		var url = apigee.to.url;
		var org = apigee.to.org;
		var userid = apigee.to.userid;
		var passwd = apigee.to.passwd;
		var done_count = 0;
		var err_count =0;
		var files;
		url = url + "/v1/organizations/" + org + "/developers";
		var done = this.async();
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
		grunt.log.writeln("Found dev files: "+ files.length + ". Importing them to dest...");

		async.forEachLimit(files, MAX_ITEMS_AT_ONCE, function(filepath, callback) {
			grunt.log.writeln(filepath);
			var content = grunt.file.read(filepath);
			grunt.verbose.write(url);	
			request.post({
			  headers: {'Content-Type' : 'application/json'},
			  url:     url,
			  body:    content
			}, function(error, response, body){
					var status = 999;
					if (response)	
					 status = response.statusCode;
					grunt.verbose.writeln('Resp [' + status + '] for dev creation ' + this.url + ' -> ' + body);
					if (error || status!=201) {
					  	grunt.verbose.error('ERROR Resp [' + status + '] for dev creation ' + this.url + ' -> ' + body); 
					  	err_count++;
					}
					done_count++;
					if (done_count == files.length)
					{
						grunt.log.ok('Imported ' + done_count + ' developers');
						done();
					}
					callback();
			}.bind( {url: url}) ).auth(userid, passwd, true);

	    }, function(err) {
	        if (err) {
				grunt.log.error(err);
	        	return done(false);
	        }
	        done();
	    });

	});

	grunt.registerMultiTask('deleteDevs', 'Delete all developers from org ' + apigee.to.org + " [" + apigee.to.version + "]", function() {
		var url = apigee.to.url;
		var org = apigee.to.org;
		var userid = apigee.to.userid;
		var passwd = apigee.to.passwd;
		var done_count = 0;
		var err_count = 0;
		var files = this.filesSrc;
		var opts = {flatten: false};
		var f = grunt.option('src');
		if (f)
		{
			grunt.verbose.writeln('src pattern = ' + f);
			files = grunt.file.expand(opts,f);
		}
		url = url + "/v1/organizations/" + org + "/developers/";
		var done = this.async();
		grunt.log.writeln("Found dev files: "+ files.length + ". Removing same devs from dest...");

		// perform deletion by MAX_ITEMS_AT_ONCE devs in one async     
		async.forEachLimit(files, MAX_ITEMS_AT_ONCE, function(filepath, callback) {
			var content = grunt.file.read(filepath);
			var dev = JSON.parse(content);
			var del_url = url + dev.email;
			grunt.verbose.write(del_url);	
				request.del(del_url, function(error, response, body){
				  var status = 999;
				  if (response)	
					status = response.statusCode;
				  grunt.verbose.writeln('Resp [' + status + '] for dev deletion ' + this.del_url + ' -> ' + body);
				  if (error || status!=200)
				  { 
				  	grunt.verbose.error('ERROR Resp [' + status + '] for dev deletion ' + this.del_url + ' -> ' + body); 
				  	err_count++;
				  }
				  done_count++;
				  if (done_count == files.length)
				  {
					grunt.log.ok('Processed ' + done_count + ' developers. Remove failed: ' + err_count);
					done();
				  }
				  callback();
				}.bind( {del_url: del_url}) ).auth(userid, passwd, true);
			}, function(err) {
	        if (err) {
				grunt.log.error(err);
	        	return done(false);
	        }
	        done();
	    });
	});
};