'use strict';

const PutCodeErrorFetchTest = require('./put_code_error_fetch_test');
const AddRemoveAssigneesTest = require('./add_remove_assignees_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class AddRemoveAsigneesFetchTest extends Aggregation(AddRemoveAssigneesTest, PutCodeErrorFetchTest) {

	get description () {
		return 'should properly update a code error when requested, when assignees are both added to and removed from the code error, checked by fetching the code error';
	}

	updateCodeError (callback) {
		super.updateCodeError(error => {
			if (error) { return callback(error); }
			this.expectedCodeError.assignees = this.codeError.assignees;
			this.expectedCodeError.assignees.push(...this.addUserIds);
			this.expectedCodeError.followerIds = this.codeError.followerIds;
			this.expectedCodeError.followerIds.push(...this.addUserIds);
			this.removeUserIds.forEach(removeUserId => {
				const index = this.expectedCodeError.assignees.findIndex(userId => userId === removeUserId);
				this.expectedCodeError.assignees.splice(index, 1);
			});
			this.expectedCodeError.assignees.sort();
			this.expectedCodeError.followerIds.sort();
			callback();
		});
	}

	validateResponse (data) {
		data.codeError.assignees.sort();
		data.codeError.followerIds.sort();
		super.validateResponse(data);
	}
}

module.exports = AddRemoveAsigneesFetchTest;
