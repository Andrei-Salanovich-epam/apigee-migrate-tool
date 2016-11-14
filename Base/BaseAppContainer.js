var request = require('request');
var apigee = require('../config.js');
var async = require('async');

var MAX_ITEMS_AT_ONCE = 50;

module.exports.export = function(grunt, filepath, containerName, pluralContainerName, endCallback) {
		var devs;
		var url = apigee.from.url;
		var org = apigee.from.org;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var done_count =0;
		var err_count =0;

		grunt.verbose.writeln('getting '+pluralContainerName+'...' + url);
		url = url + '/v1/organizations/' + org + '/'+pluralContainerName;

		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
			    items =  JSON.parse(body);

			    grunt.log.writeln('Found ' + items.length + ' '+pluralContainerName+'. Exporting...')
				// perform reading by MAX_ITEMS_AT_ONCE items in one async     
				async.forEachLimit(items, MAX_ITEMS_AT_ONCE, function(item, callback) {
				    var dev_url = url + '/' + item;
				    grunt.file.mkdir(filepath);
					grunt.verbose.writeln(item + ' ');
				    //Call developer details
					request(dev_url, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							grunt.verbose.write(body);
						    var company_detail =  JSON.parse(body);
						    var company_file = filepath + '/' + company_detail.name;
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
							grunt.log.ok('Exported ' + done_count + ' '+pluralContainerName+'. ' + 'Failed: ' + err_count);
							endCallback();
						}
						callback();
					}).auth(userid, passwd, true);
				    // End Developer details        
			    }, function(err) {
			        if (err) {
						grunt.log.error(err);
			        	return endCallback(false);
			        }
			        endCallback();
			    });
			} 
			else
			{
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
};

module.exports.import = function(grunt, filepath, containerName, pluralContainerName, doneCallback) {
		var url = apigee.to.url;
		var org = apigee.to.org;
		var userid = apigee.to.userid;
		var passwd = apigee.to.passwd;
		var done_count = 0;
		var err_count =0;
		var files;
		url = url + '/v1/organizations/' + org + '/' + pluralContainerName;
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
		grunt.log.writeln('Found '+containerName+' files: '+ files.length + '. Importing them to dest...');

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
					grunt.verbose.writeln('Resp [' + status + '] for '+containerName+' creation ' + this.url + ' -> ' + body);
					if (error || status!=201) {
					  	grunt.verbose.error('ERROR Resp [' + status + '] for '+containerName+' creation ' + this.url + ' -> ' + body); 
					  	err_count++;
					}
					done_count++;
					if (done_count == files.length)
					{
						grunt.log.ok('Imported ' + done_count + ' '+pluralContainerName);
						doneCallback();
					}
					callback();
			}.bind( {url: url}) ).auth(userid, passwd, true);

	    }, function(err) {
	        if (err) {
				grunt.log.error(err);
	        	return doneCallback(false);
	        }
	        doneCallback();
	    });

};

module.exports.delete = function(grunt, filepath, containerName, pluralContainerName, doneCallback) {
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
		url = url + '/v1/organizations/' + org + '/'+pluralContainerName+'/';

		grunt.log.writeln('Found '+containerName+' files: '+ files.length + '. Removing same '+pluralContainerName+' from dest...');

		// perform deletion by MAX_ITEMS_AT_ONCE items in one async     
		async.forEachLimit(files, MAX_ITEMS_AT_ONCE, function(filepath, callback) {
			var content = grunt.file.read(filepath);
			var dev = JSON.parse(content);
			var del_url = url + dev.email;
			grunt.verbose.write(del_url);	
				request.del(del_url, function(error, response, body){
				  var status = 999;
				  if (response)	
					status = response.statusCode;
				  grunt.verbose.writeln('Resp [' + status + '] for '+containerName+' deletion ' + this.del_url + ' -> ' + body);
				  if (error || status!=200)
				  { 
				  	grunt.verbose.error('ERROR Resp [' + status + '] for '+containerName+' deletion ' + this.del_url + ' -> ' + body); 
				  	err_count++;
				  }
				  done_count++;
				  if (done_count == files.length)
				  {
					grunt.log.ok('Processed ' + done_count + ' '+pluralContainerName+'. Remove failed: ' + err_count);
					doneCallback();
				  }
				  callback();
				}.bind( {del_url: del_url}) ).auth(userid, passwd, true);
			}, function(err) {
	        if (err) {
				grunt.log.error(err);
	        	return doneCallback(false);
	        }
	        doneCallback();
	    });
};



// baseAppContainer.export = function(grunt, filepath) {
// 	};


// baseAppContainer.import = function(grunt) {
// 		var url = apigee.to.url;
// 		var org = apigee.to.org;
// 		var userid = apigee.to.userid;
// 		var passwd = apigee.to.passwd;
// 		var done_count = 0;
// 		var err_count =0;
// 		var files;
// 		url = url + '/v1/organizations/' + org + '/'+pluralContainerName;
		
// 		var done = this.async();
// 		var opts = {flatten: false};
// 		var f = grunt.option('src');
// 		if (f)
// 		{
// 			grunt.verbose.writeln('src pattern = ' + f);
// 			files = grunt.file.expand(opts,f);
// 		}
// 		else
// 		{
// 			files = this.filesSrc;
// 		}
// 		grunt.log.writeln('Found dev files: '+ files.length + '. Importing them to dest...');

// 		async.forEachLimit(files, MAX_ITEMS_AT_ONCE, function(filepath, callback) {
// 			grunt.log.writeln(filepath);
// 			var content = grunt.file.read(filepath);
// 			grunt.verbose.write(url);	
// 			request.post({
// 			  headers: {'Content-Type' : 'application/json'},
// 			  url:     url,
// 			  body:    content
// 			}, function(error, response, body){
// 					var status = 999;
// 					if (response)	
// 					 status = response.statusCode;
// 					grunt.verbose.writeln('Resp [' + status + '] for dev creation ' + this.url + ' -> ' + body);
// 					if (error || status!=201) {
// 					  	grunt.verbose.error('ERROR Resp [' + status + '] for dev creation ' + this.url + ' -> ' + body); 
// 					  	err_count++;
// 					}
// 					done_count++;
// 					if (done_count == files.length)
// 					{
// 						grunt.log.ok('Imported ' + done_count + ' '+pluralContainerName);
// 						done();
// 					}
// 					callback();
// 			}.bind( {url: url}) ).auth(userid, passwd, true);

// 	    }, function(err) {
// 	        if (err) {
// 				grunt.log.error(err);
// 	        	return done(false);
// 	        }
// 	        done();
// 	    });

// 	};

// baseAppContainer.delete = function(grunt) {
// 		var url = apigee.to.url;
// 		var org = apigee.to.org;
// 		var userid = apigee.to.userid;
// 		var passwd = apigee.to.passwd;
// 		var done_count = 0;
// 		var err_count = 0;
// 		var files = this.filesSrc;
// 		var opts = {flatten: false};
// 		var f = grunt.option('src');
// 		if (f)
// 		{
// 			grunt.verbose.writeln('src pattern = ' + f);
// 			files = grunt.file.expand(opts,f);
// 		}
// 		url = url + '/v1/organizations/' + org + '/'+pluralContainerName+'/';
// 		var done = this.async();
// 		grunt.log.writeln('Found dev files: '+ files.length + '. Removing same devs from dest...');

// 		// perform deletion by MAX_ITEMS_AT_ONCE devs in one async     
// 		async.forEachLimit(files, MAX_ITEMS_AT_ONCE, function(filepath, callback) {
// 			var content = grunt.file.read(filepath);
// 			var dev = JSON.parse(content);
// 			var del_url = url + dev.email;
// 			grunt.verbose.write(del_url);	
// 				request.del(del_url, function(error, response, body){
// 				  var status = 999;
// 				  if (response)	
// 					status = response.statusCode;
// 				  grunt.verbose.writeln('Resp [' + status + '] for dev deletion ' + this.del_url + ' -> ' + body);
// 				  if (error || status!=200)
// 				  { 
// 				  	grunt.verbose.error('ERROR Resp [' + status + '] for dev deletion ' + this.del_url + ' -> ' + body); 
// 				  	err_count++;
// 				  }
// 				  done_count++;
// 				  if (done_count == files.length)
// 				  {
// 					grunt.log.ok('Processed ' + done_count + ' '+pluralContainerName+'. Remove failed: ' + err_count);
// 					done();
// 				  }
// 				  callback();
// 				}.bind( {del_url: del_url}) ).auth(userid, passwd, true);
// 			}, function(err) {
// 	        if (err) {
// 				grunt.log.error(err);
// 	        	return done(false);
// 	        }
// 	        done();
// 	    });
// 	};


// };