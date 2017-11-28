'use strict';

var RandomString = require('randomstring');

class RandomPostFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	createPost (data, token, callback) {
		this.apiRequester.doApiRequest({
			method: 'post',
			path: '/posts',
			data: data,
			token: token
		}, callback);
	}

	randomUpto (upto) {
		return Math.floor(Math.random() * upto);
	}

	randomText () {
		const length = 1 + this.randomUpto(1000);
		return RandomString.generate(length);
	}

	randomCommitHash () {
		return RandomString.generate(40);
	}

	getRandomPostData (callback, options = {}) {
		let data = {};
		if (!options.streamId && !options.stream) {
			return callback('must provide streamId or stream');
		}
		data.streamId = options.streamId;
		data.stream = options.stream;
		if (options.commitHash) {
			data.commitHashWhenPosted = options.commitHash;
		}
		if (options.wantCodeBlocks) {
			data.codeBlocks = [];
			for (let i = 0; i < options.wantCodeBlocks; i++) {
				let codeBlockInfo = {
					code: this.randomText(),
					location: this.markerFactory.randomLocation()
				};
				if (options.codeBlockStreamId) {
					codeBlockInfo.streamId = options.codeBlockStreamId;
				}
				data.commitHashWhenPosted = data.commitHashWhenPosted || this.randomCommitHash();
				data.codeBlocks.push(codeBlockInfo);
			}
		}
		if (options.parentPostId) {
			data.parentPostId = options.parentPostId;
		}
		data.text = this.randomText();
		callback(null, data);
	}

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
