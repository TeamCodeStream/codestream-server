'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class DeleteRelationsTest extends DeleteCodemarkTest {

	get description () {
		return 'should delete the relations with other codemarks when a codemark is deleted as a result of a post being deleted';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.numPosts = 4;
			callback();
		});
	}

	setExpectedData (callback) {
		BoundAsync.series(this, [
			super.setExpectedData,
			this.makeRelations
		], callback);
	}

	// make the relations between the created codemark and the others
	makeRelations (callback) {
		BoundAsync.timesSeries(
			this,
			this.postOptions.numPosts - 1,
			this.makeRelation,
			callback
		);
	}
	
	// make a relation between a created codemark and the one to delete
	makeRelation (n, callback) {
		const testCodemark = this.postData[0].codemark;
		const relatedCodemark = this.postData[n + 1].codemark;
		this.doApiRequest(
			{
				method: 'put',
				path: `/relate-codemark/${testCodemark.id}/${relatedCodemark.id}`,
				token: this.users[1].accessToken
			},
			error => {
				if (error) { return callback(error); }
				this.expectedData.codemarks.push({
					id: relatedCodemark.id,
					_id: relatedCodemark.id,	// DEPRECATE ME
					$set: {
						modifiedAt: Date.now(), // placeholder
						version: 3
					},
					$pull: {
						relatedCodemarkIds: testCodemark.id
					},
					$version: {
						before: 2,
						after: 3
					}
				});
				this.expectedData.codemarks[0].$set.version++;
				this.expectedData.codemarks[0].$version.before++;
				this.expectedData.codemarks[0].$version.after++;
				callback();
			}
		);
	}

	validateResponse (data) {
		data.codemarks.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedData.codemarks.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		const relatedCodemarks = this.postData.map(pd => pd.codemark);
		relatedCodemarks.forEach(relatedCodemark => {
			const returnedRelatedCodemark = data.codemarks.find(returnedCodemark => {
				return returnedCodemark.id === relatedCodemark.id;
			});
			Assert(returnedRelatedCodemark.$set.modifiedAt >= this.modifiedAfter, 'related codemark modifiedAt is not greater than before the codemark was deleted');
			const expectedCodemark = this.expectedData.codemarks.find(expectedCodemark => {
				return expectedCodemark.id === relatedCodemark.id;
			});
			expectedCodemark.$set.modifiedAt = returnedRelatedCodemark.$set.modifiedAt;
			this.validateSanitized(returnedRelatedCodemark.$set, PostTestConstants.UNSANITIZED_CODEMARK_ATTRIBUTES);
		});
		super.validateResponse(data);
	}
}

module.exports = DeleteRelationsTest;
