'use strict';

const SetPostlessAssigneesTest = require('./set_postless_assignees_test');
const RandomString = require('randomstring');

class UpdatePostlessAssigneesTest extends SetPostlessAssigneesTest {

	get description () {
		return 'should be ok to update an issue codemark, created for a third-party provider, with assignees that are not IDs of CodeStream users';
	}

	getCodemarkUpdateData () {
		const data = super.getCodemarkUpdateData();
		data.assignees.push(RandomString.generate(10));
		return data;
	}
}

module.exports = UpdatePostlessAssigneesTest;
