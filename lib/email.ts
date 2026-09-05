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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendBriefShareEmail(params: {
  to: string;
  briefName: string;
  briefUrl: string;
  signupUrl: string;
  loginUrl: string;
  senderName: string;
}) {
  const briefName = escapeHtml(params.briefName);
  const senderName = escapeHtml(params.senderName);
  const briefUrl = escapeHtml(params.briefUrl);
  const signupUrl = escapeHtml(params.signupUrl);
  const loginUrl = escapeHtml(params.loginUrl);

  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `${params.senderName} shared a catalog brief with you`,
      html: `
        <div style="margin:0;padding:0;background:#0A0908;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0908;">
            <tr>
              <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:520px;max-width:520px;">
                  <tr>
                    <td style="padding:0 8px 24px;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#E85D2F;">
                      ◆ Sonant · Brief invite
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 8px 16px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.15;color:#F5F1E8;">
                      You have a brief to write to.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 8px 28px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.7;color:#C4BFB5;">
                      ${senderName} shared <em style="color:#F5F1E8;font-style:italic;">${briefName}</em> with you on Sonant. It is a real sync-style brief: scene, direction, references. Write to it like a job.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 24px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#141312;border:1px solid #2A2826;border-radius:2px;">
                        <tr>
                          <td style="padding:24px;">
                            <div style="font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#E85D2F;margin-bottom:10px;">The brief</div>
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;color:#F5F1E8;margin-bottom:18px;">${briefName}</div>
                            <a href="${briefUrl}" style="display:inline-block;background:#E85D2F;color:#0A0908;text-decoration:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;padding:12px 18px;border-radius:2px;font-weight:500;">
                              View the brief →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 8px 28px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#C4BFB5;">
                      New here? Create a free account from the invite and you can save briefs, upload takes, and submit to the catalog. Already on Sonant? Sign in and it opens this brief.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 8px 36px;">
                      <a href="${signupUrl}" style="display:inline-block;border:1px solid #E85D2F;color:#E85D2F;text-decoration:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;padding:12px 18px;border-radius:2px;margin-right:12px;">
                        Create a free account
                      </a>
                      <a href="${loginUrl}" style="display:inline-block;color:#8A8680;text-decoration:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;padding:12px 0;">
                        Sign in →
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 8px 0;border-top:1px solid #2A2826;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#5A5650;">
                      <a href="https://sonant.ac" style="color:#8A8680;text-decoration:none;">sonant.ac</a>
                      &nbsp;·&nbsp;
                      A practice room for sync composers.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('sendBriefShareEmail failed:', error);
    return { error: 'Email failed to send.' };
  }
}

// Adds a confirmed signup to the Resend General list used for product emails.
// Best-effort: never block account confirmation if Resend is down or the key is send-only.
export async function addSignupToResendList(params: {
  email: string;
  firstName?: string;
}) {
  const email = params.email.trim();
  if (!email) return;

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const firstName = params.firstName?.trim() || undefined;

  try {
    if (audienceId) {
      await resend.contacts.create({
        email,
        firstName,
        unsubscribed: false,
        audienceId,
      });
      return;
    }

    await resend.contacts.create({
      email,
      firstName,
      unsubscribed: false,
    });
  } catch (error) {
    console.error('addSignupToResendList failed:', error);
  }
}

export async function sendPaidBriefAnnouncementEmail(params: {
  to: string;
  briefName: string;
  briefUrl: string;
}) {
  const briefName = escapeHtml(params.briefName);
  const briefUrl = escapeHtml(params.briefUrl);
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: 'A paid brief is up on Sonant',
      html: briefAnnouncementHtml({
        kicker: '◆ Sonant · Paid brief',
        heading: 'A paid job just went live.',
        body: `Verified composers only. <em style="color:#F5F1E8;font-style:italic;">${briefName}</em> is a real client brief. Write to it like the job.`,
        briefName,
        briefUrl,
        button: 'Open the brief →',
        footer: 'You are seeing this because you have the verified composer badge.',
      }),
    });
    return { success: true };
  } catch (error) {
    console.error('sendPaidBriefAnnouncementEmail failed:', error);
    return { error: 'Email failed to send.' };
  }
}

export async function sendFeaturedBriefAnnouncementEmail(params: {
  to: string;
  briefName: string;
  briefUrl: string;
}) {
  const briefName = escapeHtml(params.briefName);
  const briefUrl = escapeHtml(params.briefUrl);
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: 'A new Sonant brief is in the Library',
      html: briefAnnouncementHtml({
        kicker: '◆ Sonant · Catalog brief',
        heading: 'The catalog is looking for this.',
        body: `<em style="color:#F5F1E8;font-style:italic;">${briefName}</em> is a new Sonant brief. Write to it, upload a take, or submit it for review.`,
        briefName,
        briefUrl,
        button: 'Open the brief →',
        footer: 'A practice room for sync composers.',
      }),
    });
    return { success: true };
  } catch (error) {
    console.error('sendFeaturedBriefAnnouncementEmail failed:', error);
    return { error: 'Email failed to send.' };
  }
}

function briefAnnouncementHtml(params: {
  kicker: string;
  heading: string;
  body: string;
  briefName: string;
  briefUrl: string;
  button: string;
  footer: string;
}) {
  return `
    <div style="margin:0;padding:0;background:#0A0908;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0908;">
        <tr>
          <td align="center" style="padding:40px 16px;">
            <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:520px;max-width:520px;">
              <tr>
                <td style="padding:0 8px 24px;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#E85D2F;">
                  ${params.kicker}
                </td>
              </tr>
              <tr>
                <td style="padding:0 8px 16px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.15;color:#F5F1E8;">
                  ${params.heading}
                </td>
              </tr>
              <tr>
                <td style="padding:0 8px 28px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.7;color:#C4BFB5;">
                  ${params.body}
                </td>
              </tr>
              <tr>
                <td style="padding:0 0 36px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#141312;border:1px solid #2A2826;border-radius:2px;">
                    <tr>
                      <td style="padding:24px;">
                        <div style="font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#E85D2F;margin-bottom:10px;">The brief</div>
                        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;color:#F5F1E8;margin-bottom:18px;">${params.briefName}</div>
                        <a href="${params.briefUrl}" style="display:inline-block;background:#E85D2F;color:#0A0908;text-decoration:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;padding:12px 18px;border-radius:2px;font-weight:500;">
                          ${params.button}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 8px 0;border-top:1px solid #2A2826;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#5A5650;">
                  <a href="https://sonant.ac" style="color:#8A8680;text-decoration:none;">sonant.ac</a>
                  &nbsp;·&nbsp;
                  ${params.footer}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendReferralCreditEmail(params: {
  to: string;
  joinerName: string;
  profileUrl: string;
}) {
  const name = escapeHtml(params.joinerName);
  const profileUrl = escapeHtml(params.profileUrl);
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: 'You earned a Sonant submission credit',
      html: `
        <div style="font-family: sans-serif; color: #1A1815; line-height: 1.6;">
          <h2 style="font-weight: 500;">A composer joined from your invite</h2>
          <p>${name} created a Sonant account from your brief share. You earned one submission credit.</p>
          <p><a href="${profileUrl}" style="color: #E85D2F;">See it on your profile →</a></p>
          <p style="color: #8A8680; font-size: 13px; margin-top: 32px;">Sonant</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('sendReferralCreditEmail failed:', error);
    return { error: 'Email failed to send.' };
  }
}