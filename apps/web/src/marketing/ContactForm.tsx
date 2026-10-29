import { useRef, useState, type FormEvent } from 'react';
import { Alert, Button, MenuItem, TextField, Typography } from '@mui/material';
import { CONTACT_EMAIL, TOPICS } from './content';
import {
  EMPTY_CONTACT,
  formatMessageText,
  isHoneypotTripped,
  mailtoHref,
  validateContact,
  type ContactErrors,
  type ContactValues,
} from './forms';
import { ISSUES_URL } from './content';

/*
 * Contact form. Validation runs on submit and reports every problem in a summary that moves focus
 * to the field. Nothing is posted to this site. If CONTACT_EMAIL is set, the visitor's mail client
 * opens with the message. If it is not set, the visitor copies the text into a public GitHub issue.
 */

type FieldName = keyof ContactErrors;
const FIELD_ORDER: FieldName[] = ['name', 'email', 'topic', 'message'];

export default function ContactForm() {
  const [values, setValues] = useState<ContactValues>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [ready, setReady] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const update = (field: keyof ContactValues) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const focusField = (field: FieldName) => {
    document.getElementById(`contact-${field}`)?.focus();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // A filled honeypot is treated as an automated submission and goes nowhere.
    if (isHoneypotTripped(values)) return;

    const found = validateContact(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      setReady(null);
      // Focus the error summary so screen-reader users hear every problem.
      window.setTimeout(() => summaryRef.current?.focus(), 0);
      return;
    }

    setCopied(false);
    if (CONTACT_EMAIL) {
      window.location.href = mailtoHref(CONTACT_EMAIL, values);
      setReady('Your mail client should open with the message. If it does not, copy the text below.');
    } else {
      setReady('Your message is ready. This form does not send it to our servers. Copy the text and open a GitHub issue with it.');
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(formatMessageText(values));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const errorList = FIELD_ORDER.filter((field) => errors[field]);

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate aria-labelledby="contact-form-title">
      <Typography id="contact-form-title" component="h2" className="section-title">
        Send us a message
      </Typography>

      {errorList.length > 0 && (
        <div className="error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
          <Typography component="p" className="error-summary-title">
            Please fix {errorList.length === 1 ? 'this field' : `these ${errorList.length} fields`}:
          </Typography>
          <ul>
            {errorList.map((field) => (
              <li key={field}>
                <button type="button" className="link-button" onClick={() => focusField(field)}>
                  {errors[field]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mkt-form-grid">
        <TextField
          id="contact-name"
          label="Name"
          value={values.name}
          onChange={update('name')}
          autoComplete="name"
          required
          error={Boolean(errors.name)}
          helperText={errors.name ?? ' '}
          slotProps={{ htmlInput: { maxLength: 120 } }}
        />
        <TextField
          id="contact-email"
          label="Email"
          type="email"
          value={values.email}
          onChange={update('email')}
          autoComplete="email"
          required
          error={Boolean(errors.email)}
          helperText={errors.email ?? ' '}
        />
        <TextField
          id="contact-topic"
          label="Topic"
          select
          value={values.topic}
          onChange={update('topic')}
          required
          error={Boolean(errors.topic)}
          helperText={errors.topic ?? ' '}
        >
          <MenuItem value="" disabled>
            Choose a topic
          </MenuItem>
          {TOPICS.map((topic) => (
            <MenuItem key={topic} value={topic}>
              {topic}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          id="contact-message"
          label="Message"
          value={values.message}
          onChange={update('message')}
          multiline
          minRows={5}
          required
          error={Boolean(errors.message)}
          helperText={errors.message ?? `${values.message.trim().length} / 1,000 characters`}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          className="form-wide"
        />
      </div>

      {/* Honeypot: hidden from people and assistive technology. Automated fillers tend to complete it. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Website (leave this empty)</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={update('website')} />
      </div>

      <p className="form-note">
        Do not include personal data you do not want published if you copy this message into a public GitHub issue. This form does not send messages to our servers.
      </p>

      <Button type="submit" variant="contained" className="landing-button">
        Check and prepare message
      </Button>

      {ready && (
        <div className="contact-ready" role="status">
          <Alert severity="success" variant="outlined">
            {ready}
          </Alert>
          {!CONTACT_EMAIL && (
            <>
              <TextField
                label="Message text"
                multiline
                minRows={5}
                value={formatMessageText(values)}
                slotProps={{ htmlInput: { readOnly: true }, input: { readOnly: true } }}
                fullWidth
                className="message-preview"
              />
              <div className="contact-actions">
                <Button variant="outlined" onClick={copyText} className="landing-button">
                  {copied ? 'Copied' : 'Copy message text'}
                </Button>
                <Button href={ISSUES_URL} target="_blank" rel="noopener noreferrer" variant="text" className="landing-button">
                  Open a GitHub issue (opens in a new tab)
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </form>
  );
}
