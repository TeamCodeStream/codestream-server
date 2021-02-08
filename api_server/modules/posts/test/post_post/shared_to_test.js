'use strict';

const PostToChannelTest = require('./post_to_channel_test');
const Assert = require('assert');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const RandomString = require('randomstring');

class SharedToTest extends PostToChannelTest {

	get description () {
		return 'should return sharedTo in returned post when creating a post with sharedTo indicating third-party providers with whom this post has been shared';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			this.sharedTo = [
				{
					createdAt: Date.now(),
					providerId: 'slack',
					teamId: RandomString.generate(10),
					teamName: RandomString.generate(10),
					channelId: RandomString.generate(10),
					channelName: RandomString.generate(10),
					postId: RandomString.generate(10)
 				},
				{
					createdAt: Date.now(),
					providerId: 'msteams',
					teamId: RandomString.generate(10),
					teamName: RandomString.generate(10),
					channelId: RandomString.generate(10),
					channelName: RandomString.generate(10),
					postId: RandomString.generate(10)
				}
			]
			this.data.sharedTo = DeepClone(this.sharedTo);
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepStrictEqual(data.post.sharedTo, this.sharedTo, 'returned post does not have sharedTo');
		super.validateResponse(data);
	}
}

module.exports = SharedToTest;
