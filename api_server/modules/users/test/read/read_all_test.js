'use strict';

const ReadTest = require('./read_test');

class ReadAllTest extends ReadTest {

	get description () {
		return 'should clear all of lastReads for the current user when requested';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/read/all';
			callback();
		});
	}

	setExpectedData (callback) {
		const expectedVersion = this.currentUser.user.version + 1;
		this.expectedData = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					version: expectedVersion
				},
				$unset: {
					lastReads: true,
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
				}
			}
		};
		callback();
	}
}

module.exports = ReadAllTest;
