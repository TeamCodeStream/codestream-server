'use strict';

var GetRepoTest = require('./get_repo_test');

class ACLTest extends GetRepoTest {

	constructor (options) {
		super(options);
		this.withoutMe = true;
	}

	get description () {
		return 'should return an error when trying to fetch a repo for a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	setPath (callback) {
		this.path = '/repos/' + this.otherRepo._id;
		callback();
	}
}

module.exports = ACLTest;
