'use strict';

const UnpinPostTest = require('./unpin_post_test');
const ObjectId = require('mongodb').ObjectId;

class CodemarkNotFoundTest extends UnpinPostTest {

	get description () {
		return 'should return an error when trying to unpin a post from a codemark that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'codemark'
		};
	}

	makeRequestData (callback) {
		super.makeRequestData(() => {
			this.data.codemarkId = ObjectId();
			callback();
		});
	}
}

module.exports = CodemarkNotFoundTest;
