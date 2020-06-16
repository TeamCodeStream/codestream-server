'use strict';

const CodemarkLinkTest = require('./codemark_link_test');
const ObjectID = require('mongodb').ObjectID;

class InvalidCodemarkIdTest extends CodemarkLinkTest {

	get description () {
		return 'should return an error when attempting to create a codemark link for an invalid codemark';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'codemark'
		};
	}

	createCodemark (callback) {
		// substitute an invalid codemark ID after creating the codemark
		super.createCodemark(error => {
			if (error) { return callback(error); }
			this.path = `/codemarks/${ObjectID()}/permalink`;
			callback();
		});
	}
}

module.exports = InvalidCodemarkIdTest;
