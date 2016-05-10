'use strict';

const debug = require('debug')('collector');

let unfulfilledSpanEventsServer = {};
let unfulfilledSpanEventsClient = {};
let fulfilledSpanEvents = [];

module.exports = {
    reportIncomingRequest,
    reportOutgoingRequest,
    reportIncomingResponse,
    reportOutgoingResponse,
    flush
};


function reportIncomingRequest(incomingEvent) {
    debug('add incoming request to report', incomingEvent.request_id);

    unfulfilledSpanEventsServer[incomingEvent.request_id] = incomingEvent;
}

function reportOutgoingRequest(incomingEvent) {
    debug('add outgoing request to report', incomingEvent.request_id);
    unfulfilledSpanEventsClient[incomingEvent.request_id] = incomingEvent;

}

function reportIncomingResponse(incomingEvent) {
    if (!unfulfilledSpanEventsClient[incomingEvent.request_id]) {
        // TODO: do not throw
        throw new Error('no request id present ' + incomingEvent.request_id);
    }
    debug('add incoming response to report', incomingEvent.request_id);

    incomingEvent.annotations.unshift(unfulfilledSpanEventsClient[incomingEvent.request_id].annotations[0]);
    unfulfilledSpanEventsClient[incomingEvent.request_id] = incomingEvent;

    fulfilledSpanEvents.push(unfulfilledSpanEventsClient[incomingEvent.request_id]);
    delete unfulfilledSpanEventsClient[incomingEvent.request_id];

}

function reportOutgoingResponse(incomingEvent) {
    if (!unfulfilledSpanEventsServer[incomingEvent.request_id]) {
        // TODO: do not throw
        throw new Error('no request id present ' + incomingEvent.request_id);
    }
    debug('add outgoing response to report', incomingEvent.request_id);

    incomingEvent.annotations.unshift(unfulfilledSpanEventsServer[incomingEvent.request_id].annotations[0]);
    unfulfilledSpanEventsServer[incomingEvent.request_id] = incomingEvent;

    fulfilledSpanEvents.push(unfulfilledSpanEventsServer[incomingEvent.request_id]);
    delete unfulfilledSpanEventsServer[incomingEvent.request_id];

}

function flush() {
    debug('flushing collections');

    // return var values and clear array
    return fulfilledSpanEvents.splice(0);
}
