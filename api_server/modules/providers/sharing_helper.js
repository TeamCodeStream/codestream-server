'use strict';

class SharingHelper {

	constructor (options) {
		Object.assign(this, options);
		
		this.log = this.request.log;
		this.logger = this.request.logger;
	}

	async sharePost (post, destination, parentText) {
		return undefined;
	}
}

module.exports = SharingHelper;