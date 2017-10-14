'use strict';

var Random_String = require('randomstring');

class Random_Post_Factory {

	constructor (options) {
		Object.assign(this, options);
	}

	create_post (data, token, callback) {
		this.api_requester.do_api_request({
			method: 'post',
			path: '/posts',
			data: data,
			token: token
		}, callback);
	}

	random_upto (upto) {
		return Math.floor(Math.random() * upto);
	}

	random_text () {
		const length = 1 + this.random_upto(1000);
		return Random_String.generate(length);
	}

	random_sha () {
		return Random_String.generate(40);
	}

	random_location () {
		const line_start = this.random_upto(1000);
		const line_end = line_start + this.random_upto(1000);
		const char_start = this.random_upto(100);
		const char_end = (line_start === line_end) ?
			(char_start + this.random_upto(100)) :
			this.random_upto(100);
		return { line_start, line_end, char_start, char_end };
	}

	random_replay_info () {
		// don't really know what form this will take just yet
		return {
			commit_sha: this.random_sha(),
			lines: this.random_upto(200) - 100
		};
	}

	get_random_post_data (callback, options = {}) {
		let data = {};
		if (!options.stream_id && !options.stream) {
			return callback('must provide stream_id or stream');
		}
		data.stream_id = options.stream_id;
		data.stream = options.stream;
		if (options.repo_id) {
			data.repo_id = options.repo_id;
			data.commit_sha_when_posted = this.random_sha();
		}
		if (options.want_location) {
			data.location = this.random_location();
			data.replay_info = this.random_replay_info();
		}
		if (options.parent_post_id) {
			data.parent_post_id = options.parent_post_id;
		}
		data.text = this.random_text();
		callback(null, data);
	}

	create_random_post (callback, options = {}) {
		this.get_random_post_data(
			(error, data) => {
				if (error) { return callback(error); }
				this.create_post(data, options.token, callback);
			},
			options
		);
	}
}

module.exports = Random_Post_Factory;
