// parse database out of a mongo url
// here we are superseding earlier mongo url parsing (code comment out below) which parsed out a lot
// more ... but with DNS-lookup based urls, we don't purport to return any other information besides
// the database
function ExtractDbFromMongoUrl (url) {
	let parsed = url.match(/^mongodb(?:\+srv)?:\/\/([^/]+)\/([^?]+?)((\?)(.+))?$/);
	if (parsed && parsed[2]) {
		return parsed[2];
	}
}

/*

// a proper mongo url parser

// FIXME: this should probably be moved to server_utils/mongo/mongo_client or something
module.exports = function(mongoUrl) {
	let parsed = mongoUrl.match(/^mongodb(?:\+srv):\/\/([^/]+)\/([^?]+?)((\?)(.+))?$/);
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

*/

module.exports = ExtractDbFromMongoUrl;

