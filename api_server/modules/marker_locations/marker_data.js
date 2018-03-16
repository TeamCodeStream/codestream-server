'use strict';

const DELETED = -1;

/**
 * Holds all positional and contextual information about a marker,
 * required during the process of recalculating its position.
 */
class MarkerData {

	constructor (markerId, location, mapper) {
		this.mapper = mapper;
		this.markerId = markerId;
		this.lineStartOld = location[0];
		this.colStartOld = location[1];
		this.lineEndOld = location[2];
		this.colEndOld = location[3];
		this.info = location[4] || {};
	}

	// given a marker where the start of the marker was in code that has been
	// deleted (and we've found no match for it by looking for "similar" lines),
	// we'll move the start of the marker to the start of the first line after
	// code that replaced the deleted code
	trimLineStartEdit () {
		let edit = this.getLineStartEdit();
		this.lineStartNew = edit.addStart + edit.addLength;
		this.colStartNew = 1;
		this.info.startWasDeleted = true;
		this.info.deletedContents = this.getLineStartEditDeletedContent();
	}

	// given a marker where the end of the marker was in code that has been
	// deleted (and we've found no match for it by looking for "similar" lines),
	// we'll move the end of the marker to the start of the first line of code
	// that replaced the deleted code
	trimLineEndEdit () {
		let edit = this.getLineEndEdit();
		this.lineEndNew = edit.addStart + -1;
		this.colEndNew = 1;
		this.info.endWasDeleted = true;
		this.info.deletedContents = this.getLineEndEditDeletedContent();
	}

	// given a marker where the code the marker points to was entirely deleted
	// (and we've found no match for any of it by looking for "similar" lines),
	// we'll move the start and end of the marker to the start of the first line
	// of code that replaced the deleted code ... it will be a zero-length marker
	trimLineEdit () {
		this.trimLineStartEdit();
		this.lineEndNew = this.lineStartNew;
		this.colEndNew = 1;
		this.info.endWasDeleted = true;
		this.info.entirelyDeleted = true;
	}

	// was the start line of this marker unrecognizably deleted?
	isLineStartDeleted () {
		return this.lineStartNew === DELETED;
	}

	// was the end line of this marker unrecognizably deleted?
	isLineEndDeleted () {
		return this.lineEndNew === DELETED;
	}

	// is this a multi-line marker?
	isMultiLine () {
		return this.lineStartOld !== this.lineEndOld;
	}

	// was the code for this marker entirely deleted, meaning, was the
	// start of the marker and the end of the marker in code deleted by
	// the same edit?
	isEntirelyDeleted () {
		return (
			this.isLineStartDeleted() &&
			this.isLineEndDeleted() &&
			this.getLineStartEdit() === this.getLineEndEdit()
		);
	}

	// get the start line of the marker after adjustment
	getLineStartData () {
		return this.mapper.lineMap[this.lineStartOld];
	}

	// get the end line of the marker after adjustment
	getLineEndData () {
		return this.mapper.lineMap[this.lineEndOld];
	}

	// get the edit governing the start line for this marker
	getLineStartEdit () {
		return this.getLineStartData().edit;
	}

	// get the edit governing the end line for this marker
	getLineEndEdit () {
		return this.getLineEndData().edit;
	}

	// get the content that was deleted in the edit that governed the
	// start line for this marker
	getLineStartEditDeletedContent () {
		let edit = this.getLineStartEdit();
		if (!edit.deletedContent) {
			edit.deletedContent = edit.dels.join('');
		}
		return edit.deletedContent;
	}

	// get the content that was deleted in the edit that governed the
	// end line for this marker
	getLineEndEditDeletedContent () {
		let edit = this.getLineEndEdit();
		if (!edit.deletedContent) {
			edit.deletedContent = edit.dels.join('');
		}
		return edit.deletedContent;
	}

	// for a marker where the start of the marker was in deleted code,
	// get the content of the line that was deleted
	getLineStartDataDeletedContent () {
		return this.getLineStartData().delContent;
	}

	// for a marker where the end of the marker was in deleted code,
	// get the content of the line that was deleted
	getLineEndDataDeletedContent () {
		return this.getLineEndData().delContent;
	}
}

module.exports = MarkerData;
module.exports.DELETED = DELETED;
