'use strict';

const PostMarkerTest = require('./post_marker_test');
const Assert = require('assert');

class ExtendedAttributesTest extends PostMarkerTest {

	get description () {
		return 'should return the marker with extended attributes when creating a marker with extended attributes';
	}
    
	// form the data we'll use in creating the post
	makeMarkerData (callback) {
		super.makeMarkerData(() => {
			this.extendedData = {
				type: 'comment',
				status: 'open',
				color: 'red'
			};
			Object.assign(this.data, this.extendedData);
			callback();
		});
	}

	// validate the response to the post request
	validateResponse (data) {
		['type', 'status', 'color'].forEach(attribute => {
			Assert.equal(data.marker[attribute], this.extendedData[attribute], `attribute ${attribute} not correct in marker response`);
		});
		super.validateResponse(data);
	}
}

module.exports = ExtendedAttributesTest;
