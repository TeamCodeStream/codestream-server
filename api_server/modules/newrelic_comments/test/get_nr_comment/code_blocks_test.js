'use strict';

const CodeStreamPostReplyTest = require('./codestream_post_reply_test');
const NormalizeUrl = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/normalize_url');

class CodeBlocksTest extends CodeStreamPostReplyTest {

	get description () {
		return 'should return a New Relic comment when requested, with code blocks, when fetching a post that was created in CodeStream but is a reply to a New Relic object, as a codemark';
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.postData.codemark = this.codemarkFactory.getRandomCodemarkData({
				wantMarkers: 3,
				withRandomStream: true
			});
			this.expectedResponse.post.codeBlocks = this.postData.codemark.markers.map(marker => {
				return {
					code: marker.code,
					sha: marker.commitHash.toLowerCase(),
					repo: NormalizeUrl(marker.remotes[0]),
					file: marker.file
				};
			});
			callback();
		});
	}
}

module.exports = CodeBlocksTest;
