'use strict';

const GetNRCommentsTest = require('./get_nr_comments_test');

class NotFoundTest extends GetNRCommentsTest {

	get description () {
		return 'should return an error when trying to fetch New Relic comments for an object that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	setPath (callback) {
		super.setPath(error => {
			if (error) { return callback(error); }
			const objectId = this.codeErrorFactory.randomObjectId();
			this.path = `/nr-comments?objectId=${objectId}&objectType=${this.objectType}`;
			callback();
		});
	}
}

module.exports = NotFoundTest;
