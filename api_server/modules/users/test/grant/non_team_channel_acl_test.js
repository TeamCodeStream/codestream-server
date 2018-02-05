'use strict';

var GrantTest = require('./grant_test');
var ObjectID = require('mongodb').ObjectID;

class NonTeamChannelACLTest extends GrantTest {

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to the team channel for a non-existent team';
	}

	setPath (callback) {
		this.path = '/grant/team-' + ObjectID();
		callback();
	}
}

module.exports = NonTeamChannelACLTest;
