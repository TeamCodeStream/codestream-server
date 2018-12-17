'use strict';

const PinPostTest = require('./pin_post_test');
const ObjectID = require('mongodb').ObjectID;

class CodemarkNotFoundTest extends PinPostTest {

	get description () {
		return 'should return an error when trying to pin a post to a codemark that doesn\'t exist';
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
