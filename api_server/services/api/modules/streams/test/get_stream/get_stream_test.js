'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const Stream_Test_Constants = require('../stream_test_constants');

class Get_Stream_Test extends CodeStream_API_Test {

	get_expected_fields () {
		return { stream: Stream_Test_Constants.EXPECTED_STREAM_FIELDS };
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_random_repo,
			this.create_stream,
			this.set_path
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

	create_random_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				callback();
			},
			{
				with_random_emails: 2,
				with_emails: [this.current_user.email],
				token: this.other_user_data.access_token
			}
		);
	}

	create_stream (callback) {
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: this.type,
				token: this.mine ? this.token : this.other_user_data.access_token,
				company_id: this.repo.company_id,
				team_id: this.repo.team_id,
				repo_id: this.type === 'file' ? this.repo._id : null
			}
		);
	}

	set_path (callback) {
		this.path = '/streams/' + this.stream._id;
		callback();
	}

	validate_response (data) {
		this.validate_matching_object(this.stream._id, data.stream, 'stream');
		this.validate_sanitized(data.stream, Stream_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Stream_Test;
