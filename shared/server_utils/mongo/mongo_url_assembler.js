
// assemble a mongo url from a parsed object (mongo_url_parser)

// mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/[defaultauthdb][?options]]

// FIXME: this should probably be moved to server_utils/mongo/mongo_client or something

module.exports = function(mongoConnectData) {
	let url = 'mongodb://';

	if (mongoConnectData.user) {
		url += mongoConnectData.user;
		if (mongoConnectData.pass) url += `:${mongoConnectData.pass}`;
		url += '@';
	}

	let first = true;
	mongoConnectData.servers.forEach(server => {
		if (!first) {
			url += ',';
		} else {
			first = false;
		}
		url += server.host;
		if (server.port) url += `:${server.port}`;
	});

	url += mongoConnectData.database;

	if (Object.keys(mongoConnectData.options).length) {
		url += '?';
		first = true
		Object.keys(mongoConnectData.options).forEach(opt => {
			if (!first) {
				url += '&';
			} else {
				first = false;
			}
			url += `${opt}=${mongoConnectData.options[opt]}`;
		});
	}
	return url;
};
