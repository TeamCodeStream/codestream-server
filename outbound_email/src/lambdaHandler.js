const Config = require('./config');
const OutboundEmailServer = require('./outboundEmailServer');

var OutboundEmailService;

exports.handler = async function(event) {
	try {
		const config = Object.assign({}, Config, { dontListen: true });
		if (!OutboundEmailService) {
			OutboundEmailService = new OutboundEmailServer(config);
			try {
				await OutboundEmailService.start();
			}
			catch (error) {
				const msg = error instanceof Error ? error.message : JSON.stringify(error);
				console.error('server failed to start: ' + msg); // eslint-disable-line no-console
				process.exit();	
			}
		}
		await OutboundEmailService.lambda(event);
	}
	catch (error) {
		console.warn('Error processing lambda event:', error);
		throw error;
	}
};
 