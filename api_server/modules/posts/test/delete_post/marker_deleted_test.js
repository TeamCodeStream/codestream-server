'use strict';

var DeletePostTest = require('./delete_post_test');

class MarkerDeletedTest extends DeletePostTest {

	constructor (options) {
		super(options);
		this.wantCodeBlocks = 1;
	}

	get description () {
		return `should delete associated markers when a post is deleted`;
	}
}

module.exports = MarkerDeletedTest;
