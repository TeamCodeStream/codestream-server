'use strict';

var GrantTest = require('./grant_test');
var ObjectID = require('mongodb').ObjectID;

class NonRepoChannelACLTest extends GrantTest {

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to the repo channel for a non-existent repo';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set to grant access to the channel for a non-existent repo
		this.path = '/grant/repo-' + ObjectID();
		callback();
	}
}

module.exports = NonRepoChannelACLTest;
