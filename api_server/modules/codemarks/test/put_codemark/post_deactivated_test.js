'use strict';

const SetCodeStreamPostIdTest = require('./set_codestream_post_id_test');

class PostDeactivatedTest extends SetCodeStreamPostIdTest {

	get description () {
		return 'should return an error when trying to connect a codemark to a post that has been deactivated';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'post'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'delete',
					path: '/posts/' + this.post.id,
					token: this.token
				},
				callback
			);
		});
	}
}

module.exports = PostDeactivatedTest;
