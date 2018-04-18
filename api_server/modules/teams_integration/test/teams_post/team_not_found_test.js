'use strict';

var TeamsPostTest = require('./teams_post_test');
var ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends TeamsPostTest {

	get description () {
		return 'should return an error when trying to send a teams post request with a team ID that does not exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'team'
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			this.data.teamId = ObjectID();	// generate random team ID
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
