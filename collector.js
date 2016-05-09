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

function reportIncomingRequest(todo) {
    debug('add incoming request to report');

    spanEvents[todo.request_id] = todo;
}

function reportOutgoingRequest(todo) {
    debug('add outgoing request to report');
    spanEvents[todo.request_id] = todo;

}

function reportIncomingResponse(todo) {
    if(!spanEvents[todo.request_id]) {
        throw new Error('no request id present');
    }
    debug('add incoming response to report');

    todo.annotations.unshift(spanEvents[todo.request_id].annotations[0]);
    spanEvents[todo.request_id] = todo;

}

function reportOutgoingResponse(todo) {
    if(!spanEvents[todo.request_id]) {
        throw new Error('no request id present');
    }
    debug('add outgoing response to report');

    todo.annotations.unshift(spanEvents[todo.request_id].annotations[0]);
    spanEvents[todo.request_id] = todo;

}

function flush() {
    console.log('spanEvents', JSON.stringify(spanEvents));
    debug('flushing collections');

    let _spanEvents = spanEvents;
    spanEvents = {};
    return _spanEvents;
}
