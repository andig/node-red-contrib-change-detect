var change = require('../change-detect.js');
var mock = require('node-red-contrib-mock-node');
var clone = require('clone');


describe("getFromMessage() function tests", function() {
	var node = mock(change);

	it("Should return default value if path not defined", function() {
		expect(node.getFromMessage({}, undefined, 'default')).toEqual('default');
		expect(node.getFromMessage({
			ts: 'foo'
		}, undefined, 'default')).toEqual('default');
	});

	it("Should handle path exception correctly", function() {
		var errorFunction = spyOn(node, 'error');

		expect(node.getFromMessage(undefined, undefined, undefined)).toEqual(undefined);
		expect(errorFunction).toHaveBeenCalledTimes(1);
	});

	it("Should handle value exception correctly", function() {
		var errorFunction = spyOn(node, 'error');

		expect(node.getFromMessage({
		}, 'ts', undefined)).toEqual(undefined);
		expect(errorFunction).toHaveBeenCalledTimes(1);

		expect(node.getFromMessage({
		}, 'ts.ts', undefined)).toEqual(undefined);
		expect(errorFunction).toHaveBeenCalledTimes(2);
	});

	it("Should handle path correctly", function() {
		expect(node.getFromMessage({
			ts: 'foo'
		}, undefined, 'default')).toEqual('default');
		expect(node.getFromMessage({
			ts: 'foo'
		}, 'ts', 'default')).toEqual('foo');
		expect(node.getFromMessage({
			ts: 'foo'
		}, 'msg.ts', 'default')).toEqual('foo');
	});
});

describe("resolve() function tests", function() {
	var node = mock(change);

	it("Should return the message", function() {
		var msg = {
			foo: 'foo'
		};

		var contextFunction = spyOn(node, 'context').and.returnValue({
			set: function() {}
		});
		var sendFunction = spyOn(node, 'send');

		node.resolve(clone(msg));

		expect(contextFunction).toHaveBeenCalled();
		expect(sendFunction).toHaveBeenCalledWith(msg);
	});
});

describe("reject() function tests", function() {
	var node = mock(change);

	it("Should return nothing", function() {
		var msg = {
			foo: 'foo'
		};

		var contextFunction = spyOn(node, 'context').and.returnValue({
			set: function() {}
		});
		var sendFunction = spyOn(node, 'send');

		node.reject(clone(msg));

		expect(contextFunction).toHaveBeenCalledTimes(0);
		expect(sendFunction).toHaveBeenCalledWith([null, msg]);
	});
});
