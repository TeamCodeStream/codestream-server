'use strict';

const SetPostIdTest = require('./set_post_id_test');

class NoAttributeTest extends SetPostIdTest {

	get description () {
		return `should return an error when trying to update a marker with a post ID but no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	makeMarkerData (callback) {
		super.makeMarkerData(error => {
			if (error) { return callback(error); }
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
