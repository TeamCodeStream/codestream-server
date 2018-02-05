'use strict';

var GrantTest = require('./grant_test');
var ObjectID = require('mongodb').ObjectID;

class NonStreamChannelACLTest extends GrantTest {

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to the stream channel for a non-existent stream';
	}

	setPath (callback) {
		this.path = '/grant/stream-' + ObjectID();
		callback();
	}
}

module.exports = NonStreamChannelACLTest;
