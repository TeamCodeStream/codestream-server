'use strict';

const PutCodemarkTest = require('./put_codemark_test');

class SetAssigneesTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.codemarkType = 'issue';
	}

	get description () {
		return 'should return the updated codemark when updating an issue codemark with assignees';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 3;
			callback();
		});
	}

	getCodemarkUpdateData () {
		const data = super.getCodemarkUpdateData();
		data.assignees = [this.users[1].user._id, this.users[2].user._id];
		return data;
	}
}

module.exports = SetAssigneesTest;