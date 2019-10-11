'use strict';

const SetCodeStreamPostIdTest = require('./set_codestream_post_id_test');
const RandomString = require('randomstring');

class IgnoreStreamIdTest extends SetCodeStreamPostIdTest {

	get description () {
		return 'when updating a postless codemark with codestream post ID, stream ID should be taken from the post and ignored if passed';
	}

	createPost (callback) {
		super.createPost(error => {
			if (error) { return callback(error); }
			this.data.streamId = RandomString.generate(10);
			callback();
		});
	}
}

module.exports = IgnoreStreamIdTest;