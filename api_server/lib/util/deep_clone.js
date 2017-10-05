'use strict';

module.exports = (data) => {
	var stringified = JSON.stringify(data);
	var cloned = null;
	try {
	        cloned = JSON.parse(stringified);
	}
	catch (error) {
	        // shouldn't really happen, should it?
	}
	return cloned;
};
