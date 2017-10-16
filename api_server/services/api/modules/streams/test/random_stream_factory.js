'use strict';

var Random_String = require('randomstring');

class Random_Stream_Factory {

	constructor (options) {
		Object.assign(this, options);
	}

	create_stream (data, token, callback) {
		this.api_requester.do_api_request({
			method: 'post',
			path: '/streams',
			data: data,
			token: token
		}, callback);
	}

	random_name () {
		return 'channel ' + Random_String.generate(12);
	}

	random_file () {
		return `/path/to/${Random_String.generate(12)}.${Random_String.generate(2)}`;
	}

	get_random_stream_data (callback, options = {}) {
		let type = options.type || 'file';
		if (!options.company_id) {
			return callback('must provide company_id for stream creation');
		}
		if (!options.team_id) {
			return callback('must provide team_id for stream creation');

		}
		let data = {
			type: type,
			company_id: options.company_id,
			team_id: options.team_id
		};
		if (type === 'channel') {
			this.get_random_channel_stream_data(data, callback, options);
		}
		else if (type === 'direct') {
			this.get_random_direct_stream_data(data, callback, options);
		}
		else if (type === 'file') {
			this.get_random_file_stream_data(data, callback, options);
		}
		else {
			return callback('invalid type: ' + type);
		}
	}

	get_random_channel_stream_data (data, callback, options = {}) {
		if (options.member_ids) {
			data.member_ids = options.member_ids;
		}
		data.name = options.name || this.random_name();
		callback(null, data);
	}

	get_random_direct_stream_data (data, callback, options = {}) {
		if (options.member_ids) {
			data.member_ids = options.member_ids;
		}
		callback(null, data);
	}

	get_random_file_stream_data (data, callback, options = {}) {
		if (options.repo_id) {
			data.repo_id = options.repo_id;
		}
		else {
			return callback('must provide repo_id for file streams');
		}
		data.file = options.file || this.random_file();
		callback(null, data);
	}

	create_random_stream (callback, options = {}) {
		this.get_random_stream_data(
			(error, data) => {
				if (error) { return callback(error); }
				this.create_stream(data, options.token, callback);
			},
			options
		);
	}
}

module.exports = Random_Stream_Factory;
