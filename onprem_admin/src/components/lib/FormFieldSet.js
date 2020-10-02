'use strict';

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const MiniHelpAndValidationMsg = (props) => {
	const { mutedText } = props.field;
	const { errorMsg, ariaDescribedBy } = props.inputState;
	if (!mutedText && !errorMsg) return <></>;
	return (
		<small id={ariaDescribedBy} className="form-text ml-2">
			{!mutedText && <span className="text-warning">{errorMsg}</span>}
			{mutedText && errorMsg && <br />}
			{mutedText}
		</small>
	);
	// if (mutedText && errorMsg) {
	// 	return (
	// 		<small id={ariaDescribedBy} className="form-text ml-2">
	// 			<span className="text-warning">{errorMsg}</span>
	// 			<br />
	// 			{mutedText}
	// 		</small>
	// 	);
	// }
	// if (mutedText) {
	// 	return (
	// 		<small id={ariaDescribedBy} className="form-text ml-2">
	// 			{mutedText}
	// 		</small>
	// 	);
	// }
	// if (errorMsg) {
	// 	return (
	// 		<small id={ariaDescribedBy} className="form-text ml-2">
	// 			<span className="text-warning">{errorMsg}</span>
	// 		</small>
	// 	);
	// }
	// return <></>;
};

// --------------------------------------------------------------

class TheInputElementComponent extends React.Component {
	validateField(e) {
		const err = this.props.field.validation.onBlur(e.target.value, this.props.field);
		console.debug(`validateField(${e.target.value}) returned ${err}`);
		if (err) {
			this.props.updateState({ errorMsg: err });
		} else {
			console.debug(`dispatching update ${this.props.field.updateAction}`);
			this.props.updateState({ errorMsg: null });
			this.props.dispatch({ type: this.props.field.updateAction, payload: e.target.value });
		}
	}

	onChangeHandler(e) {
		this.props.updateState({ value: e.target.value })
	}

	render() {
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
				onBlur={this.props.field.validation?.onBlur && ((e) => this.validateField(e))}
			/>
		);
	}
}
const mapStateTheInputElement = (state) => ({});
const mapDispatchTheInputElement = (dispatch) => ({
	dispatch,
});
const TheInputElement = connect(mapStateTheInputElement, mapDispatchTheInputElement)(TheInputElementComponent);

// --------------------------------------------------------------

class FieldGroupComponent extends React.Component {
	constructor(props) {
		// FIXME: deprecated - https://reactjs.org/docs/context.html
		super(props);
		this.state = {
			errorMsg: null,
			value: this.props.field.value,
			ariaDescribedBy: this.props.field.placeholder ? placeholder + 'Help' : undefined,
		};
		// necessary when function calls this.getState() and we pass it to a child component
		this.updateState = this.updateState.bind(this);
	}

	updateState(stateUpdates) {
		this.setState(stateUpdates);
	}

	revertField() {
		this.setState({ errorMsg: null, value: this.props.field.revertValue });
	}

	render() {
		const { id, label, type, placeholder, disabled } = this.props.field;
		const ariaDescribedBy = placeholder ? placeholder + 'Help' : undefined;
		return (
			<span className="col-12">
				<label className="form-control-label" htmlFor={id}>
					{label}
				</label>
				<span className="input-group">
					<TheInputElement field={this.props.field} updateState={this.updateState} inputState={this.state} />
					{/* Revert button */}
					<span className="input-group-addon">
						<img
							className="icon-image-large ml-1 mt-1"
							src="/s/fa/svgs/solid/undo-alt.svg.white.png"
							style={{ cursor: 'pointer' }}
							onClick={() => this.revertField()}
						/>
					</span>
				</span>
				<MiniHelpAndValidationMsg field={this.props.field} inputState={this.state} />
			</span>
		);
	}
};
const mapStateFieldGroup = (state) => ({});
const mapDispatchFieldGroup = (dispatch) => ({});
const FieldGroup = connect(mapStateFieldGroup, mapDispatchFieldGroup)(FieldGroupComponent);

// --------------------------------------------------------------

const FormFieldSet = ({ legend, fieldset, defaultColWidth, helpDoc }) => {
	return (
		<div className="container-fluid col-12">
			{helpDoc && (
				<a className="row row-cols-12 justify-content-begin" href={helpDoc} target="_blank">
					<img className="icon-image-large ml-4" src="/s/fa/svgs/solid/question-circle.svg.on-dark.png" />
				</a>
			)}
			<form className="row row-cols-12 form">
				<fieldset className="form-group col-12">
					{legend && <legend>{legend}</legend>}
					{fieldset.map((row) => {
						return (
							<div key={row[0].id + 'Row'} className="form-row row-cols-12 justify-content-center">
								{row.map((field) => {
									return (
										<div key={field.id + 'Field'} className={`form-group ${field.width || defaultColWidth}`}>
											{field.labelWidth ? (
												<div className="form-row col-12">
													<FieldGroup field={field} />
												</div>
											) : (
												<FieldGroup field={field} />
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

// These defaults provide an example of a fieldset.
FormFieldSet.defaultProps = {
	defaultColWidth: 'col-12',
	// legend: 'Example FieldSet Legend',
	fieldset: [
		// Each index (sub-list) denotes a new row in the form construction
		[
			// Each object represents one field
			{
				// required
				id: 'publicHostName',
				label: 'Public Hostname',
				placeholder: 'my-host.my-company.com',
				// optional
				mutedText: 'The hostname CodeStream clients will connect to.',
				// type: 'number',	// default = 'text'
				// width: 'col-7',	// default = defaultColWidth property
				// disabled: true,	// default = false
			},
		],
		[
			{
				id: 'apiInsecurePort',
				label: 'API Insecure Port',
				placeholder: 80,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'broadcasterInsecurePort',
				label: 'Broadcaster Insecure Port',
				placeholder: 12080,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'adminInsecurePort',
				label: 'Admin Insecure Port',
				placeholder: 8080,
				width: 'col-4',
				type: 'number',
			},
		],
		[
			{
				id: 'apiSecurePort',
				label: 'API Secure Port',
				placeholder: 443,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'broadcasterSecurePort',
				label: 'Broadcaster Secure Port',
				placeholder: 12443,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'adminSecurePort',
				label: 'Admin Secure Port',
				placeholder: 8443,
				width: 'col-4',
				type: 'number',
			},
		],
	],
};

export default FormFieldSet;
