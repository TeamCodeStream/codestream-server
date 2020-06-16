'use strict';

const UnfollowTest = require('./unfollow_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends UnfollowTest {

	get description () {
		return 'should properly remove the user as a follower of a codemark when requested by clicking an email link, checked by fetching the codemark';
	}

	run (callback) {
		// run the main test, then fetch the codemark afterwards
		BoundAsync.series(this, [
			super.run,
			this.fetchCodemark
		], callback);
	}

	// fetch the codemark, and verify it has the expected tags
	fetchCodemark (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/codemarks/' + this.codemark.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const { codemark } = response;
				Assert(codemark.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the before was updated');
				this.expectedCodemark.modifiedAt = codemark.modifiedAt;
				Assert.deepEqual(response.codemark, this.expectedCodemark, 'fetched codemark does not have the correct followers');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
