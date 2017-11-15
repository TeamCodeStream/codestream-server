'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
const User_Test_Constants = require('../user_test_constants');
const User_Attributes = require('../../user_attributes');

class Read_Test extends CodeStream_API_Test {

	get description () {
		return 'should clear last_reads for the specified stream ID for the current user ';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';
	}

	get_expected_fields () {
		let user_response = {};
		user_response.user = [...User_Test_Constants.EXPECTED_USER_FIELDS, ...User_Test_Constants.EXPECTED_ME_FIELDS];
		return user_response;
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_repo,
			this.create_stream,
			this.create_other_stream,
			this.create_post,
			this.create_other_post,
			this.mark_read
		], callback);
	}

	create_other_user (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_user_data = response;
				callback();
			}
		);
	}

	create_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				with_emails: [this.current_user.email],
				token: this.other_user_data.access_token
			}
		);
	}

	create_stream (callback) {
		let stream_options = {
			type: 'file',
			team_id: this.team._id,
			repo_id: this.repo._id,
			token: this.other_user_data.access_token
		};
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			stream_options
		);
	}

	create_other_stream (callback) {
		let stream_options = {
			type: 'file',
			team_id: this.team._id,
			repo_id: this.repo._id,
			token: this.other_user_data.access_token
		};
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_stream = response.stream;
				callback();
			},
			stream_options
		);
	}

	create_post (callback) {
		let post_options = {
			stream_id: this.stream._id,
			token: this.other_user_data.access_token
		};
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
			post_options
		);
	}

	create_other_post (callback) {
		let post_options = {
			stream_id: this.other_stream._id,
			token: this.other_user_data.access_token
		};
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_post = response.post;
				callback();
			},
			post_options
		);
	}

	mark_read (callback) {
		this.do_api_request(
			{
				method: 'put',
				path: '/read/' + this.stream._id,
				token: this.token
			},
			callback
		);
	}

	validate_response (data) {
		let expected_last_reads = {
			[this.other_stream._id]: '0'
		};
		Assert.deepEqual(expected_last_reads, data.user.last_reads, 'last_reads doesn\'t match');
		this.validate_sanitized(data.user);
	}

	validate_sanitized (user, fields) {
		fields = fields || User_Test_Constants.UNSANITIZED_ATTRIBUTES;
		let me_attributes = Object.keys(User_Attributes).filter(attribute => User_Attributes[attribute].for_me);
		me_attributes.forEach(attribute => {
			let index = fields.indexOf(attribute);
			if (index !== -1) {
				fields.splice(index, 1);
			}
		});
		super.validate_sanitized(user, fields);
	}
}

module.exports = Read_Test;
