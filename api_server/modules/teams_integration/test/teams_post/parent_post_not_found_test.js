'use strict';

var TeamsPostTest = require('./teams_post_test');
var ObjectID = require('mongodb').ObjectID;

class ParentPostNotFoundTest extends TeamsPostTest {

	get description () {
		return 'should return an error when trying to send a teams post request with a parent post ID that does not exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'parent post'
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			this.data.parentPostId = ObjectID();	// generate random parent post ID
			callback();
		});
	}
}

module.exports = ParentPostNotFoundTest;
