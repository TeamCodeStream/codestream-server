
// This provides a configuration initialization hook, used when a brand new
// config is written to the database for the very first time (via the structured
// config class).
//
// This will generate random secrets, an installation ID and optionally, the
// public facing hostname and ports used for the Single Linux Host On-Prem
// installation type.
//
// It's generic enough to be used for all intended new-config setups.

const UUID = require('uuid').v4;
const RandomString = require('randomstring');
const Fs = require('fs');
const Url = require('url');
const Interpolate = require('./interpolate');

function getRandomIntBetween(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

const importSslKeys = (cfg) => {
	if (!cfg.ssl) return;
	const cert = {};
	if (cfg.ssl.cafile) cert.caChain = Fs.readFileSync(Interpolate(cfg.ssl.cafile), { encoding: 'utf8' });
	if (cfg.ssl.certfile) cert.cert = Fs.readFileSync(Interpolate(cfg.ssl.certfile), { encoding: 'utf8' });
	if (cfg.ssl.keyfile) cert.key = Fs.readFileSync(Interpolate(cfg.ssl.keyfile), { encoding: 'utf8' });
	if (Object.keys(cert).length) {
		console.log('public api url:', Interpolate(cfg.apiServer.publicApiUrl));
		cert.targetName = Url.parse(Interpolate(cfg.apiServer.publicApiUrl)).host;
		cert.requireStrictSSL = cfg.ssl.requireStrictSSL;
		cfg.sslCertificates = {};
		cfg.sslCertificates.default = cert;
		console.log(`adding certificate for ${cert.targetName} as default`);
		cfg.ssl.cafile = null;
		cfg.ssl.certfile = null;
		cfg.ssl.keyfile = null;
	}
};

// this hook is called when a structured configuration file is loaded into the
// database for the very first time.
const firstConfigInstallationHook = (nativeCfg) => {
	console.log('inside firstConfigInstallationHook');

	// installation id
	if (!nativeCfg.sharedGeneral.installationId) nativeCfg.sharedGeneral.installationId = UUID();

	// secrets / random strings
	Object.keys(nativeCfg.sharedSecrets).forEach((prop) => {
		if (!nativeCfg.sharedSecrets[prop])
			nativeCfg.sharedSecrets[prop] = RandomString.generate(getRandomIntBetween(15, 30));
	});
	if ('codestreamBroadcaster' in nativeCfg.broadcastEngine) {
		if (!nativeCfg.broadcastEngine.codestreamBroadcaster.secrets.api)
			nativeCfg.broadcastEngine.codestreamBroadcaster.secrets.api = RandomString.generate(
				getRandomIntBetween(15, 30)
			);
		if (!nativeCfg.broadcastEngine.codestreamBroadcaster.secrets.auth)
			nativeCfg.broadcastEngine.codestreamBroadcaster.secrets.auth = RandomString.generate(
				getRandomIntBetween(15, 30)
			);
	}

	// if this property is null, we expect the public facing hostname and ports to have
	// been passed to this routine via environment variables.
	if (!nativeCfg.apiServer.publicApiUrl) {
		console.log('apiServer.publicApiUrl is not defined');
		const publicPort = process.env.CS_API_SET_PORT
			? parseInt(process.env.CS_API_SET_PORT)
			: 80;
		nativeCfg.apiServer.port = publicPort;

		if ('codestreamBroadcaster' in nativeCfg.broadcastEngine) {
			nativeCfg.broadcastEngine.codestreamBroadcaster.port = process.env
				.CS_API_SET_PUBLIC_BROADCASTER_PORT
				? parseInt(process.env.CS_API_SET_PUBLIC_BROADCASTER_PORT)
				: 12080;
		}

		if (process.env.CS_API_SET_PUBLIC_API_URL) {
			nativeCfg.apiServer.publicApiUrl = process.env.CS_API_SET_PUBLIC_API_URL;
			if ('codestreamBroadcaster' in nativeCfg.broadcastEngine) {
				nativeCfg.broadcastEngine.codestreamBroadcaster.host = Url.parse(
					nativeCfg.apiServer.publicApiUrl
				).host;
			}
		} else {
			const publicHostName = process.env.CS_API_SET_PUBLIC_HOST || 'localhost';
			const sufx = publicPort == 80 ? '' : ':' + publicPort;
			nativeCfg.apiServer.publicApiUrl = `http://${publicHostName}${sufx}`;
			if ('codestreamBroadcaster' in nativeCfg.broadcastEngine) {
				nativeCfg.broadcastEngine.codestreamBroadcaster.host = publicHostName;
			}
		}
	}

	// if certificate files exist, import the actual certs and keys into the config
	importSslKeys(nativeCfg);
};

module.exports = firstConfigInstallationHook;
