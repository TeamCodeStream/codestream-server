'use strict';

const NumRepliesTest = require('./num_replies_test');

class NumRepliesCodemarkTest extends NumRepliesTest {

	get description () {
		return 'should decrement numReplies for the parent post\'s codemark when the child post is deleted';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.postData[0].wantCodemark = true;
			callback();
		});
	}

	setExpectedData (callback) {
		super.setExpectedData(() => {
			this.expectedData.codemarks = [{
				_id: this.postData[0].codemark.id,	// DEPRECATE ME
				id: this.postData[0].codemark.id,
				$set: {
					numReplies: 2,
					version: 5
				},
				$version: {
					before: 4,
					after: 5
				}
			}];
			callback();
		});
	}
}

module.exports = NumRepliesCodemarkTest;
