'use strict';

var ACLTest = require('./acl_test');

class ACLStreamTest extends ACLTest {

	constructor (options) {
		// modify the base ACLTest...
		super(options);
		this.withoutMeInStream = true;	// i won't be in the stream in which i'll attempt to create a post
	}

	get description () {
		return `should return an error when trying to create a post in a stream that i\'m not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'not authorized for stream'
		};
	}
}

module.exports = ACLStreamTest;
