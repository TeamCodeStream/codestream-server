'use strict';

module.exports = (data) => {
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
