// Coerce strings and numbers to boolean
function isTruthy (value) {
	if (value === undefined || value === null) {
		return false;
	}
	return value === true || (typeof value === 'string' && value.toLowerCase() === 'true') || value === '1' || value === 1;
}

module.exports = {
	isTruthy
};
