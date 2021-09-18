'use strict';

const FollowTest = require('./follow_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends FollowTest {

	get description () {
		return 'should properly add the user as a follower to a code error when requested, checked by fetching the code error';
	}

	run (callback) {
		// run the main test, then fetch the code error afterwards
		BoundAsync.series(this, [
			super.run,
			this.fetchCodeError
		], callback);
	}

	// fetch the code error, and verify it has the expected data
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
				Assert.deepStrictEqual(response.codeError, this.expectedCodeError, 'fetched code error does not have the correct followers');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
