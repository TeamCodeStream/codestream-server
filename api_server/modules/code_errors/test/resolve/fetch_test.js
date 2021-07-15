'use strict';

const ResolveTest = require('./resolve_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends ResolveTest {

	get description () {
		return 'should properly add the user\'s resolution to a code error when requested, checked by fetching the code error';
	}

	run (callback) {
		// run the main test, then fetch the code error afterwards
		BoundAsync.series(this, [
			super.run,
			this.fetchCodeError
		], callback);
	}

	// fetch the code error, and verify it has the expected tags
	fetchCodeError (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/code-errors/' + this.codeError.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const { codeError } = response;
				Assert(codeError.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the code error was updated');
				this.expectedCodeError.modifiedAt = codeError.modifiedAt;
				Assert(codeError.resolvedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the code error was updated');
				this.expectedCodeError.resolvedAt = codeError.resolvedAt;
				Assert(codeError.resolvedBy[this.currentUser.user.id].resolvedAt >= this.modifiedAfter, 'resolvedAt is not greater than before the code error was updated');
				this.expectedCodeError.resolvedBy[this.currentUser.user.id].resolvedAt = codeError.resolvedBy[this.currentUser.user.id].resolvedAt;
				Assert.deepStrictEqual(response.codeError, this.expectedCodeError, 'fetched code error does not have the correct resolutions');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
