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
    debug('add incoming request to report', incomingEvent.id);

    unfulfilledSpanEventsServer[incomingEvent.id] = incomingEvent;
}

function reportOutgoingRequest(incomingEvent) {
    debug('add outgoing request to report', incomingEvent.id);
    unfulfilledSpanEventsClient[incomingEvent.id] = incomingEvent;

}

function reportIncomingResponse(incomingEvent) {
    if (!unfulfilledSpanEventsClient[incomingEvent.id]) {
        // TODO: do not throw
        throw new Error('no request id present ' + incomingEvent.id);
    }
    debug('add incoming response to report', incomingEvent.id);

    incomingEvent.annotations.unshift(unfulfilledSpanEventsClient[incomingEvent.id].annotations[0]);
    unfulfilledSpanEventsClient[incomingEvent.id] = incomingEvent;

    fulfillEvent(unfulfilledSpanEventsClient[incomingEvent.id]);

    delete unfulfilledSpanEventsClient[incomingEvent.id];

}

function reportOutgoingResponse(incomingEvent) {
    if (!unfulfilledSpanEventsServer[incomingEvent.id]) {
        // TODO: do not throw
        throw new Error('no request id present ' + incomingEvent.id);
    }
    debug('add outgoing response to report', incomingEvent.id);

    incomingEvent.annotations.unshift(unfulfilledSpanEventsServer[incomingEvent.id].annotations[0]);
    unfulfilledSpanEventsServer[incomingEvent.id] = incomingEvent;

    fulfillEvent(unfulfilledSpanEventsServer[incomingEvent.id]);

    delete unfulfilledSpanEventsServer[incomingEvent.id];

}

function fulfillEvent(event) {
    fulfilledSpanEvents.push(event);
}

function flush() {
    debug('flushing collections');

    // return var values and clear array
    return fulfilledSpanEvents.splice(0);
}
