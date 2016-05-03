'use strict';

const collectionIn = [];
const collectionOut = [];

module.exports = {
    reportIncommingRequest,
    reportOutgoingRequest,
    flush
};

function reportIncommingRequest(todo) {
    collectionIn.push(todo);
}

function reportOutgoingRequest(todo) {
    collectionOut.push(todo);
}

function flush() {
    const snapshot = {
        in: collectionIn.slice(0),
        out: collectionOut.slice(0)
    }
    collectionIn.length = 0;
    collectionOut.length = 0;
    return snapshot
}

setInterval(function() {
    console.log('flushing', flush());
}, 10000);