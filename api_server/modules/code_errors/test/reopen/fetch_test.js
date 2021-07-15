'use strict';

const ReopenTest = require('./reopen_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends ReopenTest {

	get description () {
		return 'should properly update the code error\'s status when reopened, checked by fetching the code error';
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
				Assert.deepStrictEqual(response.codeError, this.expectedCodeError, 'fetched code error does not have the correct resolutions');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
