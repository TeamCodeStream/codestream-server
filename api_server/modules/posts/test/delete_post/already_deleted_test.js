'use strict';

const DeletePostTest = require('./delete_post_test');

class AlreadyDeletedTest extends DeletePostTest {

	get description () {
		return 'should return an error when trying to delete a post that has already been deleted';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1014'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// delete the post, ahead of time...
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

module.exports = AlreadyDeletedTest;
