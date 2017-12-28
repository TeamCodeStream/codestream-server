'use strict';

const DELETED = -1;

/**
 * Holds all positional and contextual information about a marker,
 * required during the process of recalculating its position.
 */
class MarkerData {

	constructor (markerId, location, mapper) {
		this._mapper = mapper;
		this._markerId = markerId;
		this._lineStartOld = location[0];
		this._colStartOld = location[1];
		this._lineEndOld = location[2];
		this._colEndOld = location[3];
		this._info = location[4];
	}

	get markerId () {
		return this._markerId;
	}

	trimLineStartEdit() {
		let edit = this.lineStartEdit;
		this.lineStartNew = edit.addStart + edit.addLength;
	}

	trimLineEndEdit() {
		let edit = this.lineEndEdit;
		this.lineEndNew = edit.addStart + -1;
	}

	get isLineStartDeleted() {
		if (this._isLineStartDeleted === undefined) {
			this._isLineStartDeleted = this.lineStartNew === DELETED;
		}
		return this._isLineStartDeleted;
	}

	get isLineEndDeleted() {
		if (this._isLineEndDeleted === undefined) {
			this._isLineEndDeleted = this.lineEndNew === DELETED;
		}
		return this._isLineEndDeleted;
	}

	get isMultiLine() {
		return !!this._lineEndOld;
	}

	get isEntirelyDeleted() {
		if (this._isEntirelyDeleted === undefined) {
			if (this.isMultiLine) {
				this._isEntirelyDeleted =
					this.isLineStartDeleted &&
					this.isLineEndDeleted &&
					this.lineStartEdit === this.lineEndEdit;
			} else {
				this._isEntirelyDeleted = this.isLineStartDeleted;
			}
		}
		return this._isEntirelyDeleted;
	}

	get lineStartData() {
		if (!this._lineStartData) {
			this._lineStartData = this._mapper.lineMap[this._lineStartOld];
		}
		return this._lineStartData;
	}

	get lineEndData() {
		if (!this._lineEndData) {
			this._lineEndData = this._mapper.lineMap[this._lineEndOld];
		}
		return this._lineEndData;
	}

	get lineStartEdit() {
		return this.lineStartData.edit;
	}

	get lineEndEdit() {
		return this.lineEndData && this.lineEndData.edit;
	}

	get lineStartEditDeletedContent() {
		let edit = this.lineStartEdit;
		if (!edit.deletedContent) {
			edit.deletedContent = edit.dels.join('');
		}
		return edit.deletedContent;
	}

	get lineStartDataDeletedContent() {
		return this.lineStartData.delContent;
	}

	get lineEndDataDeletedContent() {
		return this.lineEndData.delContent;
	}

	get lineStartOld() {
		return this._lineStartOld;
	}

	get lineEndOld() {
		return this._lineEndOld;
	}

	get colStartOld() {
		return this._colStartOld;
	}

	get colEndOld() {
		return this._colEndOld;
	}

	get lineStartNew() {
		return this._lineStartNew;
	}

	set lineStartNew(val) {
		this._lineStartNew = val;
	}

	get lineStartOldContent() {
		return this._lineStartOldContent;
	}

	set lineStartOldContent(val) {
		this._lineStartOldContent = val;
	}

	get lineStartNewContent() {
		return this._lineStartNewContent;
	}

	set lineStartNewContent(val) {
		this._lineStartNewContent = val;
	}

	get lineEndNew() {
		return this._lineEndNew;
	}

	set lineEndNew(val) {
		this._lineEndNew = val;
	}

	get lineEndOldContent() {
		return this._lineEndOldContent;
	}

	set lineEndOldContent(val) {
		this._lineEndOldContent = val;
	}

	get lineEndNewContent() {
		return this._lineEndNewContent;
	}

	set lineEndNewContent(val) {
		this._lineEndNewContent = val;
	}
}

module.exports = MarkerData;
module.exports.DELETED = DELETED;
