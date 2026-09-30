

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

function isConfigured() {
  return Boolean(process.env.BREVO_API_KEY && process.env.SMTP_FROM);
}

// Accepts "Name <a@b.com>" or "a@b.com" and returns { name, email }.
function parseSender() {
  const raw = String(process.env.SMTP_FROM || '').trim();
  const m = raw.match(/^(.*)<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, '') || 'MechVerse', email: m[2].trim() };
  return { name: 'MechVerse', email: raw };
}

function fromAddress() {
  const s = parseSender();
  return `${s.name} <${s.email}>`;
}

async function sendViaBrevo({ to, subject, html, text }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000); // never hang a request on email
  try {
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: parseSender(),
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Brevo responded ${res.status}: ${body.slice(0, 300)}`);
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

// Kept so server.js can call it at startup; just logs the current mode.
async function verifyMailerOnBoot() {
  if (!isConfigured()) {
    console.log('[mailer] BREVO_API_KEY / SMTP_FROM not set -- password reset links will be shown on-screen instead of emailed, and welcome emails will be skipped.');
  } else {
    console.log('[mailer] Brevo email is configured.');
  }
}

function passwordResetEmailHtml(resetUrl, name) {
  const firstName = String(name || '').trim().split(/\s+/)[0];
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1b2430;">

    <!-- Brand header -->
    <div style="background:linear-gradient(135deg,#2f8f7a,#1f6b5a); border-radius:14px; padding:22px 24px; text-align:center; margin-bottom:28px;">
      <div style="font-size:22px; line-height:1; margin-bottom:6px;">⚙️</div>
      <div style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:3px;">MECHVERSE</div>
    </div>

    <h2 style="margin:0 0 14px; font-size:24px; line-height:1.3; color:#1b2430;">Let's get you back into MechVerse</h2>

    <p style="margin:0 0 10px; color:#545f6e; font-size:15px; line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 24px; color:#545f6e; font-size:15px; line-height:1.6;">
      We received a request to reset your MechVerse password.
      Click the button below to create a new one.
    </p>

    <!-- Main action -->
    <a href="${resetUrl}"
       style="background:#2f8f7a; color:#ffffff; padding:16px 22px; border-radius:14px; text-decoration:none; font-weight:700; font-size:15px; display:block; width:100%; box-sizing:border-box; text-align:center;">
      Reset my password
    </a>

    <p style="margin:14px 0 0; color:#8a929c; font-size:13px; line-height:1.5; text-align:center;">
      This link expires in 30 minutes and can only be used once.
    </p>

    <hr style="border:0; border-top:1px solid #e3e7ec; margin:28px 0;" />

    <!-- Fallback link -->
    <p style="margin:0 0 8px; color:#1b2430; font-size:14px; font-weight:700;">Having trouble with the button?</p>
    <p style="margin:0 0 10px; color:#545f6e; font-size:13px; line-height:1.5;">Copy and paste this link into your browser:</p>
    <div style="background:#f4f6f8; border:1px solid #e3e7ec; border-radius:10px; padding:10px 12px; font-size:12px; line-height:1.5; word-break:break-all; overflow-wrap:anywhere;">
      <a href="${resetUrl}" style="color:#2f8f7a; text-decoration:none;">${resetUrl}</a>
    </div>

    <hr style="border:0; border-top:1px solid #e3e7ec; margin:28px 0;" />

    <!-- Not you? -->
    <p style="margin:0 0 6px; color:#1b2430; font-size:14px; font-weight:700;">Didn't request a password reset?</p>
    <p style="margin:0 0 28px; color:#545f6e; font-size:13px; line-height:1.5;">
      No action is needed. Your password will remain unchanged.
    </p>

    <!-- Footer -->
    <div style="text-align:center; padding-top:4px;">
      <div style="color:#1b2430; font-size:14px; font-weight:700; letter-spacing:1px;">MechVerse</div>
      <div style="color:#8a929c; font-size:12px; margin-top:2px;">Learn. Prepare. Build.</div>
    </div>
  </div>`;
}

// Returns { sent: true } on success, { sent: false, reason } if email isn't
// configured or the send genuinely failed -- callers use this to decide
// whether to fall back to showing the link on-screen.
async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!isConfigured()) return { sent: false, reason: 'not_configured' };
  try {
    await sendViaBrevo({
      to,
      subject: 'Reset your MechVerse password',
      html: passwordResetEmailHtml(resetUrl, name),
      text: `Let's get you back into MechVerse.\n\nWe received a request to reset your MechVerse password. Use this link to create a new one:\n${resetUrl}\n\nThis link expires in 30 minutes and can only be used once.\n\nDidn't request a password reset? No action is needed. Your password will remain unchanged.`,
    });
    return { sent: true };
  } catch (err) {
    console.error('[mailer] Failed to send password reset email:', err.message);
    return { sent: false, reason: 'send_failed' };
  }
}

function welcomeEmailHtml(name, email, posterCid) {
  const features = [
    ['📘', 'Resource Hub', 'Notes, videos, and past papers, neatly sorted by unit for effortless revision.'],
    ['🎯', 'Grade Planner', 'Set your target SGPA and know exactly what marks you need to get there.'],
    ['🧪', 'Lab Companion', 'Walk into every lab prepared with manuals, experiments, and viva essentials at your fingertips.'],
    ['⭐', 'Bookmarks & Continue Learning', 'Save what matters and pick up exactly where you left off, every time.'],
    ['🧮', 'SGPA Calculator', 'Calculate your SGPA in seconds with no manual math or guesswork.'],
  ];

  const posterBlock = posterCid
    ? `<img src="cid:${posterCid}" alt="Welcome to MechVerse" style="width:100%; max-width:480px; border-radius:14px; display:block; margin: 0 auto 24px;" />`
    : `<div style="background:linear-gradient(135deg,#2f8f7a,#1f6b5a); border-radius:14px; padding:28px 24px; text-align:center; margin-bottom:24px;">
         <div style="font-size:26px; margin-bottom:4px;">⚙️</div>
         <div style="color:#fff; font-size:20px; font-weight:700;">Welcome to MechVerse!</div>
       </div>`;

  // Bullet points, not a description-heavy table -- title on its own line,
  // one short line of detail underneath.
  const featureItems = features
    .map(
      ([icon, title, desc]) => `
      <li style="margin-bottom:14px;">
        <span style="font-weight:700; color:#1b2430;">${icon} ${title}</span><br />
        <span style="color:#545f6e; font-size:13px; line-height:1.4;">${desc}</span>
      </li>`
    )
    .join('');

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1b2430;">
    ${posterBlock}
    <h2 style="margin-bottom: 4px;">Hi ${name}, welcome to MechVerse! 🎉</h2>
    <p style="color: #545f6e; line-height: 1.5;">
      Your account is ready, and you're signed up with <strong>${email}</strong>.
      MechVerse brings everything you need for your Mechanical Engineering semester, neatly organized and ready to explore. Here's what's waiting for you:
    </p>
    <ul style="padding-left: 18px; margin: 16px 0 20px;">${featureItems}</ul>
    <p style="margin: 24px 0;">
      <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:4000'}/dashboard.html"
         style="background:#2f8f7a; color:#ffffff; padding:16px 22px; border-radius:14px; text-decoration:none; font-weight:700; font-size:15px; display:block; width:100%; box-sizing:border-box; text-align:center;">
        Go to your dashboard
      </a>
    </p>
    <p style="color: #8a929c; font-size: 13px; line-height: 1.5;">
      Wishing you a great semester. We hope MechVerse makes it a little easier!
    </p>
  </div>`;
}

// Never throws, so a flaky mail service can't break someone's signup.
// Deliberately does NOT include the person's password.
async function sendWelcomeEmail({ to, name }) {
  if (!isConfigured()) return { sent: false, reason: 'not_configured' };
  const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:4000';
  try {
    await sendViaBrevo({
      to,
      subject: 'Welcome to MechVerse 🎉',
      html: welcomeEmailHtml(name, to, null),
      text: `Hi ${name}, welcome to MechVerse! Your account is ready, and you're signed up with ${to}. Log in to explore the Resource Hub, Grade Planner, Lab Companion, bookmarks and the SGPA Calculator: ${origin}/dashboard.html`,
    });
    return { sent: true };
  } catch (err) {
    console.error('[mailer] Failed to send welcome email:', err.message);
    return { sent: false, reason: 'send_failed' };
  }
}

module.exports = { sendPasswordResetEmail, sendWelcomeEmail, verifyMailerOnBoot, isConfigured, fromAddress, sendViaBrevo };
