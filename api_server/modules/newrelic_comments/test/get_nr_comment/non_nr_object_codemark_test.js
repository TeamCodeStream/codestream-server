'use strict';

const NonNRObjectTest = require('./non_nr_object_test');

class NonNRObjectCodemarkTest extends NonNRObjectTest {

	get description () {
		return 'should return an error when trying to fetch a post that is a reply to a codemark';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				wantCodemark: 1,
				wantMarkers: 1
			});
			callback();
		});
	}
}

module.exports = NonNRObjectCodemarkTest;
