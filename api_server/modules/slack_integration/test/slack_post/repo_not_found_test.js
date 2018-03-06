'use strict';

var SlackPostTest = require('./slack_post_test');
var ObjectID = require('mongodb').ObjectID;

class RepoNotFoundTest extends SlackPostTest {

	get description () {
		return 'should return an error when trying to send a slack post request with a repo ID that does not exist';
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
