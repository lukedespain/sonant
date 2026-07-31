import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Sonant <hello@sonant.ac>';
const LUKE = 'music@lukedespain.com';

// Sent when a composer submits a track for review.
export async function sendSubmissionReceivedEmail(params: {
  to: string;
  projectName: string;
}) {
  const { to, projectName } = params;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Your submission for ${projectName} was received`,
      html: `
        <div style="font-family: sans-serif; color: #1A1815; line-height: 1.6;">
          <h2 style="font-weight: 500;">Submission received</h2>
          <p>Thanks for submitting a track for <strong>${projectName}</strong>.</p>
          <p>
            Every submission gets an individual review with written feedback.
            We will be in touch once yours has been reviewed.
          </p>
          <p style="color: var(--text-muted); font-size: 13px; margin-top: 32px;">
            Sonant
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('sendSubmissionReceivedEmail failed:', error);
    return { error: 'Email failed to send.' };
  }
}

// Sent when an admin records a decision on a submission.
export async function sendDecisionEmail(params: {
  to: string;
  projectName: string;
  accepted: boolean;
  feedback: string;
}) {
  const { to, projectName, accepted, feedback } = params;

  const subject = accepted
    ? `Your track for ${projectName} was accepted`
    : `Feedback on your submission for ${projectName}`;

  const heading = accepted
    ? 'Your track was accepted'
    : 'Your submission has been reviewed';

  const intro = accepted
    ? `Your track for <strong>${projectName}</strong> has been accepted into the Sonant Catalog.`
    : `Your track for <strong>${projectName}</strong> has been reviewed. It is not joining the catalog this time, but here is feedback on the work.`;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; color: #1A1815; line-height: 1.6;">
          <h2 style="font-weight: 500;">${heading}</h2>
          <p>${intro}</p>
          <div style="border-left: 2px solid #E85D2F; padding-left: 16px; margin: 24px 0; color: #1A1815;">
            ${feedback.replace(/\n/g, '<br>')}
          </div>
          <p style="color: var(--text-muted); font-size: 13px; margin-top: 32px;">
            Sonant
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('sendDecisionEmail failed:', error);
    return { error: 'Email failed to send.' };
  }
}

export async function sendCatalogAccessRequestEmail(params: {
  email: string;
  role: string;
  lookingFor: string;
}) {
  const { email, role, lookingFor } = params;
  try {
    await resend.emails.send({
      from: FROM,
      to: LUKE,
      subject: `Catalog access request from ${email}`,
      html: `
        <div style="font-family: sans-serif; color: #1A1815; line-height: 1.6;">
          <h2 style="font-weight: 500;">New catalog access request</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Role:</strong> ${role}</p>
          <p><strong>Looking for:</strong> ${lookingFor || '(not provided)'}</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('sendCatalogAccessRequestEmail failed:', error);
    return { error: 'Email failed to send.' };
  }
}