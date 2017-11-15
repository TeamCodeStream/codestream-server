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

	randomLocation () {
		const lineStart = this.randomUpto(1000);
		const lineEnd = lineStart + this.randomUpto(1000);
		const charStart = this.randomUpto(100);
		const charEnd = (lineStart === lineEnd) ?
			(charStart + this.randomUpto(100)) :
			this.randomUpto(100);
		return { lineStart, lineEnd, charStart, charEnd };
	}

	randomReplayInfo () {
		// don't really know what form this will take just yet
		return {
			commitSha: this.randomCommitHash(),
			lines: this.randomUpto(200) - 100
		};
	}

	getRandomPostData (callback, options = {}) {
		let data = {};
		if (!options.streamId && !options.stream) {
			return callback('must provide streamId or stream');
		}
		data.streamId = options.streamId;
		data.stream = options.stream;
		if (options.repoId) {
			data.repoId = options.repoId;
			data.commitShaWhenPosted = this.randomCommitHash();
		}
		if (options.wantLocation) {
			data.location = this.randomLocation();
			data.replayInfo = this.randomReplayInfo();
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
