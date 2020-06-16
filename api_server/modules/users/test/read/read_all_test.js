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
		this.expectedData = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					version: 4
				},
				$unset: {
					lastReads: true,
				},
				$version: {
					before: 3,
					after: 4
				}
			}
		};
		callback();
	}
}

module.exports = ReadAllTest;
