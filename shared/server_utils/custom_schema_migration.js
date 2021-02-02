
const removeAssetEnvironment = (cfg) => {
	// assetEnvironment is no longer a config property
	if ('assetEnvironment' in cfg.apiServer) {
		delete cfg.apiServer.assetEnvironment;
	}
	if ('codestreamBroadcaster' in cfg.broadcastEngine && 'assetEnvironment' in cfg.broadcastEngine.codestreamBroadcaster) {
		delete cfg.broadcastEngine.codestreamBroadcaster.assetEnvironment;
	}
	if ('outboundEmailServer' in cfg && 'assetEnvironment' in cfg.outboundEmailServer) {
		delete cfg.outboundEmailServer.assetEnvironment;
	}
	if ('inboundEmailServer' in cfg && 'assetEnvironment' in cfg.inboundEmailServer) {
		delete cfg.inboundEmailServer.assetEnvironment;
	}
}

const from15To16 = (nativeCfg, from, to, logger) => {
	logger.log('migrating from schema version 15 to 16...')
	removeAssetEnvironment(nativeCfg);
	// modify the config in some way
	// return X; // return a new object if you want to replace nativeCfg
};

const from17To18 = (nativeCfg) => {
	console.log('migrating from schema 17 to 18...')
	// modify the config in some way
	// return X; // return a new object if you want to replace nativeCfg
};

// sequence matters!
const MigrationMatrix = [
	// [from-schema, to-schema, migrationFunc]
	[15, 16, from15To16],
	[17, 18, from17To18],
];

module.exports = MigrationMatrix;
