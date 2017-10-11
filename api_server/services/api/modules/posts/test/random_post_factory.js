'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Random_String = require('randomstring');
const Post_Test_Constants = require('./post_test_constants');

class Random_Post_Factory {

	constructor (options) {
		Object.assign(this, options);
		this.set_data_functions_by_type();
	}

	create_post (data, token, callback) {
		this.api_requester.do_api_request({
			method: 'post',
			path: '/post',
			data: data,
			token: token
		}, (error, response_data) => {
			if (error) { return callback(error); }
			callback(null, response_data.post);
		});
	}

	random_upto (upto) {
		return Math.floor(Math.random() * upto);
	}

	random_text () {
		const length = 1 + this.random_upto(1000);
		return Random_String.generate(length);
	}

	random_position () {
		const line_start = this.random_upto(1000);
		const line_end = line_start + this.random_upto(1000);
		const char_start = this.random_upto(100);
		const char_end = (line_start === line_end) ?
			(char_start + this.random_upto(100)) :
			this.random_upto(100);
		return { line_start, line_end, char_start, char_end };
	}

	get_random_post_type (options) {
		const types = Object.keys(this.data_function_by_type);
		const num_types = types.length;
		const type_index = Math.floor(Math.random() * num_types);
		const type = types[type_index];
		if (type === 'reply' && options.no_reply) {
			return this.get_random_post_type(options);
		}
		else {
			return type;
		}
	}

	need_position (type, options) {
		return (
			options.position ||
			(
				options.position !== false &&
				Post_Test_Constants.WANT_POSITION[type]
			)
		);
	}

	get_random_post_data (callback, options = {}) {
		let type = options.type || this.get_random_post_type(options);
		if (typeof this.data_function_by_type[type] !== 'function') {
			return callback('no function for type ' + type);
		}
		this.data_function_by_type[type](
			(error, data) => {
				if (error) { return callback(error); }
				if (!options.no_text) {
					data.text = this.random_text();
				}
				if (this.need_position(type, options)) {
					Object.assign(data, this.random_position());
				}
				callback(null, data);
			},
			options
		);
	}

	create_random_post (callback, options = {}) {
		this.get_random_post_data(
			(error, data) => {
				if (error) { return callback(error); }
				if (!data.org_id) {
					return callback('no org_id in post data');
				}
				this.create_post(data, options.token, callback);
			},
			options
		);
	}

	get_random_group_post_data (callback, options = {}) {
		let have_group = (group) => {
			return callback(null, {
				group_id: group._id,
				org_id: group.org_id
			});
		};
		if (typeof options.group !== 'object') {
			if (!this.group_factory) {
				return callback('no group or group factory provided');
			}
			this.group_factory.create_random_group(
				(error, data) => {
					if (error) { return callback(error); }
					have_group(data.group);
				},
				{
					org: options.org,
					token: options.token
				}
			);
		}
		else {
			have_group(options.group);
		}
	}

	get_random_reply_post_data (callback, options = {}) {
		let have_post = (post) => {
			let data = {
				parent_post_id: post._id,
				org_id: post.org_id
			};
			if (post.group_id) {
				data.group_id = post.group_id;
			}
			return callback(null, data);
		};
		if (typeof options.post !== 'object') {
			this.create_random_post(
				(error, post) => {
					if (error) { return callback(error); }
					have_post(post);
				},
				Object.assign({}, options, { type: null })
			);
		}
		else {
			have_post(options.post);
		}
	}

	get_random_repo () {
		return 'repo_' + Random_String.generate(10);
	}

	get_random_path () {
		const length = 1 + Math.floor(Math.random() * 4);
		let path_elems = [];
		for (let i = 0; i < length; i++) {
			path_elems.push(Random_String.generate(6));
		}
		return path_elems.join('/');
	}

	get_random_commit_id () {
		return Random_String.generate(20);
	}

	get_random_repo_data (options) {
		return {
			org_id: options.org._id,
			repo: this.get_random_repo()
		};
	}

	get_random_repo_comment_data (callback, options) {
		return callback(
			null,
			this.get_random_repo_data(options)
		);
	}

	get_random_file_data (options) {
		return Object.assign(
			this.get_random_repo_data(options),
			{
				path: this.get_random_path()
			}
		);
	}

	get_random_file_comment_data (callback, options) {
		return callback(
			null,
			this.get_random_file_data(options)
		);
	}

	get_random_commit_data (options) {
		return Object.assign(
			this.get_random_file_data(options),
			{
				commit_id: this.get_random_commit_id()
			}
		);
	}

	get_random_commit_comment_data (callback, options) {
		return callback(
			null,
			this.get_random_commit_data(options)
		);
	}

	get_random_patch_data (options) {
		return Object.assign(
			this.get_random_file_data(options),
			{
				patch_id: this.get_random_commit_id()
			}
		);
	}

	get_random_patch_comment_data (callback, options) {
		return callback(
			null,
			this.get_random_patch_data(options)
		);
	}

	get_random_diff_data (options) {
		return Object.assign(
			this.get_random_file_data(options),
			{
				diff_id: this.get_random_commit_id()
			}
		);
	}

	get_random_diff_comment_data (callback, options) {
		return callback(
			null,
			this.get_random_diff_data(options)
		);
	}

	create_n_of_each_type (n, callback, options) {
		this.posts_created = {};
		let types = Object.keys(this.data_function_by_type);
		Bound_Async.timesSeries(
			this,
			types.length,
			(type_index, times_callback) => {
				let type = types[type_index];
				if (type === 'reply' && options.no_reply) {
					return times_callback();
				}
				this._create_n_of_type(n, type, times_callback, options);
			},
			(error) => {
				callback(error, this.posts_created);
			}
		);
	}

	_create_n_of_type (n, type, callback, options) {
		this.posts_created[type] = this.posts_created[type] || [];
		Bound_Async.timesSeries(
			this,
			n,
			(n_index, times_callback) => {
				this.create_random_post(
					(error, post) => {
						if (error) { return times_callback(error); }
						this.posts_created[type].push(post);
						times_callback();
					},
					Object.assign({}, options, {
						type: type
					})
				);
			},
			callback
		);
	}

	create_n_same_of_type (n, type, callback, options) {
		this.posts_created = {};
		this.get_random_post_data(
			(error, data) => {
				if (error) { return callback(error); }
				this._create_n_posts_from_data(
					n,
					data,
					type,
					(error) => {
						callback(error, this.posts_created);
					},
					options
				);
			},
			Object.assign({}, options, {
				no_text: true,
				position: false,
				type: type
			})
		);
	}

	_create_n_posts_from_data (n, data, type, callback, options) {
		this.posts_created[type] = this.posts_created[type] || [];
		Bound_Async.timesSeries(
			this,
			n,
			(n_index, times_callback) => {
				this._create_post_from_data(data, type, times_callback, options);
			},
			callback
		);
	}

	_create_post_from_data (data, type, callback, options) {
		if (!options.no_text) {
			data.text = this.random_text();
		}
		if (this.need_position(type, options)) {
			data = Object.assign({}, data, this.random_position());
		}
		this.create_post(
			data,
			options.token,
			(error, post) => {
				if (error) { return callback(error); }
				this.posts_created[type].push(post);
				callback();
			}
		);
	}

	set_data_functions_by_type () {
		this.data_function_by_type = {
			group: this.get_random_group_post_data.bind(this),
			reply: this.get_random_reply_post_data.bind(this),
			repo: this.get_random_repo_comment_data.bind(this),
			file: this.get_random_file_comment_data.bind(this),
			commit: this.get_random_commit_comment_data.bind(this),
			patch: this.get_random_patch_comment_data.bind(this),
			diff: this.get_random_diff_comment_data.bind(this)
		};
	}
}

module.exports = Random_Post_Factory;
