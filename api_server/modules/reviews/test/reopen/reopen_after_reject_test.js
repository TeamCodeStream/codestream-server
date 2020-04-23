'use strict';

const ReopenTest = require('./reopen_test');

class ReopenAfterRejectTest extends ReopenTest {

	constructor (options) {
		super(options);
		this.rejectToClose = true;
	}

	get description () {
		return 'should return directives to update a review when reopening a review that was rejected';
	}
}

module.exports = ReopenAfterRejectTest;
