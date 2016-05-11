'use strict';

const microtime = require('microtime');


const Agent = (config) => {
    const application_id = config.application_id;
    const service_name = config.service_name;
    const orga_id = config.orga_id;

    return {
        getServiceInformation : () => ({
            application_id: application_id,
            service_name: service_name,
            orga_id: orga_id,
            process_info: {
                pid: process.pid
            }
        }),
        whatTimeIsIt: getMillis
    }
};

function getMillis() {
    return microtime.now();
}

module.exports = Agent;
