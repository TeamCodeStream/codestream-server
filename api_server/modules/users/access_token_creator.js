module.exports = (request, userId) => {
	const { tokenHandler } = request.api.services;
	const token = tokenHandler.generate({ uid: userId });
	const minIssuance = tokenHandler.decode(token).iat * 1000;
	return { token, minIssuance };
};