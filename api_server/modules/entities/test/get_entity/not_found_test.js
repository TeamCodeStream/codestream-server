'use strict';

const GetEntityTest = require('./get_entity_test');
const ObjectId = require('mongodb').ObjectId;

class NotFoundTest extends GetEntityTest {

	get description () {
		return 'should return an error when trying to fetch a New Relic entity that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		super.before (error => {
			// substitute a non-existent entity ID
			if (error) { return callback(error); }
			this.path = '/entities/' + ObjectId();
			callback();
		});
	}
}

module.exports = NotFoundTest;
