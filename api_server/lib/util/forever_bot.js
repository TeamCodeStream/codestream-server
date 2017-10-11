'use strict';

var Event_Emitter = require('events');

class Forever_Bot extends Event_Emitter () {

	run_forever (func, options) {
		this.run_forever_func = func;
		this.run_forever_options = options;
		const now = Date.now();
		if (!options.start_at || options.start_at < now) {
			process.nextTick(this.forever_run_now);
		}
		else {
			this.last_run = options.start_at - options.interval;
			this.schedule_next_run();
		}
	}

	forever_run_now () {
		this.emit('forever_running');
		this.last_run = Date.now();
		this.run_forever_func(() => {
			this.emit('forever_ran');
			this.schedule_next_run();
		});
	}

	schedule_next_run () {
		const now = Date.now();
		let start_when = this.last_run + (this.run_forever_options.interval || 1);
		let wait = start_when - now;
		this.emit('forever_scheduled', { at: start_when, wait: wait });
		setTimeout(this.forever_run_now, wait);
	}
}

module.exports = Forever_Bot;
