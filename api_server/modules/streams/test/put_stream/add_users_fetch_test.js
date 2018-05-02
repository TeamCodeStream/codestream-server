'use strict';

const PutStreamFetchTest = require('./put_stream_fetch_test');
const AddUsersTest = require('./add_users_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class AddUsersFetchTest extends Aggregation(AddUsersTest, PutStreamFetchTest) {

	get description () {
		return 'should properly update a stream when requested, when several users are added to the stream, checked by fetching the stream';
	}
}

module.exports = AddUsersFetchTest;
