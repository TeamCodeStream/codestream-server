'use strict';

const GrantTest = require('./grant_test');
const ObjectID = require('mongodb').ObjectID;

class NonStreamChannelACLTest extends GrantTest {

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to the stream channel for a non-existent stream';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		throw 'stream channels are deprecated';
		// set to grant access to the channel for a non-existent stream
		this.path = '/grant/stream-' + ObjectID();
		callback();
	}
}

module.exports = NonStreamChannelACLTest;
