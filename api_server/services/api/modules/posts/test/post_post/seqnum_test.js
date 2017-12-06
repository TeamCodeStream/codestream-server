'use strict';

var PostPostTest = require('./post_post_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class SeqNumTest extends PostPostTest {

	get description () {
		return 'posts created in a stream should have an increasing sequence number';
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			this.createMorePosts,
			super.makePostData
		], callback);
	}

	createMorePosts (callback) {
		this.additionalPosts = [];
		BoundAsync.timesSeries(
			this,
			5,
			this.createAdditionalPost,
			callback
		);
	}

	createAdditionalPost (n, callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.additionalPosts.push(response.post);
				callback();
			},
			{
				streamId: this.stream._id,
				token: this.token
			}
		);
	}

	validateResponse (data) {
		for (let i = 0; i < this.additionalPosts.length; i++) {
			Assert(this.additionalPosts[i].seqNum === i + 1, 'additional post ' + i + ' does not have correct sequence number');
		}
		this.testOptions.expectedSeqNum = this.additionalPosts.length + 1;
		super.validateResponse(data);
	}
}

module.exports = SeqNumTest;
