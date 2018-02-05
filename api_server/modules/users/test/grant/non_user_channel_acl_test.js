'use strict';

var GrantTest = require('./grant_test');
var ObjectID = require('mongodb').ObjectID;

class NonUserChannelACLTest extends GrantTest {

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to the me-channel for a non-existent user';
	}

	setPath (callback) {
		this.path = '/grant/user-' + ObjectID();
		callback();
	}
}

module.exports = NonUserChannelACLTest;
