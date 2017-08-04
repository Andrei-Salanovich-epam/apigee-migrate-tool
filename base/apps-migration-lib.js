var request = require('request');
var apigee = require('../config.js');
var async = require('async');

var MAX_ITEMS_AT_ONCE = 50;

module.exports.export = function(grunt, filepath, info, done) {
    	var url = apigee.from.url;
		var org = apigee.from.org;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;		
		var done_count =0;
		var apps_done_count =0;
		var err_count = 0;
		var dev_url;

		grunt.verbose.write('getting ' + info.plural + '...' + url);
		url = url + '/v1/organizations/' + org + '/' + info.plural;       

		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
			    var items =  JSON.parse(body);
			    grunt.log.writeln('Found ' + items.length + ' ' + info.plural + '. Exporting their apps...')
			    async.forEachLimit(items, MAX_ITEMS_AT_ONCE, function(item, callback) {
                    var apps_url = url + '/' + item + '/apps?expand=true';
                    request(apps_url, function (app_error, app_response, app_body) {
                        if (!app_error && app_response.statusCode == 200) {                                
                            var apps_detail =  JSON.parse(app_body);
                            var item_folder = filepath + '/' + item;
                            var devFolderExists = false;
                            grunt.verbose.write(app_body);
                            var apps = apps_detail.app;								    
                            if (apps)
                            {
                                if (apps.length > 0 && !devFolderExists) { 
                                    grunt.file.mkdir(item_folder);
                                    devFolderExists = true;
                                    grunt.log.writeln('dev ' + item + ' has ' + apps.length + ' apps, exporting...');
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
							// grunt.log.error("[ERROR]: url %s response: %s body: %s", apps_url, JSON.stringify(app_response));
                            grunt.log.error(error);
                            err_count++;
                        }
                        done_count++;
                        callback();
                    }).auth(userid, passwd, true);


			    	}, function(err) {
			        if (err) {
						grunt.log.error(err);
			        	return done(false);
			        }
			        grunt.log.ok('Successfully processed ' + (done_count-err_count) + ' from ' + items.length + ' '+info.plural+'. Exported ' + apps_done_count + ' apps');
			        done();
			    });  
			} 
			else
			{
				grunt.log.error("[ERROR]: url %s response: %s ", url, response.statusCode);
			}
		}).auth(userid, passwd, true);        
};

module.exports.import = function(grunt, files, info, done) {
        var url = apigee.to.url;
		var org = apigee.to.org;
		var userid = apigee.to.userid;
		var passwd = apigee.to.passwd;
		var done_count =0;
		var files;

		url = url + '/v1/organizations/' + org + '/' + info.plural + '/';		
		var opts = {flatten: false};
		

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
};

module.exports.delete = function(grunt, files, info, done) {
    var url = apigee.to.url;
    var org = apigee.to.org;
    var userid = apigee.to.userid;
    var passwd = apigee.to.passwd;
    var done_count =0;    

    url = url + '/v1/organizations/' + org + '/' + info.plural  + '/';    
    var opts = { flatten: false };      
    if (files.length == 0) done();
    
    files.forEach(function(filepath) {
        grunt.verbose.writeln('processing file ' + filepath);
        var folders = filepath.split('/');
        var dev = folders[folders.length - 2];
        var content = grunt.file.read(filepath);
        var app = JSON.parse(content);
        var app_del_url = url + dev + '/apps/' + app.name;
        grunt.verbose.writeln(app_del_url);
        request.del(app_del_url, function(error, response, body){
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
};

module.exports.updateKey = function(grunt, files, info, done) {
	var url = apigee.to.url;
	var org = apigee.to.org;
	var userid = apigee.to.userid;
	var passwd = apigee.to.passwd;
	var done_count =0;
	var files;

	url = url + '/v1/organizations/' + org + '/' + info.plural + '/';  
	var opts = {flatten: false};
	

	async.eachSeries(files, function (filepath,callback) {
		console.log(filepath);
		var folders = filepath.split('/');
		var dev = folders[folders.length - 2];
		var content = grunt.file.read(filepath);
		var app = JSON.parse(content);
		var appCredentials = app['credentials'];
		grunt.verbose.writeln('Updating app : ' + app.name + ' under developer ' + dev);

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

		// Import app keys and secrets
		async.each(appCredentials, function (appCredential, credCallback){
			var app_url = url + dev + '/apps/' + app.name + '/keys/' + appCredential.consumerKey;
			grunt.verbose.writeln('Updating App Key' + app_url);

			request.post({
					headers: {'Content-Type' : 'application/json'},
					url:     app_url,
					body:    JSON.stringify({ apiProducts: ["Provisioning"], attributes: app.attributes})
				}, 
				function (error, response, body) {
					var cstatus = 999;
					if (response) cstatus = response.statusCode;
						grunt.verbose.writeln('Resp [' + cstatus + '] for key update ' + app_url);

					if (cstatus >= 300){
						grunt.log.error('Error: ' + error);
					}					
					callback();
			}.bind( {app_url: app_url})).auth(userid, passwd, true);
		});
	},  function(error) { done(); })
};


module.exports.deleteProductKey = function(grunt, files, info, done) {
	var url = apigee.to.url;
	var org = apigee.to.org;
	var userid = apigee.to.userid;
	var passwd = apigee.to.passwd;
	var done_count =0;
	var files;

	url = url + '/v1/organizations/' + org + '/' + info.plural + '/';  
	var opts = {flatten: false};
	

	async.eachSeries(files, function (filepath,callback) {
		console.log(filepath);
		var folders = filepath.split('/');
		var dev = folders[folders.length - 2];
		var content = grunt.file.read(filepath);
		var app = JSON.parse(content);
		var appCredentials = app['credentials'];
		grunt.verbose.writeln('Updating app : ' + app.name + ' under developer ' + dev);

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

		// Import app keys and secrets
		async.each(appCredentials, function (appCredential, credCallback){
			var app_url = url + dev + '/apps/' + app.name + '/keys/' + appCredential.consumerKey + '/apiproducts/Provisioning%20APIs';
			grunt.verbose.writeln('Updating App Key' + app_url);

			request.del({
					headers: {'Content-Type' : 'application/json'},
					url:     app_url					
				}, 
				function (error, response, body) {
					var cstatus = 999;
					if (response) cstatus = response.statusCode;
						grunt.verbose.writeln('Resp [' + cstatus + '] for key update ' + app_url);

					if (cstatus >= 300){
						grunt.log.error('Error: ' + error);
					}					
					callback();
			}.bind( {app_url: app_url})).auth(userid, passwd, true);
		});
	},  function(error) { done(); })
};