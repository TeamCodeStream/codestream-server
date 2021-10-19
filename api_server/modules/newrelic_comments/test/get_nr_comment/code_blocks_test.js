'use strict';

const CodeStreamPostReplyTest = require('./codestream_post_reply_test');
const NormalizeUrl = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/normalize_url');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class CodeBlocksTest extends CodeStreamPostReplyTest {

	get description () {
		return 'should return a New Relic comment when requested, with code blocks, when fetching a post that was created in CodeStream but is a reply to a New Relic object, as a codemark';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.getCodemark
		], callback);
	}

	getCodemark (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/posts/' + this.replyPostResponse.post.id,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemarkResponse = response;
				callback();
			}
		);
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.postData.codemark = this.codemarkFactory.getRandomCodemarkData({
				wantMarkers: 3,
				withRandomStream: true
			});
			this.postData.teamId = this.team.id;
			this.expectedResponse.post.codeBlocks = this.postData.codemark.markers.map(marker => {
				return {
					code: marker.code,
					sha: marker.commitHash.toLowerCase(),
					repo: NormalizeUrl(marker.remotes[0]),
					file: marker.file,
					permalink: '' // placeholder, till we know the permalink of the codemark
				};
			});
			callback();
		});
	}

	validateResponse (data) {
		const codemark = this.codemarkResponse.codemark;
		for (let i = 0; i < this.expectedResponse.post.codeBlocks.length; i++) {
			const expectedCodeBlock = this.expectedResponse.post.codeBlocks[i];
			const markerId = codemark.markerIds[i];
			expectedCodeBlock.permalink = `${codemark.permalink}?markerId=${markerId}`;
		}
		super.validateResponse(data);
	}
}

module.exports = CodeBlocksTest;
