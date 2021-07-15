'use strict';

const ResolveTest = require('./resolve_test');
const Assert = require('assert');

class AlreadyResolvedTest extends ResolveTest {

	get description () {
		return 'should return directive to update just the resolvedAt if user resolves a code error they have already resolved';
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.secondRun = true;
			delete this.expectedResponse.codeError.$set[`resolvedBy.${this.currentUser.user.id}`];
			this.expectedResponse.codeError.$set[`resolvedBy.${this.currentUser.user.id}.resolvedAt`] = Date.now();
			this.expectedResponse.codeError.$set.resolvedAt = Date.now();
			this.expectedResponse.codeError.$set.version = 3;
			this.expectedResponse.codeError.$version = {
				before: 2,
				after: 3
			};
			super.run(callback);
		});
	}

	validateResponse (data) {
		if (!this.secondRun) {
			return super.validateResponse(data);
		}

		// verify modifiedAt was updated, and then set it so the deepEqual works
		const codeError = data.codeError;
		const key = `resolvedBy.${this.currentUser.user.id}.resolvedAt`;
		Assert(codeError.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the code error was updated');
		this.expectedResponse.codeError.$set.modifiedAt = codeError.$set.modifiedAt;
		Assert(codeError.$set[key] >= this.modifiedAfter, 'resolvedAt is not greater than before the code error was updated');
		this.expectedResponse.codeError.$set[key] = codeError.$set[key];
		Assert(codeError.$set.resolvedAt >= this.modifiedAfter, 'resolvedAt is not greater than before the code error was updated');
		this.expectedResponse.codeError.$set.resolvedAt = codeError.$set.resolvedAt;
		Assert.deepStrictEqual(data, this.expectedResponse, 'response data is not correct');
	}
}

module.exports = AlreadyResolvedTest;
