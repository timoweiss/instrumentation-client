'use strict';
require('./senecaShim').start({application_id: '_service', service_name: 'service_service'});

const s = require('seneca')();

s.use(function(opts) {

    s.add('role:service,cmd:something', function(args, callback) {
        callback(null, {from:'function1'})

        // this.act({cmd:'somethingelse', role:'service'});

    });


    s.add({cmd:'somethingelse', role:'service'}, function(args, callback) {

        callback(null, {from:'function2'})

    });
    return {name: 'plugin-name-service'}
});

s.use('mesh', {base:true, pins: ['role:service']});
