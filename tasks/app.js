/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var async = require('async');
var apps;
var MAX_ITEMS_AT_ONCE = 50;
module.exports = function(grunt) {
	'use strict';
	grunt.registerTask('exportApps', 'Export all apps from org ' + apigee.from.org + ' [' + apigee.from.version + ']', function() {
		var url = apigee.from.url;
		var org = apigee.from.org;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get('exportApps.dest.data');
		var done_count =0;
		var apps_done_count =0;
		var err_count = 0;
		var dev_url;
		var done = this.async();

		var pluralAppContainerName = 'developers';

		var getItemFolderIdentity = function(itmDetails) 
		{
			if (pluralAppContainerName == 'developers')
				return itmDetails.email; 
			else if (pluralAppContainerName == 'companies')
				return itmDetails.name;

			return 'error';
		}

		grunt.verbose.write('getting '+pluralAppContainerName+'...' + url);
		url = url + '/v1/organizations/' + org + '/'+pluralAppContainerName;

		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
			    var devs =  JSON.parse(body);
			    grunt.log.writeln('Found ' + devs.length + ' '+pluralAppContainerName+'. Exporting their apps...')
			    async.forEachLimit(devs, MAX_ITEMS_AT_ONCE, function(devEmail, callback) {

			    	dev_url = url + '/' + devEmail;
			    	//Call developer details
					request(dev_url, function (dev_error, dev_response, dev_body) {
						if (!dev_error && dev_response.statusCode == 200) {
							//grunt.verbose.write(dev_body);
						    var item_detail =  JSON.parse(dev_body);
						    var itemFolderIdentity = getItemFolderIdentity(item_detail);
						    var item_folder = filepath + '/' + itemFolderIdentity;
						    var devFolderExists = false;
						    //Get developer Apps
						    var apps_url = url + '/' + itemFolderIdentity + '/apps?expand=true';
						    grunt.verbose.writeln(apps_url);
							request(apps_url, function (app_error, app_response, app_body) {
								if (!app_error && app_response.statusCode == 200) {
									
								    var apps_detail =  JSON.parse(app_body);
									grunt.verbose.write(app_body);
								    var apps = apps_detail.app;
								    //grunt.verbose.write(apps);
								    if (apps)
								    {
								  		if (apps.length > 0 && devFolderExists == false) { 
								  			grunt.file.mkdir(item_folder);
								  			devFolderExists = true;
								  			grunt.log.writeln('dev ' + devEmail + ' has ' + apps.length + ' apps, exporting...');
								  		}
									    for (var j = 0; j < apps.length; j++) {
									    	var app = apps[j];
									    	grunt.verbose.writeln(app);
									    	var file_name  = item_folder + '/' + app.appId;
									    	grunt.verbose.writeln('writing file: ' + file_name);
									    	grunt.file.write(file_name, JSON.stringify(app));
									    	apps_done_count++;
									    };
									}
								}
								else
								{
									grunt.log.error(error);
									err_count++;
								}
								done_count++;
								callback();
							}).auth(userid, passwd, true);
						}
						else
						{
							grunt.log.error(error);
						}

					}).auth(userid, passwd, true);
			    	// End Developer details

			    	}, function(err) {
			        if (err) {
						grunt.log.error(err);
			        	return done(false);
			        }
			        grunt.log.ok('Successfully processed ' + (done_count-err_count) + ' from ' + devs.length + ' '+pluralAppContainerName+'. Exported ' + apps_done_count + ' apps');
			        done();
			    });  
			} 
			else
			{
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
	});



	grunt.registerMultiTask('importApps', 'Import all apps to org ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {
		var url = apigee.to.url;
		var org = apigee.to.org;
		var userid = apigee.to.userid;
		var passwd = apigee.to.passwd;
		var done_count =0;
		var files;
		var pluralAppContainerName = 'companies';

		url = url + '/v1/organizations/' + org + '/'+pluralAppContainerName+'/';
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

		async.eachSeries(files, function (filepath,callback) {
			console.log(filepath);
			var folders = filepath.split('/');
			var dev = folders[folders.length - 2];
			var content = grunt.file.read(filepath);
			var app = JSON.parse(content);
			var appCredentials = app['credentials'];
			grunt.verbose.writeln('Creating app : ' + app.name + ' under developer ' + dev);

			delete app['appId'];
			delete app['status'];
			delete app['developerId'];
			delete app['lastModifiedAt'];
			delete app['lastModifiedBy'];
			delete app['createdAt'];
			delete app['createdBy'];
			delete app['status'];
			delete app['appFamily'];
			delete app['accessType'];
			delete app['credentials'];

			grunt.verbose.writeln(JSON.stringify(app));
			var app_url = url + dev + '/apps';
			grunt.verbose.writeln('Creating App ' + app_url);

			request.post({
			  headers: {'Content-Type' : 'application/json'},
			  url:     app_url,
			  body:    JSON.stringify(app)
			}, function(error, response, body) {
				try {
				  done_count++;
				  var cstatus = 999;
				  if (response)	
				  	  cstatus = response.statusCode;
				  if (cstatus == 200 || cstatus == 201)
				  {
					  grunt.verbose.writeln('Resp [' + response.statusCode + '] for create app  ' + this.app_url + ' -> ' + body);
					  var app_resp = JSON.parse(body);
					  var client_key = app_resp.credentials[0].consumerKey;
					  //grunt.verbose.writeln('deleting key -> ' + client_key);
			          //grunt.verbose.writeln('KEY Delete URL -> ' + delete_url);
			          
			          // Import app keys and secrets
			          appCredentials.forEach(function (appCredential){
				          var keySecretPair = {};
				          keySecretPair.consumerKey = appCredential.consumerKey;
				          keySecretPair.consumerSecret = appCredential.consumerSecret;
				          grunt.verbose.writeln(JSON.stringify(keySecretPair));
				          
				          var create_keys_url = app_url + '/' + app['name'] + '/keys/create';
				          grunt.verbose.writeln('creating keys, url: '+ create_keys_url);

				          request.post({
							  headers: {'Content-Type' : 'application/json'},
							  url:     create_keys_url,
							  body:    JSON.stringify(keySecretPair)
							}, function (error2, response2, body2){
							var cstatus = 999;
							if (response)	
								cstatus = response.statusCode;
							if (cstatus == 200 || cstatus == 201)
							{
								// Associate keys with product
								var assosiate_keys_url = app_url + '/' + app['name'] + '/keys/' + appCredential.consumerKey;
								var products = {};
								products.apiProducts = appCredential.apiProducts.map(function(apiProd){
									return apiProd.apiproduct;
								});

								request.post({
								headers: {'Content-Type' : 'application/json'},
								url:     assosiate_keys_url,
								body:    JSON.stringify(products)
								}, function (error3, response3, body3){
									var cstatus = 999;
									if (response)	
										cstatus = response.statusCode;
									if (cstatus == 200 || cstatus == 201) {
										// Delete the key generated when App is created
							      		var delete_url = app_url + '/' + app.name + '/keys/' + client_key;
							      		request.del(delete_url,function(error, response, body){
									    var status = 999;
									    if (response)	
									  	  status = response.statusCode;
									  	grunt.verbose.writeln('Resp [' + status + '] for key delete ' + this.delete_url + ' -> ' + body);
									  	if (error || status!=200 )
										  	grunt.log.error('ERROR Resp [' + status + '] for key delete ' + this.delete_url + ' -> ' + body); 
										if (done_count == files.length)
											{
												grunt.log.ok('Processed ' + done_count + ' apps');
												done();
											}
											callback();
										}.bind( {delete_url: delete_url}) ).auth(userid, passwd, true);
							      	  	// END of Key DELETE
									}
									else {
										grunt.verbose.writeln('ERROR Resp [' + response3.statusCode + '] for assosiate keys  ' + this.assosiate_keys_url + ' -> ' + body3);
										callback();
									}
								}.bind( {app_url: app_url}) ).auth(userid, passwd, true);
								// END assosiate key with product
							}
							else {
								grunt.verbose.writeln('ERROR Resp [' + response2.statusCode + '] for create keys  ' + this.create_keys_url + ' -> ' + body2);
								callback();
							}

							}.bind( {app_url: app_url}) ).auth(userid, passwd, true);
				          // END import app key and secret

			          });

		      	  }
		      	  else
		      	  {
		      	  	grunt.verbose.writeln('ERROR Resp [' + response.statusCode + '] for create app  ' + this.app_url + ' -> ' + body);
		      	  	callback();
		      	  }
				}
				catch(err)
				{
					grunt.log.error('ERROR - from App URL : ' + app_url );
					grunt.log.error(body);
				}

			}.bind( {app_url: app_url}) ).auth(userid, passwd, true);	


		});
		var done = this.async();
	});


	grunt.registerMultiTask('deleteApps', 'Delete all apps from org ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {
		var url = apigee.to.url;
		var org = apigee.to.org;
		var userid = apigee.to.userid;
		var passwd = apigee.to.passwd;
		var done_count =0;
		var files;
		var pluralAppContainerName = 'developers';

		url = url + '/v1/organizations/' + org + '/'+pluralAppContainerName+'/';
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
		var done = this.async();
		files.forEach(function(filepath) {
			grunt.verbose.writeln('processing file ' + filepath);
			var folders = filepath.split('/');
			var dev = folders[folders.length - 2];
			var content = grunt.file.read(filepath);
			var app = JSON.parse(content);
			var app_del_url = url + dev + '/apps/' + app.name;
			grunt.verbose.writeln(app_del_url);
			request.del(app_del_url,function(error, response, body){
			   var status = 999;
			   if (response)	
			    status = response.statusCode;
			  grunt.verbose.writeln('Resp [' + status + '] for delete app ' + this.app_del_url + ' -> ' + body);
			  done_count++;
			  if (error || status!=200)
			  	grunt.verbose.error('ERROR Resp [' + status + '] for delete app ' + this.app_del_url + ' -> ' + body); 
			  if (done_count == files.length)
			  {
				grunt.log.ok('Processed ' + done_count + ' apps');
				done();
			  }
			}.bind( {app_del_url: app_del_url}) ).auth(userid, passwd, true);	
		});

	});

};


Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i].name === a[j].name)
                a.splice(j--, 1);
        }
    }
    return a;
};