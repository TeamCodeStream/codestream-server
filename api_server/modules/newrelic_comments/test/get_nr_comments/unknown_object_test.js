'use strict';

const GetNRCommentsTest = require('./get_nr_comments_test');

class UnknownObjectTest extends GetNRCommentsTest {

	get description () {
		return 'should return an empty array when trying to fetch New Relic comments for an object that doesn\'t have an associated code error';
	}

	setPath (callback) {
		super.setPath(error => {
			if (error) { return callback(error); }
			const objectId = this.codeErrorFactory.randomObjectId();
			this.path = `/nr-comments?objectId=${objectId}&objectType=${this.objectType}`;
			this.expectedResponse = [];
			callback();
		});
	}

	createNRComments (callback) {
		super.createNRComments(error => {
			if (error) { return callback(error); }
			this.expectedResponse = [];
			callback();
		});
	}
}

module.exports = UnknownObjectTest;
