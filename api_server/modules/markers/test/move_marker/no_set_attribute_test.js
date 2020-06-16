'use strict';

const MoveTest = require('./move_test');
const RandomString = require('randomstring');
const Assert = require('assert');

class NoSetAttributeTest extends MoveTest {

	get description () {
		return `should not be able to set ${this.attribute} when moving the location of a marker`;
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.existingValue = this.marker[this.attribute];
			this.data[this.attribute] = RandomString.generate(10);
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(data.markers[0][this.attribute], this.existingValue, `${this.attribute} was set in created marker`);
		super.validateResponse(data);
	}
}

module.exports = NoSetAttributeTest;
