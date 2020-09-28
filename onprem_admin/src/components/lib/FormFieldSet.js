'use strict';

import React from 'react';
import PropTypes from 'prop-types';

const MiniHelpAndValidationMsg = ({ field, ariaDescribedBy }) => {
	if (field.mutedText && field.validation?.errorMsg) {
		return (
			<small id={ariaDescribedBy} className="form-text">
				<span className="text-warning">{field.validation?.errorMsg}</span>
				<br />
				{field.mutedText}
			</small>
		);
	}
	if (field.mutedText) {
		return (
			<small id={ariaDescribedBy} className="form-text">
				{field.mutedText}
			</small>
		);
	}
	if (field.validation?.errorMsg) {
		return (
			<small className="form-text">
				<span className="text-warning">{field.validation?.errorMsg}</span>
			</small>
		);
	}
	return <></>;
};

// const FieldGroup = (props) => {
class FieldGroupComponent extends React.Component {
	state = {
		errorMsg: null
	};

	render() {
		const { id, label, type, placeholder, disabled, value, mutedText } = this.props.field;
		const ariaDescribedBy = placeholder ? placeholder + 'Help' : undefined;
		// placeholder = placeholder || '';
		return (
			<span className="col-12">
				<label className="form-control-label" htmlFor={id}>
					{label}
				</label>
				<span className="input-group">
					<input
						className={this.props.field.validation?.errorMsg ? 'form-control text-danger' : 'form-control'}
						type={type || 'text'}
						id={id}
						placeholder={placeholder}
						aria-describedby={ariaDescribedBy}
						disabled={disabled || false}
						value={value}
						// onBlur={props.field.validation?.func && ((e) => props.field.validation?.func(e, props.field))}
					/>
					<span className="input-group-addon">
						<img className="icon-image-large ml-1 mt-1" src="/s/fa/svgs/solid/undo-alt.svg.white.png" />
					</span>
				</span>
				<MiniHelpAndValidationMsg field={this.props.field} aria-describedby={ariaDescribedBy} />
			</span>
		);
	}
};

const mapState = (state) => ({});
const mapDispatch = (dispatch) => ({});
const FieldGroup = connect(mapState, mapDispatch)(FieldGroupComponent);


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
