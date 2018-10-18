'use strict';

const CodeBlockTest = require('./code_block_test');
const Assert = require('assert');

class ExtendedAttributesTest extends CodeBlockTest {

	get description () {
		return `should return the post with extended attributes and marker info when creating a post in a ${this.streamType} stream with a code block and extended attributes`;
	}
    
	// form the data we'll use in creating the post
	makePostData (callback) {
		super.makePostData(() => {
			this.extendedData = {
				type: 'comment',
				status: 'open',
				color: 'red',
				title: 'This is a comment!',
				assignees: [this.currentUser.user._id]
			};
			Object.assign(this.data, this.extendedData);
			callback();
		});
	}

	// validate the response to the post request
	validateResponse (data) {
		const post = data.post;
		const marker = data.markers[0];
		['type', 'status', 'color', 'title'].forEach(attribute => {
			Assert.equal(post[attribute], this.extendedData[attribute], `attribute ${attribute} not correct in post response`);
		});
		['type', 'status', 'color'].forEach(attribute => {
			Assert.equal(marker[attribute], this.extendedData[attribute], `attribute ${attribute} not correct in marker response`);
		});
		Assert.deepEqual(post.assignees, this.extendedData.assignees, 'attribute assignees is not correct in post response');
		super.validateResponse(data);
	}
}

module.exports = ExtendedAttributesTest;
