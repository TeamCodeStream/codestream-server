'use strict';

const SetPostIdTest = require('./set_post_id_test');
const RandomString = require('randomstring');

class NoUpdatePostIdTest extends SetPostIdTest {

	get description () {
		return 'should return an error if trying to update a codemark with a post ID and the post ID has already been set';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'codemark already has a post ID'
		};
	}

	getPostlessCodemarkData () {
		const data = super.getPostlessCodemarkData();
		Object.assign(data, {
			postId: RandomString.generate(8),
			streamId: RandomString.generate(8)
		});
		return data;
	}
}

module.exports = NoUpdatePostIdTest;
