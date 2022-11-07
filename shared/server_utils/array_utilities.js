// provides some utility array functions ... if this gets too big we can just start
// using lodash or something, but so far we don't really need all that much

'use strict';

module.exports = {

	// does array1 and array2 have at least element in common?
	hasCommonElement: function(array1, array2) {
		return array1.find(elem => {
			return array2.includes(elem);
		});
	},

	// does array1 have all the elements in array2 (is it a superset)?
	hasAllElements: function(array1, array2) {
		return !array2.find(elem => {
			return !array1.includes(elem);
		});
	},

	// get all the elements in array1 that are not in array2
	difference: function(array1, array2) {
		return array1.filter(elem => !array2.includes(elem));
	},

	// get all the elements in array1 that are also in array2
	intersection: function(array1, array2) {
		return array1.filter(elem => array2.includes(elem));
	},
	
	// get all the elements in array1 and all the elements in array2, 
	// but avoid redundancies
	union: function(array1, array2) {
		return array1.concat(array2.filter(elem => !array1.includes(elem)));
	},

	unique: function(arr) {
		return arr.reduce((a, elem) => {
			if (a.indexOf(elem) === -1) {
				a.push(elem);
			}
			return a;
		}, []);
	}
};

