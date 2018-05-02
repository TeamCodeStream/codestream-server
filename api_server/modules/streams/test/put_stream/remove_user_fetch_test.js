'use strict';

const PutStreamFetchTest = require('./put_stream_fetch_test');
const RemoveUserTest = require('./remove_user_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class RemoveUserFetchTest extends Aggregation(RemoveUserTest, PutStreamFetchTest) {

	get description () {
		return 'should properly update a stream when requested, when a user is removed from the stream, checked by fetching the stream';
	}
}

module.exports = RemoveUserFetchTest;
