'use strict';

const MarkerTest = require('./marker_test');

class NoProviderTypeWithLinkTest extends MarkerTest {

	constructor (options) {
		super(options);
		this.codemarkType = 'link';
		this.expectProviderType = false;
	}

	get description () {
		return 'should be able to create a link codemark without a provider type';
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			delete this.data.providerType;
			delete this.data.postId;
			delete this.data.streamId;
			callback();
		});
	}
}

module.exports = NoProviderTypeWithLinkTest;
