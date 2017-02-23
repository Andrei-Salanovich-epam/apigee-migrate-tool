/*jslint node: true */
var MAX_ITEMS_AT_ONCE = 50;
var apigee = require('../config.js');

var migration = require('../base/apps-migration-lib');

var developerAppsInfo = {
	single: 'developer',
	plural: 'developers'
};

var companyAppsInfo = {
	single: 'company',
	plural: 'companies'
};

module.exports = function(grunt) {
	'use strict';
	grunt.registerTask('exportDevApps', 'Export all apps from org ' + apigee.from.org + ' [' + apigee.from.version + ']', function() {
		var filepath = grunt.config.get('exportDevApps.dest.data');
		var done = this.async();
		migration.export(grunt, filepath, developerAppsInfo, done);
		
	});

	grunt.registerTask('exportCompanyApps', 'Export all apps from org ' + apigee.from.org + ' [' + apigee.from.version + ']', function() {
		var filepath = grunt.config.get('exportCompanyApps.dest.data');
		var done = this.async();
		migration.export(grunt, filepath, companyAppsInfo, done);		
	});

	grunt.registerMultiTask('deleteDevApps', 'Delete all apps from org ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {
		var files;		
		var done = this.async();
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

		migration.delete(grunt, files, developerAppsInfo, done);
	});

	grunt.registerMultiTask('deleteCompanyApps', 'Delete all apps from org ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {
		var files;		
		var done = this.async();
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

		migration.delete(grunt, files, companyAppsInfo, done);
	});

	grunt.registerMultiTask('importDevApps', 'Import all apps to org ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {		
		var done = this.async();
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
		migration.import(grunt, files, developerAppsInfo, done);
	});

	grunt.registerMultiTask('updateDevApps', 'Update Dev keys product link ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {		
		var done = this.async();
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
		migration.updateKey(grunt, files, developerAppsInfo, done);
	});

	grunt.registerMultiTask('importCompanyApps', 'Import all apps to org ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {		
		var done = this.async();
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
		migration.import(grunt, files, companyAppsInfo, done);
	});

	grunt.registerMultiTask('updateCompanyApps', 'Update Company keys product link ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {		
		var done = this.async();
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
		migration.updateKey(grunt, files, companyAppsInfo, done);
	});

	grunt.registerMultiTask('deleteCompanyAppsProduct', 'Delete appkeys from product ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {		
		var done = this.async();
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
		migration.deleteProductKey(grunt, files, companyAppsInfo, done);
	});

	grunt.registerMultiTask('deleteDevAppsProduct', 'Delete appkeys from product ' + apigee.to.org + ' [' + apigee.to.version + ']', function() {		
		var done = this.async();
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
		migration.deleteProductKey(grunt, files, developerAppsInfo, done);
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