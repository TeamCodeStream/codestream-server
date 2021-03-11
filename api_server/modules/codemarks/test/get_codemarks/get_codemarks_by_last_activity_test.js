'use strict';

const GetCodemarksWithMarkersTest = require('./get_codemarks_with_markers_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class GetCodemarksByLastActivityTest extends GetCodemarksWithMarkersTest {

	get description () {
		return 'should return the correct codemarks in correct order when requesting codemarks for a team and by last activity';
	}

	setPath (callback) {
		// set path, and then reply to a couple of the codemarks, which should boost their lastActivityAt
		BoundAsync.series(this, [
			super.setPath,
			this.replyToCodemarks
		], callback);
	}

	replyToCodemarks (callback) {
		const codemarksToReplyTo = [3, 8, 6, 2, 7, 4];
		this.path += '&byLastActivityAt=1';
		BoundAsync.forEachSeries(
			this,
			codemarksToReplyTo,
			this.replyToCodemark,
			callback
		);
	}

	replyToCodemark (nCodemark, callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					parentPostId: this.expectedCodemarks[nCodemark].postId,
					streamId: this.teamStream.id,
					text: RandomString.generate(50)
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.expectedCodemarks[nCodemark].lastActivityAt = response.codemarks[0].$set.lastActivityAt;
				this.expectedCodemarks.unshift(this.expectedCodemarks[nCodemark]);
				this.expectedCodemarks.splice(nCodemark + 1, 1);
				callback();
			}
		);
	}
}

module.exports = GetCodemarksByLastActivityTest;
