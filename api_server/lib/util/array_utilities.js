'use strict';

module.exports = {

	has_common_element: function(array1, array2) {
		return array1.find(elem => {
			return array2.indexOf(elem) !== -1;
		});
	},

	has_all_elements: function(array1, array2) {
		return !array2.find(elem => {
			return array1.indexOf(elem) === -1;
		});
	}

};
