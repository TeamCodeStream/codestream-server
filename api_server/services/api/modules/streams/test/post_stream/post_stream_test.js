'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
const Stream_Test_Constants = require('../stream_test_constants');

class Post_Stream_Test extends CodeStream_API_Test {

	constructor (options) {
		super(options);
		this.test_options = {};
		this.team_emails = [];
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/streams';
	}

	get description () {
		return `should return a valid stream when creating a new ${this.type} stream`;
	}

	get_expected_fields () {
		return Stream_Test_Constants.EXPECTED_STREAM_RESPONSE;
	}

	before (callback) {
		Bound_Async.series(this, [
			this.make_random_emails,
			this.create_random_repo,
			this.make_stream_options,
			this.create_duplicate_stream,
			this.make_stream_data
		], callback);
	}

	make_random_emails (callback) {
		for (let i = 0; i < 3; i++) {
			this.team_emails.push(this.user_factory.random_email());
		}
		callback();
	}

	create_random_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				with_emails: this.team_emails,
				token: this.token
			}
		);
	}

	make_stream_options (callback) {
		this.stream_options = {
			type: this.type,
			company_id: this.team.company_id,
			team_id: this.team._id
		};
		callback();
	}

	create_duplicate_stream (callback) {
		if (!this.test_options.want_duplicate_stream) {
			return callback();
		}
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.duplicate_stream = response.stream;
				callback();
			},
			Object.assign({}, this.stream_options, { token: this.token })
		);
	}

	make_stream_data (callback) {
		this.stream_factory.get_random_stream_data(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			this.stream_options
		);
	}

	validate_response (data) {
		let stream = data.stream;
		let errors = [];
		let result = (
			((stream.type === this.data.type) || errors.push('type does not match')) &&
			((stream.company_id === this.data.company_id) || errors.push('company_id does not match')) &&
			((stream.team_id === this.data.team_id) || errors.push('team_id does not match')) &&
			((stream.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof stream.created_at === 'number') || errors.push('created_at not number')) &&
			((stream.modified_at >= stream.created_at) || errors.push('modified_at not greater than or equal to created_at')) &&
			((stream.creator_id === this.current_user._id) || errors.push('creator_id not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validate_sanitized(stream, Stream_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Post_Stream_Test;
