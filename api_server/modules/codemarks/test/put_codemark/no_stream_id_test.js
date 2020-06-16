'use strict';

const SetPostIdTest = require('./set_post_id_test');

class NoStreamIdTest extends SetPostIdTest {

	get description () {
		return 'should return an error if trying to update a codemark with a post ID but no stream ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'streamId'
		};
	}

	getCodemarkUpdateData () {
		const data = super.getCodemarkUpdateData();
		delete data.streamId;
		return data;
	}
}

module.exports = NoStreamIdTest;
