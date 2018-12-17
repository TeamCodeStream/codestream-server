'use strict';

const UnpinPostTest = require('./unpin_post_test');
const ObjectID = require('mongodb').ObjectID;

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
			this.data.codemarkId = ObjectID();
			callback();
		});
	}
}

module.exports = CodemarkNotFoundTest;
