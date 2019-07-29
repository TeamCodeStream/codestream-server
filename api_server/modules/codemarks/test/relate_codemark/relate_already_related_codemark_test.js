'use strict';

const RelateCodemarkTest = require('./relate_codemark_test');

class RelateAlreadyRelatedCodemarkTest extends RelateCodemarkTest {

	constructor (options) {
		super(options);
		this.doPreRelatedCodemarks = true;
	}

	get description () {
		return 'should be ok to relate a codemark that is already related to another codemark';
	}
}

module.exports = RelateAlreadyRelatedCodemarkTest;
