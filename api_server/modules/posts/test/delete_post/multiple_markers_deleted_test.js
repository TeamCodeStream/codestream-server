'use strict';

var DeletePostTest = require('./delete_post_test');

class MultipleMarkersDeletedTest extends DeletePostTest {

	constructor (options) {
		super(options);
		this.wantCodeBlocks = 5;
	}

	get description () {
		return 'should delete all associated markers when a post is deleted';
	}
}

module.exports = MultipleMarkersDeletedTest;
