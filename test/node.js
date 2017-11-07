var change = require('../change-detect.js');
var mock = require('node-red-contrib-mock-node');
var clone = require('clone');

function expectInputToPass(node, msg) {
    var msgCount = node.sent().length;
    node.emit('input', clone(msg));
    expect(node.sent().length).toBe(msgCount+1);
    expect(node.sent(node.sent().length-1)).toEqual(msg);
}

function expectInputToSkip(node, msg) {
    var msgCount = node.sent().length;
    node.emit('input', clone(msg));
    expect(node.sent().length).toBe(msgCount+1);
    expect(node.sent(node.sent().length-1)).toEqual([null, msg]);
}

function setContext(node, topic, value) {
    var ctx = '_delta_';
    node.context().set(ctx + topic, value);
}

describe("Basic tests", function() {
    var node = mock(change, {
    });

    it("Should pass input", function() {
        var msg = {
            topic: 'topic', 
            payload: 'payload'
        };

        expectInputToPass(node, msg);
    });

    node = mock(change, {
        timestampPath: 'msg.ts',
        identifierPath: 'msg.topic',
        valuePath: 'msg.value'
    });

    it("Should get path components from config", function() {
        var msg = {
            topic: 'topic', 
            value: 100
        };

        var baseTime = new Date(2017, 1, 1);
        jasmine.clock().mockDate(baseTime);

        var spy = spyOn(node, 'getFromMessage');
        node.emit('input', clone(msg));

        expect(spy).toHaveBeenCalledWith(msg, 'msg.ts', baseTime.valueOf());
        expect(spy).toHaveBeenCalledWith(msg, 'msg.topic');
        expect(spy).toHaveBeenCalledWith(msg, 'msg.value');
    });
});

describe("OR minTime tests", function() {
    var node = mock(change, {
        changeDetectionMode: 'OR',
        minTime: 10,
        timestampPath: 'msg.ts'
    });

    it("Should pass initial msg", function() {
        var msg = {
            topic: 'topic', 
            ts: 100,
            payload: 100
        };

        expectInputToPass(node, msg);
    });

    it("Should pass msg with ts >= minTime", function() {
        setContext(node, 'topic', {
            timestamp: 100,
            value: 100
        });

        var msg = {
            topic: 'topic', 
            ts: 110,
            payload: 100
        };

        expectInputToPass(node, msg);
    });

    it("Should skip msg with ts < minTime", function() {
        setContext(node, 'topic', {
            timestamp: 100,
            value: 100
        });

        var msg = {
            topic: 'topic', 
            ts: 105,
            payload: 100
        };
        expectInputToSkip(node, msg);
    });

    it("Should not have updated state for skipped msg with ts < minTime", function() {
        var msg = {
            topic: 'topic', 
            ts: 110,
            payload: 100
        };

        expectInputToPass(node, msg);
    });
});

describe("OR minDelta tests", function() {
    var node = mock(change, {
        changeDetectionMode: 'OR',
        minDelta: 10,
        timestampPath: 'msg.ts'
    });

    it("Should pass initial msg", function() {
        var msg = {
            topic: 'topic', 
            ts: 100,
            payload: 100
        };

        expectInputToPass(node, msg);
    });

    it("Should pass msg with payload >= minDelta", function() {
        setContext(node, 'topic', {
            timestamp: 100,
            value: 100
        });

        var msg = {
            topic: 'topic', 
            ts: 100,
            payload: 110
        };

        expectInputToPass(node, msg);
    });

    it("Should skip msg with payload < minDelta", function() {
        setContext(node, 'topic', {
            timestamp: 100,
            value: 100
        });

        var msg = {
            topic: 'topic', 
            ts: 100,
            payload: 105
        };

        expectInputToSkip(node, msg);
    });

    it("Should not have updated state for skipped msg with payload < minDelta", function() {
        var msg = {
            topic: 'topic', 
            ts: 100,
            payload: 110
        };

        expectInputToPass(node, msg);
    });
});

describe("OR maxTime tests", function() {
    var node = mock(change, {
        changeDetectionMode: 'OR',
        minDelta: 10,
        maxTime: 10,
        timestampPath: 'msg.ts'
    });

    it("Should pass msg with value < minDelta && ts >= maxTime", function() {
        setContext(node, 'topic', {
            timestamp: 100,
            value: 100
        });

        var msg = {
            topic: 'topic', 
            ts: 120,
            payload: 100
        };

        expectInputToPass(node, msg);
    });
});

describe("AND minTime/minDelta tests", function() {
    var node = mock(change, {
        changeDetectionMode: 'AND',
        minTime: 10,
        minDelta: 10,
        timestampPath: 'msg.ts'
    });

    it("Should pass initial msg", function() {
        var msg = {
            topic: 'topic', 
            ts: 100,
            payload: 100
        };

        expectInputToPass(node, msg);
    });

    it("Should skip msg with ts >= minTime", function() {
        setContext(node, 'topic', {
            timestamp: 100,
            value: 100
        });

        var msg = {
            topic: 'topic', 
            ts: 110,
            payload: 100
        };

        expectInputToSkip(node, msg);
    });

    it("Should skip msg with delta >= minDelta", function() {
        setContext(node, 'topic', {
            timestamp: 100,
            value: 100
        });

        var msg = {
            topic: 'topic', 
            ts: 100,
            payload: 110
        };

        expectInputToSkip(node, msg);
    });

    it("Should pass msg with ts >= minTime && delta >= minDelta", function() {
        setContext(node, 'topic', {
            timestamp: 100,
            value: 100
        });

        var msg = {
            topic: 'topic', 
            ts: 110,
            payload: 110
        };

        expectInputToPass(node, msg);
    });
});

describe("AND maxTime tests", function() {
    var node = mock(change, {
        changeDetectionMode: 'AND',
        minDelta: 10,
        maxTime: 10,
        timestampPath: 'msg.ts'
    });

    it("Should pass msg with value < minDelta && ts >= maxTime", function() {
        setContext(node, 'topic', {
            timestamp: 100,
            value: 100
        });

        var msg = {
            topic: 'topic', 
            ts: 120,
            payload: 100
        };

        expectInputToPass(node, msg);
    });
});
