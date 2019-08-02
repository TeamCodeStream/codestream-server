'use strict';

const RelatedCodemarksTest = require('./related_codemarks_test');
const ObjectID = require('mongodb').ObjectID;

class RelatedCodemarkNotFoundTest extends RelatedCodemarksTest {

	get description () {
		return 'should return an error when attempting to update a codemark with a related codemark that does not exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'related codemarks'
		};
	}

	init (callback) {
		// add a non-existent codemark to the related codemarks
		super.init(error => {
			if (error) { return callback(error); }
			this.data.relatedCodemarkIds.push(ObjectID());
			callback();
		});
	}
}

module.exports = RelatedCodemarkNotFoundTest;
