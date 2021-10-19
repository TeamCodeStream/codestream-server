'use strict';

const CodeStreamPostReplyTest = require('./codestream_post_reply_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class FilesTest extends CodeStreamPostReplyTest {

	get description () {
		return 'should return a New Relic comment when requested, when fetching a post that was created in CodeStream but is a reply to a New Relic object, with attachments';
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.postData.files = [
				{
					url: 'http://codestream-dev.s3.us-east-1.amazonaws.com/usercontent/users/colin/5fdbdeb9f1b2e84404e7f124/4f6fbd7e-63f6-4773-ad3f-269ea5519294/treehouse2.jpg',
					name: 'treehouse2.jpg',
					mimetype: 'image/jpeg',
					size: 623637
				},
				{
					url: 'http://codestream-dev.s3.us-east-1.amazonaws.com/usercontent/users/colin/5fdbdeb9f1b2e84404e7f124/4f6fbd7e-63f6-4773-ad3f-269ea5519294/treehouse.jpg',
					name: 'treehouse.jpg',
					mimetype: 'image/jpeg',
					size: 424011
				}
			];
			this.expectedResponse.post.files = DeepClone(this.postData.files);
			callback();
		});
	}
}

module.exports = FilesTest;
