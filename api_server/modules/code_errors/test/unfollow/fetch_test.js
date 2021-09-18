'use strict';

const UnfollowTest = require('./unfollow_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends UnfollowTest {

	get description () {
		return 'should properly remove the user as a follower of a code error when requested, checked by fetching the code error';
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
				Assert(codeError.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the before was updated');
				this.expectedCodeError.modifiedAt = codeError.modifiedAt;
				Assert.deepEqual(response.codeError, this.expectedCodeError, 'fetched code error does not have the correct followers');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
