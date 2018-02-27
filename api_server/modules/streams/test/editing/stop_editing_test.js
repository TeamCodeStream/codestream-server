'use strict';

const EditingTest = require('./editing_test');

class StopEditingTest extends EditingTest {

	constructor (options) {
		super(options);
		this.wantAlreadyEditing = true;
		this.wantStopEditing = true;
	}

	get description () {
		return 'should remove editingUsers entry for current user when they indicate they are no longer editing a file';
	}
}

module.exports = StopEditingTest;
