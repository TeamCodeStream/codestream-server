'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class Stream_ID_Required_Test extends CodeStream_API_Test {

	get description () {
		return 'should return error if stream_id is not provided';
	}

	before (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.path = '/posts?team_id=' + response.team._id;
				callback();
			},
			{
				token: this.token
			}
		);
	}

	get_expected_error () {
		return {
			code: 'RAPI-1001',
			info: 'stream_id'
		};
	}
}

module.exports = Stream_ID_Required_Test;
