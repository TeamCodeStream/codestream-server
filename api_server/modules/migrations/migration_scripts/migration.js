// base class for all migration handlers

'use strict';

class Migration {

	constructor (options) {
		Object.assign(this, options);
	}

	get description () {
		throw 'Must override description getter for this migration!';
	}

	execute () {
		throw 'Must override execute() for this migration!';
	}

	verify () {
		throw 'Must override verify() for this migration!';
	}

	log (message) {
		this.logger.log(message);
	}
}

module.exports = Migration;