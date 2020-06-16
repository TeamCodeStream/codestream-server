'use strict';

const PutStreamFetchTest = require('./put_stream_fetch_test');
const RemoveUsersTest = require('./remove_users_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

class RemoveUsersFetchTest extends Aggregation(RemoveUsersTest, PutStreamFetchTest) {

	get description () {
		return 'should properly update a stream when requested, when several users are removed from the stream, checked by fetching the stream';
	}

	updateStream (callback) {
		super.updateStream(error => {
			if (error) { return callback(error); }
			delete this.expectedStream.$pull;
			let memberIds = this.requestData.$pull.memberIds;
			if (!(memberIds instanceof Array)) {
				memberIds = [memberIds];
			}
			this.expectedStream.memberIds = ArrayUtilities.difference(this.stream.memberIds, memberIds);
			this.expectedStream.memberIds.sort();
			callback();
		});
	}
}

module.exports = RemoveUsersFetchTest;
