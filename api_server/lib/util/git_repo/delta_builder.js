// Provides a class which converts git repo diff information into a simple
// array of edits, for use in calculating marker locations

'use strict';

const Git = require('nodegit');

class DeltaBuilder {

	constructor (cfg) {
		this._oldFile = cfg.oldFile;
		this._newFile = cfg.newFile;
		this._edits = [];
		this._state = 'sync';
		this._oldLine = 0;
		this._newLine = 0;
	}

	processLine (line) {
		const origin = line.origin();
		if (origin === Git.Diff.LINE.CONTEXT) {
			this._ctx(line);
		} else if (origin === Git.Diff.LINE.ADDITION) {
			this._add(line);
		} else if (origin === Git.Diff.LINE.DELETION) {
			this._del(line);
		}
	}

	build() {
		this._setState('sync');

		return {
			oldFile: this._oldFile,
			newFile: this._newFile,
			edits: this._edits
		};
	}

	_ctx(line) {
		this._setState('sync');
		this._oldLine = line.oldLineno();
		this._newLine = line.newLineno();
	}

	_add(line) {
		this._setState('edit');
		this._adds.push(line.content());
	}

	_del(line) {
		this._setState('edit');
		this._dels.push(line.content());
	}

	_setState(state) {
		if (state !== this._state) {
			this._state = state;
			this['_' + state]();
		}
	}

	_sync() {
		const dels = this._dels;
		const adds = this._adds;
		const delStart = this._delStart;
		const addStart = this._addStart;
		const delLength = dels.length;
		const addLength = adds.length;

		this._edits.push({
			delStart: delStart,
			addStart: addStart,
			delLength: delLength,
			addLength: addLength,
			dels: dels,
			adds: adds
		});
	}

	_edit() {
		this._delStart = this._oldLine + 1;
		this._addStart = this._newLine + 1;
		this._adds = [];
		this._dels = [];
	}
}

module.exports = DeltaBuilder;
