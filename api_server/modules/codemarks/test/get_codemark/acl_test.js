'use strict';

const GetCodeMarkTest = require('./get_codemark_test');

class ACLTest extends GetCodeMarkTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
	}

	get description () {
		return `should return an error when trying to fetch an codemark from a ${this.type} stream that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTest;
