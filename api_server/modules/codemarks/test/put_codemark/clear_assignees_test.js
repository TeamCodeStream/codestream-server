'use strict';

const PutCodemarkTest = require('./put_codemark_test');

class ClearAssigneesTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.codemarkType = 'issue';
		this.goPostless = true;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 3;
			callback();
		});
	}

	get description () {
		return 'should return the updated codemark when updating an issue codemark by clearing assignees';
	}

	getPostlessCodemarkData () {
		const data = super.getPostlessCodemarkData();
		data.assignees = [this.users[1].user._id, this.users[2].user._id];
		return data;
	}

	getCodemarkUpdateData () {
		const data = super.getCodemarkUpdateData();
		data.assignees = [];
		return data;
	}
}

module.exports = ClearAssigneesTest;