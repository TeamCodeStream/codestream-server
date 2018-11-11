'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');

class AlreadyDeletedTest extends DeleteCodemarkTest {

	get description () {
		return 'should return an error when trying to delete a codemark that has already been deleted';
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
			// delete the codemark, ahead of time...
			this.doApiRequest(
				{
					method: 'delete',
					path: '/codemarks/' + this.codemark._id,
					token: this.token
				},
				callback
			);
		});
	}
}

module.exports = AlreadyDeletedTest;
