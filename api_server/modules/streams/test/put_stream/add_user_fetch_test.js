'use strict';

const PutStreamFetchTest = require('./put_stream_fetch_test');
const AddUserTest = require('./add_user_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class AddUserFetchTest extends Aggregation(AddUserTest, PutStreamFetchTest) {

	get description () {
		return 'should properly update a stream when requested, when a user is added to the stream, checked by fetching the stream';
	}
}

module.exports = AddUserFetchTest;
