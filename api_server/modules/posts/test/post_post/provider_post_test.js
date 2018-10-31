'use strict';

const MarkerTest = require('./marker_test');
const Assert = require('assert');
const RandomString = require('randomstring');

class ProviderPostTest extends MarkerTest {

	get description () {
		return 'should return the post with marker info when creating a post with marker info in a file stream, and allow provider attributes to be passed';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.providerData = {
				providerType: 'slack',
				providerPostId: RandomString.generate(10),
				providerConversationId: RandomString.generate(10),
				providerInfo: {
					foo: 'bar',
					faw: 2
				}
			};
			Object.assign(this.data, this.providerData);
			callback();
		});
	}

	// validate the response to the post request
	validateResponse (data) {
		const post = data.post;
		const providerData = {};
		['providerType', 'providerPostId', 'providerConversationId', 'providerInfo'].forEach(attribute => {
			providerData[attribute] = post[attribute];
		});
		Assert.deepEqual(providerData, this.providerData, 'provider data returned with post does not match');
		super.validateResponse(data);
	}
}

module.exports = ProviderPostTest;
