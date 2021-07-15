'use strict';

const PutCodeErrorFetchTest = require('./put_code_error_fetch_test');
const AddAssigneesTest = require('./add_assignees_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class AddAssigneesFetchTest extends Aggregation(AddAssigneesTest, PutCodeErrorFetchTest) {

	get description () {
		return 'should properly update a code error when requested, when several assignees are added to the code error, checked by fetching the code error';
	}

	updateCodeError (callback) {
		super.updateCodeError(error => {
			if (error) { return callback(error); }
			delete this.expectedCodeError.$addToSet;
			let assignees = this.requestData.$addToSet.assignees;
			if (!(assignees instanceof Array)) {
				assignees = [assignees];
			}
			this.expectedCodeError.assignees = [
				...(this.codeError.assignees || []),
				...assignees
			];
			this.expectedcodeError.followerIds = [
				...(this.codeError.followerIds || []),
				...assignees
			];
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

module.exports = AddAssigneesFetchTest;
