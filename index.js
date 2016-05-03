'use strict';
require('./senecaShim').start({application_id: 'index'});


const s = require('seneca')();

s.use('mesh', {auto: true});


s.use(function (options) {
    // this.add('role:user', function (args, callback) {
    //     callback(null, args)
    // });


    return {name: 'plugin-name-index'}

});
setInterval(function () {
    // async test
    s.act({role: 'service', cmd: 'something'}, {aa: 'cc'})

}, 5000);


// // add this to the VERY top of the first file loaded in your app
// var opbeat = require('opbeat').start({
//     appId: '98a4f007a4',
//     organizationId: 'b025a041fa684f1a8f7961baa1c9d94e',
//     secretToken: '8bb39d48d0b135011607ecc7a82550d1c5406717'
// });
//
//
//
// const Hapi = require('hapi');
//
// // Create a server with a host and port
// const server = new Hapi.Server();
// server.connection({
//     host: 'localhost',
//     port: 8000
// });
//
// // Add the route
// server.route({
//     method: 'GET',
//     path:'/hello',
//     handler: function (request, reply) {
//
//         return reply('hello world');
//     }
// });
//
// // Start the server
// server.start((err) => {
//
//     if (err) {
//         throw err;
//     }
//     console.log('Server running at:', server.info.uri);
// });