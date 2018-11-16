'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const RandomString = require('randomstring');

class SetPostlessAssigneesTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
		this.codemarkType = 'issue';
	}

	get description () {
		return 'should return the updated codemark when updating an issue codemark with assignees, which is tied to a third-party provider';
	}

	getCodemarkUpdateData () {
		// for third-party provider codemarks, we can put anything we want in here,
		// it's only if we're not using third-party that the server will try to validate
		// that these are valid members of the team, and that can only happen through POST /posts
		const data = super.getCodemarkUpdateData();
		data.assignees = [
			RandomString.generate(10),
			RandomString.generate(10)
		];
		return data;
	}
}

module.exports = SetPostlessAssigneesTest;