'use strict';

const collectionRequestIn = [];
const collectionRequestOut = [];
const collectionResponseIn = [];
const collectionResponseOut = [];

module.exports = function(options) {

    

    return {
        reportIncommingRequest,
        reportOutgoingRequest,
        reportIncommingResponse,
        reportOutgoingResponse,
        flush
    }
};

function reportIncommingRequest(todo) {
    console.log('add incomming request to report');
    collectionRequestIn.push(todo);
}

function reportOutgoingRequest(todo) {
    console.log('add outgoing request to report');
    collectionRequestOut.push(todo);
}

function reportIncommingResponse(todo) {
    console.log('add incomming request to report');
    collectionResponseIn.push(todo);
}

function reportOutgoingResponse(todo) {
    console.log('add outgoing request to report');
    collectionResponseOut.push(todo);
}

function flush() {
    const snapshot = {
        inRequest: collectionRequestIn.slice(0),
        outRequest: collectionRequestOut.slice(0),
        inResponse: collectionResponseIn.slice(0),
        outResponse: collectionResponseOut.slice(0)
    }
    collectionRequestIn.length = 0;
    collectionRequestOut.length = 0;
    collectionResponseIn.length = 0;
    collectionResponseOut.length = 0;
    return snapshot
}

// setInterval(function() {
//     console.log('flushing', flush());
// }, 10000);