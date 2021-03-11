'use strict';

const DeleteRepliesTest = require('./delete_replies_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class DeleteRelationsTest extends DeleteRepliesTest {

	get description () {
		return 'should delete the relations with other codemarks when a review with reply codemarks is deleted';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.makeRelatedCodemarks(callback);
		});
	}

	// make any codemarks to be related to this one
	makeRelatedCodemarks (callback) {
		this.relatedCodemarks = [];
		BoundAsync.timesSeries(
			this,
			2,
			this.makeRelatedCodemark,
			() => {
				this.expectedData.codemarks.sort((a, b) => {
					return a.id.localeCompare(b.id);
				});
				callback();
			}
		);
	}

	// make a codemark to be related to the one to be deleted
	makeRelatedCodemark (n, callback) {
		const codemarkData = this.codemarkFactory.getRandomCodemarkData();
		codemarkData.relatedCodemarkIds = [this.replyCodemarkResponse.codemark.id];
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					streamId: this.teamStream.id,
					text: this.postFactory.randomText(),
					codemark: codemarkData
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const relatedCodemark = response.codemark;
				this.expectedData.codemarks[0].$set.version = 5;
				this.expectedData.codemarks[0].$version = { before: 4, after: 5 };
				this.expectedData.codemarks.push({
					id: relatedCodemark.id,
					_id: relatedCodemark.id,
					$set: {
						version: 2,
						modifiedAt: Date.now()
					},
					$pull: {
						relatedCodemarkIds: this.replyCodemarkResponse.codemark.id
					},
					$version: {
						before: 1,
						after: 2
					}
				});
				callback();
			}
		);
	}
}

module.exports = DeleteRelationsTest;
