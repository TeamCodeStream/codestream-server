'use strict';

const RemoveTagTest = require('./remove_tag_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends RemoveTagTest {

	get description () {
		return 'should properly remove a tag from the codemark tags when requested, checked by fetching the codemark';
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
				const expectedTags = [];
				if (this.expectOtherTag) {
					expectedTags.push(this.otherTagId);
				}
				Assert.deepEqual(response.codemark.tags, expectedTags, 'fetched codemark does not have the correct tags');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
