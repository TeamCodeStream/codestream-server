// base class for many tests of the "PUT /editing" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class EditingTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return an op to update editingUsers when a user indicates they are editing the file for a stream';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/editing';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back the expected response
		Assert(data.streams, 'no streams in response');
		const stream = data.streams[0];
		if (this.wantStopEditing) {
			Assert(stream.$unset, 'no $unset in stream response');
			const unsetKey = `editingUsers.${this.currentUser.user.id}`;
			Assert(stream.$unset[unsetKey], 'no editingUsers for current user in stream.$unset response');
			Assert(stream.$unset[unsetKey] === true, 'unset key is not false');
		}
		else {
			Assert(stream.$set, 'no $set in stream response');
			const setKey = `editingUsers.${this.currentUser.user.id}`;
			Assert(stream.$set[setKey], 'no editingUsers for current user in stream.$set response');
			const editing = stream.$set[setKey];
			Assert(editing.startedAt > this.editedAfter, 'startedAt for edit is not greater than before the editing was indicated');
			Assert(editing.commitHash === this.data.editing.commitHash, 'commitHash does not match');
		}
		Assert(stream.$set.modifiedAt > this.editedAfter, 'modifiedAt is not greater than before the editing was indicated');
	}
}

module.exports = EditingTest;
