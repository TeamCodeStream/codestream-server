'use strict';

const GetChangesetsTest = require('./get_changesets_test');

class ACLTest extends GetChangesetsTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
	}

	get description () {
		return `should return an error when trying to fetch a changeset for a review from a ${this.type} stream that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	 // readAuth
		};
	}
}

module.exports = ACLTest;
