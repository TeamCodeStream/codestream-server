

function getDottedPropertyArray(obj, nestedProps) {
	if (typeof obj === 'undefined') return undefined;
	if (!nestedProps.length) return obj;
	if (nestedProps.length === 1) return obj[nestedProps[0]];
	return getDottedPropertyArray(obj[nestedProps[0]], nestedProps.slice(1));
}

export function getDottedProperty(obj, dottedNotation) {
	return getDottedPropertyArray(obj, dottedNotation.split('.'));
}



// dotPropertyInit(state, 'prop1.prop2.prop3') =>
// state: {
//    prop1: {
//        prop2: {
//           prop3: {
//           }
//        }
//    }
// }
//
// dotPropertyInit(state, 'prop1.prop2.prop3', someValue) =>
// state: {
//    prop1: {
//        prop2: {
//           prop3: someValue
//        }
//    }
// }

function dotPropertyInit(obj, nestedProps, targetValue) {
	if (nestedProps.length) {
		// console.debug(`dotPropertyInit() evaluating prop=${nestedProps[0]}, targetVal=${targetValue}`);
		if (!obj[nestedProps[0]]) obj[nestedProps[0]] = {}; 
		if (typeof targetValue !== 'undefined' && nestedProps.length === 2) {
			// console.debug(`dotPropertyInit() setting ${nestedProps[0]}.${nestedProps[1]} = ${targetValue}`);
			obj[nestedProps[0]][nestedProps[1]] = targetValue;
			return;
		}
		// console.debug('dotPropertyInit() diving deeper');
		dotPropertyInit(obj[nestedProps[0]], nestedProps.slice(1), targetValue);
	}
}

// module.exports = function (obj, dottedNotation) {
export default function(obj, dottedNotation, targetValue) {
	return dotPropertyInit(obj, dottedNotation.split('.'), targetValue);
};
