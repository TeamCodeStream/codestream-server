
// a proper mongo url parser

// FIXME: this should probably be moved to server_utils/mongo/mongo_client or something
module.exports = function(mongoUrl) {
	let parsed = mongoUrl.match(/^mongodb:\/\/([^/]+)\/([^?]+?)((\?)(.+))?$/);
	const results = {
		serversAuthString: parsed[1],
		user: null,
		pass: null,
		servers: [],
		database: parsed[2],
		optionsString: parsed[5],
		options: {}
	};
	parsed = results.serversAuthString.match(/^(([^:]+)(:(.+))?@)?(.+)$/);
	results.user = parsed[2];
	results.pass = parsed[4];
	results.serverList = parsed[5];
	results.serverList.split(',').forEach(function (serverAndPort) {
		let parts = serverAndPort.split(':');
		results.servers.push({
			host: parts[0],
			port: parts[1] || 27017
		});
	});
	if (results.optionsString) {
		results.optionsString.split('&').forEach(function (optionAssignment) {
			let optionPair = optionAssignment.split('=');
			results.options[optionPair[0]] = optionPair[1];
		});
	}
	return results;
};
