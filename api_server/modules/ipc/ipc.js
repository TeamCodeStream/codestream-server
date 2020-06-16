'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
const IPC = require('node-ipc');

class IPCModule extends APIServerModule {

	services () {
		return async () => {
			if (!this.api.config.api.mockMode) {
				return;	// only needed in "mock mode"
			}
			IPC.config.id = this.api.config.ipc.serverId;
			IPC.config.silent = true;
			IPC.serve();
			IPC.server.start();
			return { ipc: this };
		};
	}

	on (type, callback) {
		IPC.server.on(type, callback);
	}

	stop () {
		IPC.server.stop();
	}

	emit (socket, type, data) {
		IPC.server.emit(socket, type, data);
	}
}

module.exports = IPCModule;
