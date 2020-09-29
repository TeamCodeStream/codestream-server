
function recursiveInit(obj, nestedProps) {
	if (nestedProps.length) {
		if (!obj[nestedProps[0]]) {
			obj[nestedProps[0]] = {};
		} 
		recursiveInit(obj[nestedProps[0]], nestedProps.slice(1));
	}

}
// module.exports = function (obj, dottedNotation) {
export default function(obj, dottedNotation) {
	return recursiveInit(obj, dottedNotation.split('.'));
};
