'use strict';

const PutStreamFetchTest = require('./put_stream_fetch_test');
const RemoveUsersTest = require('./remove_users_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class RemoveUsersFetchTest extends Aggregation(RemoveUsersTest, PutStreamFetchTest) {

	get description () {
		return 'should properly update a stream when requested, when several users are removed from the stream, checked by fetching the stream';
	}
}

module.exports = RemoveUsersFetchTest;
