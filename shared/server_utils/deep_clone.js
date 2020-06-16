// provides a cheap deep clone functions

'use strict';

module.exports = (data) => {
	// really cheap...
	let stringified = JSON.stringify(data);
	let cloned = null;
	try {
		cloned = JSON.parse(stringified);
	}
	catch (error) {
		// shouldn't really happen, should it?
	}
	return cloned;
};
