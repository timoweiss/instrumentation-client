'use strict';

const debug = require('debug')('collector');

let unfulfilledSpanEventsServer = {};
let unfulfilledSpanEventsClient = {};
let preferredNames = {};
let fulfilledSpanEvents = [];

module.exports = {
    setPreferredNameForIncomingRequest,
    reportIncomingRequest,
    reportOutgoingRequest,
    reportIncomingResponse,
    reportOutgoingResponse,
    flush
};

function setPreferredNameForIncomingRequest(id, name) {
    if(unfulfilledSpanEventsServer[id]) {
        preferredNames[id] = name;
    } else {
        console.log('there was no such event for id:', id, name);
    }
}


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
    if(event.id && preferredNames[event.id]) {
        console.log('setting preferredName for', event.id, event.name, 'to', preferredNames[event.id]);
        event.name = preferredNames[event.id];
    }
    fulfilledSpanEvents.push(event);
}

function flush() {
    debug('flushing collections');

    // return var values and clear array
    const bag = fulfilledSpanEvents.splice(0);
    debug('flushing', bag);
    return bag;
}
