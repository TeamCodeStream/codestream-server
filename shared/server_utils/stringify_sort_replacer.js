
// A replacer function for use with JSON.stringify() to sort property values
module.exports = function stringifySortReplacer(key, value) {
	if (value == null || value.constructor != Object) {
		return value
	}
	return Object.keys(value).sort().reduce((s, k) => { s[k] = value[k]; return s }, {})
}
