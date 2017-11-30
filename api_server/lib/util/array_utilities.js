'use strict';

module.exports = {

	hasCommonElement: function(array1, array2) {
		return array1.find(elem => {
			return array2.indexOf(elem) !== -1;
		});
	},

	hasAllElements: function(array1, array2) {
		return !array2.find(elem => {
			return array1.indexOf(elem) === -1;
		});
	},

	difference: function(array1, array2) {
		return array1.filter(elem => array2.indexOf(elem) === -1);
	},

	intersection: function(array1, array2) {
		return array1.filter(elem => array2.indexOf(elem) !== -1);
	}
};
