'use strict';

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const clientDebug = false;

class MiniHelpAndValidationMsg extends React.Component {
	render() {
		const { mutedText } = this.props.field;
		const { errorMsg, ariaDescribedBy } = this.props.inputState;
		if (clientDebug) console.debug(`MiniHelpAndValidationMsg(): errorMsg = ${errorMsg}, mutedText = ${mutedText}`);
		if (!mutedText && !errorMsg) return <></>;
		return (
			<small id={ariaDescribedBy} className="form-text ml-2">
				{errorMsg && <span className="text-warning">{errorMsg}</span>}
				{mutedText && errorMsg && <br />}
				{mutedText}
			</small>
		);
	}
};

// --------------------------------------------------------------

class TheCheckBoxElement extends React.Component {
	onClickHandler() {
		if (clientDebug)
			console.debug(`TheCheckBoxElement(onClickHander) type: ${this.props.field.onClickAction}, payload:`, this.props.field.onClickActionPayload);
		this.props.updateState({ value: !this.props.inputState.value });
		this.props.dispatch({ type: this.props.field.onClickAction, payload: this.props.field.onClickActionPayload });
	}

	render() {
		const { id, label } = this.props.field;
		const { value } = this.props.inputState;
		if (clientDebug) console.debug('TheCheckBoxElement(render) props:', this.props);
		return (
			<span className="col-12 form-check">
				<input className="form-check-input" checked={value} type="checkbox" id={id} onChange={() => this.onClickHandler()} />
				<label className="form-check-label px-2" htmlFor={id}>
					{label}
				</label>
			</span>
		);
	}
}

// --------------------------------------------------------------

class TheInputElement extends React.Component {
	validateField(e) {
		const err = this.props.field.validation?.onBlur ? this.props.field.validation.onBlur(e.target.value, this.props.field) : null;
		if (err) {
			if (clientDebug) console.debug(`validateField(${e.target.value}) returned ${err}`);
			this.props.updateState({ errorMsg: err });
		} else {
			if (clientDebug) console.debug('input is valid');
			const payloadValue = this.props.field.dispatchNullForEmpty ? e.target.value || null : e.target.value;
			if (this.props.field.updateActionPayload) {
				const payload = {
					...this.props.field.updateActionPayload,
					value: payloadValue,
				};
				if (clientDebug) console.debug(`dispatching update ${this.props.field.updateAction} with expanded payload `, payload);
				this.props.updateState({ errorMsg: null });
				this.props.dispatch({ type: this.props.field.updateAction, payload });
			}
			else if (this.props.field.updateAction) {
				if (clientDebug) console.debug(`dispatching update ${this.props.field.updateAction}`);
				this.props.updateState({ errorMsg: null });
				this.props.dispatch({ type: this.props.field.updateAction, payload: payloadValue });
			} else {
				console.error('cannot call dispatch. updateAction missing', this.props.field);
			}
		}
	}

	onChangeHandler(e) {
		this.props.updateState({ value: e.target.value })
	}

	render() {
		if (clientDebug) {
			console.debug('TheInputElement(render)  field = ', this.props.field);
			console.debug('TheInputElement(render)  local state = ', this.props.inputState);
		}
		const { id, type, placeholder, disabled } = this.props.field;
		const { ariaDescribedBy, value, errorMsg } = this.props.inputState;
		return (
			<input
				className={errorMsg ? 'form-control text-danger' : 'form-control'}
				type={type}
				id={id}
				placeholder={placeholder}
				aria-describedby={ariaDescribedBy}
				disabled={disabled || false}
				value={value}
				onChange={(e) => this.onChangeHandler(e)}
				onBlur={(e) => this.validateField(e)}
			/>
		);
	}
}

class TheInputElementGroup extends React.Component {
	render() {
		if (clientDebug) console.debug('TheInputElementGroup(render). inputState =', this.props.inputState);
		const { id, label } = this.props.field;
		return (
			<span className="col-12">
				<label className="form-control-label" htmlFor={id}>
					{label}
				</label>
				<span className="input-group">
					<TheInputElement
						field={this.props.field}
						updateState={this.props.updateState}
						inputState={this.props.inputState}
						dispatch={this.props.dispatch}
					/>
					{/* Revert button */}
					{(this.props.inputState.revertValue && (this.props.inputState?.value !== this.props.inputState?.revertValue)) && (
						<span className="input-group-addon">
							<img
								className="icon-image-large ml-1 mt-1"
								src="/s/fa/svgs/solid/undo-alt.svg.white.png"
								style={{ cursor: 'pointer' }}
								onClick={() => this.props.revertField()}
							/>
						</span>
					)}
				</span>
				<MiniHelpAndValidationMsg field={this.props.field} inputState={this.props.inputState} />
			</span>
		);
	}					
};

// --------------------------------------------------------------

// This component owns the local state we use as a controlled
// input buffer and for error data
class FieldGroup extends React.Component {
	constructor(props) {
		// FIXME: deprecated - https://reactjs.org/docs/context.html
		super(props);
		this.state = {
			errorMsg: null,
			value: this.props.value,
			revertValue: this.props.revertValue,
			ariaDescribedBy: this.props.field.placeholder ? this.props.field.id + 'Help' : undefined,
		};
		if (clientDebug) console.debug('FieldGroupComponent():', this.props);
		// necessary when function calls this.getState() and we pass it to a child component
		this.updateState = this.updateState.bind(this);
		this.revertField = this.revertField.bind(this);
	}

	updateState(stateUpdates) {
		if (clientDebug) console.debug('FieldGroup(): updating local state', stateUpdates);
		this.setState(stateUpdates);
	}

	revertField() {
		if (clientDebug) console.debug(`reverting field to ${this.state.revertValue}`);
		this.setState({ errorMsg: null, value: this.state.revertValue });
	}

	render() {
		if (clientDebug) console.debug(`FieldGroup(): rendering ${this.props.field.id} ${this.props.field.type}`);
		switch (this.props.field.type) {
			case 'text':
			case 'number':
				return (
					<TheInputElementGroup
						field={this.props.field}
						updateState={this.updateState}
						revertField={this.revertField}
						inputState={this.state}
						dispatch={this.props.dispatch}
					/>
				);
			case 'checkbox':
				return <TheCheckBoxElement field={this.props.field} updateState={this.updateState} dispatch={this.props.dispatch} inputState={this.state} />;
			default:
				console.error(`FieldGroupComponent(): unknown field type: ${this.props.field.type}`);
				return <></>;
		}
	};
};

// --------------------------------------------------------------

const FormFieldSet = (props) => {
	// needed here
	const formRowJustification = props.layout?.formRowJustification || 'justify-content-center';
	const { legend, fieldset, defaultColWidth, helpDoc } = props;
	if (clientDebug) console.debug('formRowJustification:', formRowJustification);
	// needed by children
	const { dispatch, formData } = props;
	if (clientDebug) console.debug('FormFieldSet(props)', props);
	return (
		<div className="container-fluid col-12">
			{helpDoc && (
				<a className="row row-cols-12 justify-content-begin" href={helpDoc} target="_blank">
					<img className="icon-image-large ml-4" src="/s/fa/svgs/solid/question-circle.svg.on-dark.png" />
				</a>
			)}
			<form className="form row row-cols-12">
				<fieldset className="form-group col-12">
					{legend && (
						<legend>
							<h5>{legend}</h5>
						</legend>
					)}
					{fieldset.map((row) => {
						return (
							<div key={row[0].id + 'Row'} className={`form-row row-cols-12 ${formRowJustification}`}>
								{row.map((field) => {
									return (
										<div key={field.id + 'FieldGroup'} className={`form-group ${field.width || defaultColWidth}`}>
											{field.labelWidth ? (
												<div className="form-row col-12">
													<FieldGroup
														field={field}
														dispatch={dispatch}
														value={formData.values[field.id] || ''}
														revertValue={formData.revertValues[field.id] || ''}
													/>
												</div>
											) : (
												<FieldGroup
													field={field}
													dispatch={dispatch}
													value={formData.values[field.id] || ''}
													revertValue={formData.revertValues[field.id] || ''}
												/>
											)}
										</div>
									);
								})}
							</div>
						);
					})}
				</fieldset>
			</form>
		</div>
	);
};

FormFieldSet.propTypes = {
	defaultColWidth: PropTypes.string,
	legend: PropTypes.string,
	fieldset: PropTypes.array.isRequired,
};

FormFieldSet.defaultProps = {
	defaultColWidth: 'col-12',
}

export default FormFieldSet;
