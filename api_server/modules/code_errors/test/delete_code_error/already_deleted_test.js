'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');

class AlreadyDeletedTest extends DeleteCodeErrorTest {

	get description () {
		return 'should return an error when trying to delete a code error that has already been deleted';
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
			// delete the code error, ahead of time...
			this.doApiRequest(
				{
					method: 'delete',
					path: '/code-errors/' + this.codeError.id,
					token: this.token
				},
				callback
			);
		});
	}
}

module.exports = AlreadyDeletedTest;
