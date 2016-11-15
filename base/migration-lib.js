var request = require('request');
var apigee = require('../config.js');
var async = require('async');

var MAX_ITEMS_AT_ONCE = 50;

module.exports.export = function(grunt, filepath, info, getFileName, done) {
		var devs;
		var url = apigee.from.url;
		var org = apigee.from.org;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var done_count =0;
		var err_count =0;

		grunt.verbose.writeln('getting '+info.plural+'...' + url);
		url = url + '/v1/organizations/' + org + '/'+info.plural;

		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
			    items =  JSON.parse(body);

			    grunt.log.writeln('Found ' + items.length + ' '+info.plural+'. Exporting...')
				// perform reading by MAX_ITEMS_AT_ONCE items in one async     
				async.forEachLimit(items, MAX_ITEMS_AT_ONCE, function(item, callback) {
				    var dev_url = url + '/' + item;
				    grunt.file.mkdir(filepath);
					grunt.verbose.writeln(item + ' ');
				    //Call developer details
					request(dev_url, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							grunt.verbose.write(body);
						    var details =  JSON.parse(body);
						    var company_file = filepath + '/' + getFileName(details);
						    grunt.file.write(company_file, body);
						}
						else
						{
							grunt.log.error(error);
							err_count++;
						}
						done_count++;
						
						if (done_count == items.length)
						{
							grunt.log.ok('Exported ' + done_count + ' '+info.plural+'. ' + 'Failed: ' + err_count);
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
};

module.exports.import = function(grunt, files, info, done) {
		var url = apigee.to.url;
		var org = apigee.to.org;
		var userid = apigee.to.userid;
		var passwd = apigee.to.passwd;
		var done_count = 0;
		var err_count = 0;		
		url = url + '/v1/organizations/' + org + '/' + info.plural;
		var opts = {flatten: false};
		var f = grunt.option('src');

		grunt.log.writeln('Found '+info.single+' files: '+ files.length + '. Importing them to dest...');

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
					grunt.verbose.writeln('Resp [' + status + '] for '+info.single+' creation ' + this.url + ' -> ' + body);
					if (error || status!=201) {
					  	grunt.verbose.error('ERROR Resp [' + status + '] for '+info.single+' creation ' + this.url + ' -> ' + body); 
					  	err_count++;
					}
					done_count++;
					if (done_count == files.length)
					{
						grunt.log.ok('Imported ' + done_count + ' '+info.plural);
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

};

module.exports.delete = function(grunt, files, getName, info, done) {
		var url = apigee.to.url;
		var org = apigee.to.org;
		var userid = apigee.to.userid;
		var passwd = apigee.to.passwd;
		var done_count = 0;
		var err_count = 0;		
		var opts = {flatten: false};
		var f = grunt.option('src');		
		url = url + '/v1/organizations/' + org + '/'+info.plural+'/';

		grunt.log.writeln('Found '+info.single+' files: '+ files.length + '. Removing same '+info.plural+' from dest...');

		// perform deletion by MAX_ITEMS_AT_ONCE items in one async     
		async.forEachLimit(files, MAX_ITEMS_AT_ONCE, function(filepath, callback) {
			var content = grunt.file.read(filepath);
			var detail = JSON.parse(content);
			var del_url = url + getName(detail);
			grunt.verbose.write(del_url);	
				request.del(del_url, function(error, response, body){
				  var status = 999;
				  if (response)	
					status = response.statusCode;
				  grunt.verbose.writeln('Resp [' + status + '] for '+info.single+' deletion ' + this.del_url + ' -> ' + body);
				  if (error || status!=200)
				  { 
				  	grunt.verbose.error('ERROR Resp [' + status + '] for '+info.single+' deletion ' + this.del_url + ' -> ' + body); 
				  	err_count++;
				  }
				  done_count++;
				  if (done_count == files.length)
				  {
					grunt.log.ok('Processed ' + done_count + ' '+info.plural+'. Remove failed: ' + err_count);
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
};