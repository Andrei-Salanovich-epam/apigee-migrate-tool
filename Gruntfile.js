var apigee = require('./config.js');
module.exports = function(grunt) {

 //require('time-grunt')(grunt);
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    availabletasks: {           // task 
            tasks: {options: {
            filter: 'exclude',
            tasks: ['mkdir', 'availabletasks', 'warn', 'default']
        }}               // target 
        },
    exportDevs: {
       dest: './data/devs'       
    },    
    exportProducts: {
       dest: './data/products'       
    },
    exportDevApps: {
       dest: './data/apps/dev'
    },   
    exportCompanyApps: {
       dest: './data/apps/company'       
    },
    exportProxies: {
       dest: './data/proxies'       
    },
    exportOrgKVM: {
       dest: './data/kvm/org'       
    },
    exportEnvKVM: {
       dest: './data/kvm/env'       
    },
    exportProxyKVM: {
       dest: './data/kvm/proxy'       
    },
    exportCompanies: {
       dest: './data/companies'       
    },
    importProxies: {
        src: './data/proxies/*.zip'
    },
    importProducts: {
        src: 'data/products/*'
    },   
    importDevs: {
        src: 'data/devs/*'
    },
    importDevApps: {
        src: 'data/apps/dev/*/*'
    },
    importDevCompanies: {
        src: 'data/devs/*'
    },
    updateDevApps: {
        src: 'data/apps/dev/*/*'
    },
    deleteDevAppsProduct: {
        src: 'data/apps/dev/*/*'
    },    
    importCompanyApps: {
        src: 'data/apps/company/*/*'
    },
    updateCompanyApps: {
        src: 'data/apps/company/*/*'
    },
    deleteCompanyAppsProduct: {
        src: 'data/apps/company/*/*'
    },
    importKeys: {
        src: 'data/apps/*/*'
    },
    importOrgKVM: {
        src: 'data/kvm/org/*'       
    },
    importEnvKVM: {
        src: 'data/kvm/env/*/*'
    },
    importProxyKVM: {
        src: 'data/kvm/proxy/*/*'
    },
    importCompanies: {
        src: 'data/companies/*'
    },
    deleteKeys: {
        src: 'data/apps/*/*'
    },
    deleteDevApps: {
        src: 'data/apps/dev/*/*'
    },
    deleteCompanyApps: {
        src: 'data/apps/company/*/*'
    },
    deleteProducts: {
        src: 'data/products/*'
    },
    deleteDevs: {
        src: './data/devs/*'       
    },
    deleteProxies: {
        src: './data/proxies/*'
    },
    deleteOrgKVM: {
        src: './data/kvm/org/*'
    },
    deleteEnvKVM: {
        src: './data/kvm/env/*/*'
    },
    deleteProxyKVM: {
        src: './data/kvm/proxy/*/*'
    },
    deleteCompanies: {
        src: 'data/companies/*'
    }
  });

  require('load-grunt-tasks')(grunt);
  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['availabletasks']);
  grunt.registerTask('exportAll', ['exportDevs','exportCompanies','exportProducts','exportDevApps','exportCompanyApps', 'exportProxies', 'exportOrgKVM', 'exportEnvKVM', 'exportProxyKVM']);
  grunt.registerTask('importAll', ['importProxies','importDevs','importCompanies','importProducts', 'importDevApps', 'importCompanyApps', 'importOrgKVM', 'importEnvKVM', 'importProxyKVM']);
  grunt.registerTask('deleteAll', ['warn','deleteDevApps', 'deleteCompanyApps' ,'deleteCompanies','deleteProducts', 'deleteDevs', 'deleteProxies', 'deleteOrgKVM', 'deleteEnvKVM', 'deleteProxyKVM']);  

  grunt.registerTask('warn', 'Display Warning', function() {
      var readline = require('readline');
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      var done = this.async();
      rl.question('THIS SCRIPT WILL DELETE ONE OR MORE RESOURCES will be deleted from the org - ' + apigee.to.org + ' [' + apigee.to.version + '].' + ' THIS ACTION CANNOT BE ROLLBACK. Do you want to continue (yes/no) ? ', function(answer) {
        if (answer.match(/^y(es)?$/i))
          done(true);
        else
           done(false);
      });
  });

};