'use strict';

const FetchTest = require('./fetch_test');

class FetchAlreadyRelatedCodemarkTest extends FetchTest {

	constructor (options) {
		super(options);
		this.doPreRelatedCodemarks = true;
	}

	get description () {
		return 'should be ok to remove the relation for a codemark that is already related to another codemark, checked by fetching the related codemarks';
	}
}

module.exports = FetchAlreadyRelatedCodemarkTest;
