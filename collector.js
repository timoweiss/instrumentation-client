'use strict';

const collectionRequestIn = [];
const collectionRequestOut = [];
const collectionResponseIn = [];
const collectionResponseOut = [];

module.exports = function(options) {

    

    return {
        reportIncommingRequest,
        reportOutgoingRequest,
        flush
    }
};

function reportIncommingRequest(todo) {
    console.log('add incomming request to report');
    collectionIn.push(todo);
}

function reportOutgoingRequest(todo) {
    console.log('add outgoing request to report');
    collectionOut.push(todo);
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