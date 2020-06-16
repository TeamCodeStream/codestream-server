'use strict';

const RelateCodemarkTest = require('./relate_codemark_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends RelateCodemarkTest {

	get description () {
		return 'should properly relate two codemarks when requested, checked by fetching both codemarks';
	}

	run (callback) {
		// run the main test, then fetch the codemarks afterwards
		BoundAsync.series(this, [
			super.run,
			this.fetchCodemarks
		], callback);
	}

	// fetch the tested codemarks, and verify they now "relate" to each other
	fetchCodemarks (callback) {
		BoundAsync.timesSeries(
			this,
			2,
			this.fetchCodemark,
			callback
		);
	}

	// fetch one of the related codemarks, and verify it is related to the other
	fetchCodemark (n, callback) {
		const codemarkId = this.testCodemarks[n].id;
		const otherCodemarkId = this.testCodemarks[1 - n].id;
		this.doApiRequest(
			{
				method: 'get',
				path: '/codemarks/' + codemarkId,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const expectRelatedIds = [otherCodemarkId];
				if (this.doPreRelatedCodemarks) {
					expectRelatedIds.unshift(this.preRelatedCodemarks[n].id);
				}
				Assert.deepEqual(response.codemark.relatedCodemarkIds, expectRelatedIds, 'fetched codemark not related to the correct codemarks');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
