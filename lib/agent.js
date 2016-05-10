'use strict';

const microtime = require('microtime');


function Agent(config) {
    this.application_id = config.application_id;
    this.service_name = config.service_name;
    this.orga_id = config.orga_id;
}

Agent.prototype.getServiceInformation = function _getServiceInformation() {
    return {
        application_id: this.application_id,
        service_name: this.service_name,
        orga_id: this.orga_id,
        process_info: {
            pid: process.pid
        }
    }
};

Agent.prototype.whatTimeIsIt = function getMillis() {
    return microtime.now();
};

module.exports = Agent;
