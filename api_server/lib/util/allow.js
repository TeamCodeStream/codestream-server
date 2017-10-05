'use strict';

var _find_attribute = function(allowed_attributes, attribute) {
	if (allowed_attributes instanceof Array) {
		return allowed_attributes.indexOf(attribute) !== -1;
	}
	else if (typeof allowed_attributes === 'object') {
		let types = Object.keys(allowed_attributes);
		let index = types.findIndex(type => {
			return _find_attribute(allowed_attributes[type], attribute);
		});
		if (index !== -1) {
			return types[index];
		}
		else {
			return false;
		}
	}
};

var _type_matches = function(value, type) {
	if (['object', 'string', 'number'].indexOf(type) !== -1) {
		return typeof value === type;
	}
	else if (type === 'array') {
		return value instanceof Array;
	}
	else if (type.startsWith('array')) {
		let match = type.match(/^array\((.+)\)$/);
		if (!match) {
			return false;
		}
		return value instanceof Array &&
			!value.find(elem => { return typeof elem !== match[1]; });
	}
	else {
		return false;
	}
};

module.exports = function(object, allowed_attributes) {
	if (typeof object !== 'object') { return; }
	Object.keys(object).forEach(attribute => {
		let type = _find_attribute(allowed_attributes, attribute);
		if (
			type !== true &&
			(
				type === false ||
				!_type_matches(object[attribute], type)
			)
		) {
			delete object[attribute];
		}
	});
};
