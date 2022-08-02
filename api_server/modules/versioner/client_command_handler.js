// class for determining what commands a given client needs to execute, if any,
// and sending those commands in the response to an incoming request

const COMMAND_INFO = {
	'logout': {
		supersedes: '__all'
	},
	'reload': {
		supersedes: ['hello']
	},
	'hello': {
		
	}
};

class ClientCommandHandler {

	constructor (options) {
		Object.assign(this, options);
	}

	async handleClientCommands (request, response) {
		this.request = request;
		this.response = response;

		// only do this for clients that are sending the header
		if (!this.request.headers['x-cs-command-index']) {
			return;
		}

		// this is the command index the client is currently at, indicating which commands it has
		// already executed
		this.clientCommandIndex = parseInt(this.request.headers['x-cs-command-index'] || 0, 10);
		if (isNaN(this.clientCommandIndex)) {
			return;
		}

		// get all the client commands we know about
		// note - here we rely on the fact that mongo should cache this, and it will change very infrequently,
		// so no hint is required to run this query, it should run lightning fast most of the time
		this.allClientCommands = await this.api.data.clientCommands.getByQuery(
			{},
			{
				sort: { index: 1 },
				overrideHintRequired: true
			}
		);

		// compiles which commands the client should execute, based on their current index and which
		// commands might supercede others, which depends on the character of the individual commands
		await this.compileCommandsToExecute();

		// set the commands to execute in the response header
		if (this.clientCommands.length > 0) {
			const highestIndex = this.allClientCommands[this.allClientCommands.length - 1].index;
			const clientCommandHeader = `${highestIndex}|!|` + this.clientCommands.map(command => {
				let desc = `${command.command}`;
				if (command.data) {
					desc += `:!:${JSON.stringify(command.data)}`;
				}
				return desc;
			}).join('|!|');
			this.api.log(`${request.id} request will include instructions for client to execute these commands: ${clientCommandHeader}`);
			this.response.set('X-CS-Execute-Commands', clientCommandHeader);
		}

		// remove any commands that are older than our oldest support client version
		// this should keep the list of commands nice and short
		// note: no await here, this can happen async
		this.dropOldCommands();
	}

	// compiles which commands the client should execute, based on their current index and which
	// commands might supercede others, which depends on the character of the individual commands
	async compileCommandsToExecute () {
		this.clientCommands = [];

		const numCommands = this.allClientCommands.length;
		const firstCommandIndex = this.allClientCommands.findIndex(command => {
			return command.index > this.clientCommandIndex;
		});
		if (firstCommandIndex === -1) {
			return;
		}

		for (let nCmd = firstCommandIndex; nCmd < numCommands; nCmd++) {
			const command = this.allClientCommands[nCmd];
			const commandInfo = COMMAND_INFO[command.command];
			if (!commandInfo) {
				this.api.warn(`Command ${command.command} found but no command mapping exists, ignoring`);
				continue;
			}


			const commandToClient = {
				command: command.command
			};
			if (command.data) {
				commandToClient.data = command.data;
			}
			this.clientCommands.push(commandToClient);

			/*
			if (commandInfo.supersedes) {
				if (commandInfo.supersedes === '__all') {
					const commandToClient = {
						command: command.command
					};
					if (command.data) {
						commandToCient.data = command.data;
					}
					this.clientCommands = [commandToClient];
					return;
				}
			} else {
				this.clientCommands.push()
			}
			*/
		}
	}

	// any commands that were ordered before the earliest support client version can be dropped
	async dropOldCommands () {
		const minimumRequiredVersion = this.versionInfo.getMinimumRequiredVersion();
		const oldestCommandNeeded = this.allClientCommands.find(command => {
			return command.minimumClientVersionAt >= minimumRequiredVersion;
		});
		const firstCommand = this.allClientCommands[0];

		if (oldestCommandNeeded && firstCommand && oldestCommandNeeded.index > firstCommand.index) {
			return this.deleteByQuery(
				{
					index: { $lt: oldestCommandNeeded.index }
				}
			);
		}
	}

	// get the highest index of command currently registered
	async highestCommandIndex () {
		const lastClientCommand = await this.api.data.clientCommands.getByQuery(
			{},
			{
				sort: { index: -1 },
				limit: 1,
				overrideHintRequired: true
			}
		)[0];
		return (lastClientCommand && lastClientCommand.index) || 0;
	}
}

module.exports = ClientCommandHandler;
