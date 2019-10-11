'use strict';

const SetPostIdTest = require('./set_post_id_test');
const RandomString = require('randomstring');

class StreamIdRequiredTest extends SetPostIdTest {

	get description () {
		return 'should return an error if trying to update a codemark with a stream ID but no post ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'postId'
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

	makeCodemarkUpdateData (callback) {
		super.makeCodemarkUpdateData(() => {
			delete this.data.postId;
			callback();
		});
	}
}

module.exports = StreamIdRequiredTest;
