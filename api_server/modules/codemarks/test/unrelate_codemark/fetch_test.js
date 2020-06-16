'use strict';

const UnrelateCodemarkTest = require('./unrelate_codemark_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends UnrelateCodemarkTest {

	get description () {
		return 'should properly remove the relation between two codemarks when requested, checked by fetching both codemarks';
	}

	run (callback) {
		// run the main test, then fetch the codemarks afterwards
		BoundAsync.series(this, [
			super.run,
			this.fetchCodemarks
		], callback);
	}

	// fetch the tested codemarks, and verify they are now "unrelated" to each other
	fetchCodemarks (callback) {
		BoundAsync.timesSeries(
			this,
			2,
			this.fetchCodemark,
			callback
		);
	}

	// fetch one of the related codemarks, and verify it is not related to the other
	fetchCodemark (n, callback) {
		const codemarkId = this.testCodemarks[n].id;
		this.doApiRequest(
			{
				method: 'get',
				path: '/codemarks/' + codemarkId,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const expectRelatedIds = [];
				if (this.doPreRelatedCodemarks) {
					expectRelatedIds.unshift(this.preRelatedCodemarks[n].id);
				}
				Assert.deepEqual(response.codemark.relatedCodemarkIds, expectRelatedIds, 'fetched codemark is still related');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
