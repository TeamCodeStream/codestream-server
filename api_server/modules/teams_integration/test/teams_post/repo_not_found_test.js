'use strict';

var TeamsPostTest = require('./teams_post_test');
var ObjectID = require('mongodb').ObjectID;

class RepoNotFoundTest extends TeamsPostTest {

	get description () {
		return 'should return an error when trying to send a teams post request with a repo ID that does not exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			this.data.repoId = ObjectID();	// generate random repo ID
			callback();
		});
	}
}

module.exports = RepoNotFoundTest;
