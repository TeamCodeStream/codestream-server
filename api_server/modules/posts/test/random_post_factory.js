// provide a factory for creating random posts, for testing purposes

'use strict';

var RandomString = require('randomstring');

class RandomPostFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// create the post by submitting a request to the server
	createPost (data, token, callback) {
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

	// generate a random commit hash
	randomCommitHash () {
		// we're pretty lax here, just create a random 40-character string,
		// won't really look too much like an actual git commit hash, but it
		// shouldn't matter
		return RandomString.generate(40);
	}

	// get some data to use for a random post, given various options
	getRandomPostData (callback, options = {}) {
		let data = {};
		if (!options.streamId && !options.stream) {
			return callback('must provide streamId or stream');	// otherwise we'll get an error!
		}
		data.streamId = options.streamId;
		data.stream = options.stream;
		if (options.commitHash) {
			data.commitHashWhenPosted = options.commitHash;
		}
		if (options.wantCodeBlocks) {
			// for code blocks, we'll generate some random text for the code and a random
			// location structure, not a very accurate representation of real code
			data.codeBlocks = [];
			for (let i = 0; i < options.wantCodeBlocks; i++) {
				let codeBlockInfo = {
					code: this.randomText(),
					location: this.markerFactory.randomLocation(),
					preContext: this.randomText(),
					postContext: this.randomText()
				};
				if (options.codeBlockStreamId) {
					// for code blocks that come from a different stream than the one the post will go into
					codeBlockInfo.streamId = options.codeBlockStreamId;
				}
				data.commitHashWhenPosted = data.commitHashWhenPosted || this.randomCommitHash();
				data.codeBlocks.push(codeBlockInfo);
			}
		}
		if (options.parentPostId) {
			// for replies
			data.parentPostId = options.parentPostId;
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
