const Config = require('./config');
const OutboundEmailServer = require('./outboundEmailServer');

var OutboundEmailService;

exports.handler = async function(event) {
	try {
		console.log('GOT AN EVENT: ' + JSON.stringify(event, undefined, 5));
		const config = Object.assign({}, Config, { dontListen: true });
		if (!OutboundEmailService) {
			OutboundEmailService = new OutboundEmailServer(config);
			try {
				await OutboundEmailService.start();
			}
			catch (error) {
				console.error('server failed to start: ' + error); // eslint-disable-line no-console
				process.exit();	
			}
		}
		console.log('SERVICE STARTED');
		console.log('CALLING lambda');
		await OutboundEmailService.lambda(event);
		console.log('CALLED lambda');
	}
	catch (error) {
		console.warn('Error processing lambda event:', error);
		throw error;
	}
}
 
