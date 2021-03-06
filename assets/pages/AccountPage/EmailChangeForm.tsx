import React from 'react';
import { translate } from 'react-polyglot';
import { Button, TextField } from '@material-ui/core';
import { FilledInputProps } from '@material-ui/core/FilledInput';
import * as EmailValidator from 'email-validator';
import { If } from 'react-if';
import { Alert } from '@material-ui/lab';
import { inject } from 'mobx-react';

@inject('activity')
class EmailChangeForm extends React.Component<any, any> {

  private static ACTIVITY = 'change.email';

  public readonly state: any = {
    dirty: true,
    error: '',
  };

  handleChange = (name: string, value: string) => {
    const state = this.state;
    state[name] = value;

    this.setState(state);
    this.validate();
  };

  private onKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && this.isSubmitEnabled()) {
      this.submit();
    }
  };

  private validate() {
    let valid = EmailValidator.validate(this.state.value);
    const { t } = this.props;

    if (!valid) {
      this.setState({ error: t('Please enter valid email.') });
    } else {
      this.setState({ error: '' });
    }
  }

  private isValid(): boolean {
    return EmailValidator.validate(this.state.value);
  }

  public isSubmitEnabled(): boolean {
    return this.isValid();
  }

  private submit = async () => {
    const { t, activity } = this.props;

    activity.add(EmailChangeForm.ACTIVITY);

    const response = await fetch('/api/account/email',
      {
        method: 'POST',
        body: JSON.stringify({
          email: this.state.value,
        }),
      });

    const data = await response.json();

    if (data['status'] === false) {
      this.setState({ errorMessage: data['error'] });
    } else {
      this.setState({
        errorMessage: null,
        message: t('Email change request accepted. Confirmation mail is sent to %{email}', { email: this.state.value }),
        value: '',
      });
    }

    activity.remove(EmailChangeForm.ACTIVITY);
  };

  render = () => {
    const { t } = this.props;
    const { value, dirty, error } = this.state;

    return (<div className="my-3 email-change-form">

      <If condition={Boolean(this.state.message)}>
        <Alert severity="success">{this.state.message}</Alert>
      </If>

      <If condition={Boolean(this.state.errorMessage)}>
        <Alert severity="error">{this.state.errorMessage}</Alert>
      </If>

      <TextField
        className="mb-3"
        data-test="email-change"
        InputProps={{ autoComplete: 'email' } as FilledInputProps}
        label={t('Email')}
        variant="outlined"
        value={value}
        fullWidth
        onKeyPress={this.onKeyPress}
        error={dirty && (error !== '')}
        helperText={dirty && (error || ' ')}
        onChange={e => this.handleChange('value', e.target.value)}
      />
      <Button
        variant="contained"
        color="primary"
        size="large"
        disabled={!this.isSubmitEnabled()}
        data-test="submit"
        onClick={this.submit}
      >
        {t('Change Email')}
      </Button>
    </div>);
  };
}

export default translate()(EmailChangeForm);
