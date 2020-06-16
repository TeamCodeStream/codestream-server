'use strict';

const UnrelateCodemarkTest = require('./unrelate_codemark_test');

class UnrelateAlreadyRelatedCodemarkTest extends UnrelateCodemarkTest {

	constructor (options) {
		super(options);
		this.doPreRelatedCodemarks = true;
	}

	get description () {
		return 'should be ok to remove the relation for a codemark even if it is already related to another codemark, the relation with the other codemark should be preserved';
	}
}

module.exports = UnrelateAlreadyRelatedCodemarkTest;
