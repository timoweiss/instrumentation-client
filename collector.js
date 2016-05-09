'use strict';

const debug = require('debug')('collector');

let spanEvents = {};

module.exports = function(options) {

    return {
        reportIncomingRequest,
        reportOutgoingRequest,
        reportIncomingResponse,
        reportOutgoingResponse,
        flush
    }
};

function reportIncomingRequest(incomingEvent) {
    debug('add incoming request to report');

    spanEvents[incomingEvent.request_id] = incomingEvent;
}

function reportOutgoingRequest(incomingEvent) {
    debug('add outgoing request to report');
    spanEvents[incomingEvent.request_id] = incomingEvent;

}

function reportIncomingResponse(incomingEvent) {
    if(!spanEvents[incomingEvent.request_id]) {
        throw new Error('no request id present');
    }
    debug('add incoming response to report');

    incomingEvent.annotations.unshift(spanEvents[incomingEvent.request_id].annotations[0]);
    spanEvents[incomingEvent.request_id] = incomingEvent;

}

function reportOutgoingResponse(incomingEvent) {
    if(!spanEvents[incomingEvent.request_id]) {
        throw new Error('no request id present');
    }
    debug('add outgoing response to report');

    incomingEvent.annotations.unshift(spanEvents[incomingEvent.request_id].annotations[0]);
    spanEvents[incomingEvent.request_id] = incomingEvent;

}

function flush() {
    console.log('spanEvents', JSON.stringify(spanEvents));
    debug('flushing collections');

    let _spanEvents = spanEvents;
    spanEvents = {};
    return _spanEvents;
}
