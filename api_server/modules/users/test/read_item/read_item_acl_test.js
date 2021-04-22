'use strict';

const ReadItemTest = require('./read_item_test');

class ReadItemACLTest extends ReadItemTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return error when user attempts to set last item read for a post when that user is not a member of the stream to which the post belongs';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

}

module.exports = ReadItemACLTest;
