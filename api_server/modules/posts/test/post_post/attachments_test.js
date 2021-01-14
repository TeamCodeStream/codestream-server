'use strict';

const PostToChannelTest = require('./post_to_channel_test');
const Assert = require('assert');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class AttachmentsTest extends PostToChannelTest {

	get description () {
		return 'should return files in returned post when creating a post with attached files';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			this.attachedFiles = [
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
			]
			this.data.files = DeepClone(this.attachedFiles);
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepStrictEqual(data.post.files, this.attachedFiles, 'returned post does not have files');
		super.validateResponse(data);
	}
}

module.exports = AttachmentsTest;
