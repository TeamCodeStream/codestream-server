// provide a factory for creating random posts, for testing purposes

'use strict';

var RandomString = require('randomstring');

class RandomPostFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// create the post by submitting a request to the server
	createPost (data, token, callback) {
		this.lastInputData = data;
		this.apiRequester.doApiRequest({
			method: 'post',
			path: '/posts',
			data: data,
			token: token
		}, callback);
	}

	// utility: generate a random number up to a given limit
	randomUpto (upto) {
		return Math.floor(Math.random() * upto);
	}

	// generate some random text for a post, up to 1000 characters
	randomText () {
		const length = 1 + this.randomUpto(1000);
		return RandomString.generate(length);
	}

	// get some data to use for a random post, given various options
	getRandomPostData (callback, options = {}) {
		let data = {};
		if (!options.streamId && !options.stream) {
			return callback('must provide streamId or stream');	// otherwise we'll get an error!
		}
		data.streamId = options.streamId;
		data.stream = options.stream;
		if (options.wantCodemark) {
			data.codemark = this.codemarkFactory.getRandomCodemarkData(options);
		}
		if (options.wantReview) {
			data.review = this.reviewFactory.getRandomReviewData(options);
		}
		if (options.wantCodeError) {
			data.codeError = this.codeErrorFactory.getRandomCodeErrorData(options);
		}
		if (options.parentPostId) {
			// for replies
			data.parentPostId = options.parentPostId;
		}
		if (options.mentionedUserIds) {
			data.mentionedUserIds = [...options.mentionedUserIds];
		}
		data.text = this.randomText();
		callback(null, data);
	}

	// create a random post by getting random post data and submitting a request to the server
	createRandomPost (callback, options = {}) {
		this.getRandomPostData(
			(error, data) => {
				if (error) { return callback(error); }
				this.createPost(data, options.token, callback);
			},
			options
		);
	}
}

module.exports = RandomPostFactory;
