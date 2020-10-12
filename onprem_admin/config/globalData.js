
var _GlobalData;
if (!global._GlobalData) {
	global._GlobalData = {
		MongoStructuredConfig: null, // a generic structured config object to manage configurations
		AdminConfig: null, // the structured config object created for the admin server
		// Config: null, // the current admin server configuration
		Installation: null, // data about the installation (versions, type, ...)
		Logger: null, // simple file logger object (server-side logging)
		MongoClient: null, // for mongo connections
		SystemStatusMonitor: null,	// system status monitor
	};
}

module.exports = global._GlobalData;
