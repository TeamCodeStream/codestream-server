module.exports = (request, userId) => {
	const { tokenHandler } = request.api.services;
	const accessToken = tokenHandler.generate({ uid: userId });
	const minIssuance = tokenHandler.decode(accessToken).iat * 1000;
	console.warn('************** ACCESS TOKEN CREATOR INVOKED:', { accessToken, minIssuance });
	return { accessToken, minIssuance };
};