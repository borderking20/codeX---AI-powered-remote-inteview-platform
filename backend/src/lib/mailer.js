import nodemailer from "nodemailer";
import { ENV } from "./env.js";

// Gmail SMTP transporter — can send to ANY email, no restrictions
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ENV.GMAIL_USER,
    pass: ENV.GMAIL_APP_PASSWORD,
  },
});

/**
 * Sends an invite email to a candidate for a private interview session.
 * NOTE: The problem/question is intentionally NOT included in this email.
 */
export async function sendInviteEmail({ toEmail, hostName, joinLink }) {
  const mailOptions = {
    from: `"CodeX Platform" <${ENV.GMAIL_USER}>`,
    to: toEmail,
    subject: `${hostName} has invited you to a private coding interview on CodeX`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>CodeX Interview Invitation</title>
        </head>
        <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);">
                  
                  <!-- HEADER BANNER -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);padding:40px 48px;text-align:center;">
                      <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:2px;color:rgba(255,255,255,0.8);text-transform:uppercase;">You have been invited</p>
                      <h1 style="margin:0;font-size:36px;font-weight:900;color:#ffffff;letter-spacing:-1px;">CodeX</h1>
                      <p style="margin:8px 0 0 0;font-size:15px;color:rgba(255,255,255,0.8);">Real-Time Collaborative Interview Platform</p>
                    </td>
                  </tr>

                  <!-- BODY -->
                  <tr>
                    <td style="padding:48px;">
                      <p style="margin:0 0 24px 0;font-size:16px;color:#94a3b8;line-height:1.6;">
                        Hello,
                      </p>
                      <p style="margin:0 0 24px 0;font-size:18px;color:#e2e8f0;line-height:1.7;">
                        <strong style="color:#a78bfa;">${hostName}</strong> has invited you to participate in a <strong style="color:#e2e8f0;">private coding interview session</strong> on the CodeX platform.
                      </p>

                      <!-- INFO BOX -->
                      <div style="background-color:#0f172a;border:1px solid #334155;border-left:4px solid #6366f1;border-radius:10px;padding:20px 24px;margin:0 0 32px 0;">
                        <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">What to expect</p>
                        <ul style="margin:0;padding:0 0 0 20px;color:#94a3b8;font-size:14px;line-height:1.8;">
                          <li>A real-time coding challenge in a collaborative environment</li>
                          <li>Live video call with your interviewer</li>
                          <li>Full-screen mode required for a fair assessment</li>
                          <li>You will receive an AI-generated performance report after the session</li>
                        </ul>
                      </div>

                      <!-- CTA BUTTON -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding:8px 0 32px 0;">
                            <a href="${joinLink}" 
                               style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;letter-spacing:0.5px;box-shadow:0 4px 15px rgba(99,102,241,0.4);">
                              🚀 Join Interview Session
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- DISCLAIMER -->
                      <div style="background-color:#0f172a;border:1px solid #334155;border-radius:10px;padding:16px 20px;margin:0 0 24px 0;">
                        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                          🔒 <strong style="color:#94a3b8;">Secure &amp; Private:</strong> This invitation link is unique to you. You must be logged into CodeX with this email address to join. The link will expire once the session ends.
                        </p>
                      </div>

                      <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                        If you cannot click the button, copy and paste this link into your browser:<br/>
                        <a href="${joinLink}" style="color:#6366f1;word-break:break-all;">${joinLink}</a>
                      </p>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background-color:#0f172a;padding:24px 48px;border-top:1px solid #1e293b;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#334155;">
                        © 2025 CodeX Platform · This is an automated message, please do not reply directly to this email.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Invite email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Gmail invite email error:", error);
    throw new Error(`Failed to send invite email: ${error.message}`);
  }
}

/**
 * Sends an AI-generated performance report to the candidate after the session.
 */
export async function sendReportEmail({ toEmail, candidateName, hostName, problem, ratings, aiReport }) {
  const paramLabels = {
    problemSolving: "🧠 Problem Solving",
    communication: "🗣️ Communication",
    codeQuality: "💻 Code Quality",
    timeManagement: "⏱️ Time Management",
    overallImpression: "⭐ Overall Impression",
  };

  const ratingRows = Object.entries(ratings)
    .map(([key, value]) => {
      const stars = "★".repeat(value) + "☆".repeat(5 - value);
      const color = value >= 4 ? "#22c55e" : value === 3 ? "#f59e0b" : "#ef4444";
      return `
        <tr>
          <td style="padding:10px 16px;color:#94a3b8;font-size:14px;border-bottom:1px solid #1e293b;">${paramLabels[key] || key}</td>
          <td style="padding:10px 16px;text-align:right;border-bottom:1px solid #1e293b;">
            <span style="color:${color};font-size:16px;letter-spacing:2px;">${stars}</span>
            <span style="color:#64748b;font-size:12px;margin-left:8px;">${value}/5</span>
          </td>
        </tr>`;
    })
    .join("");

  const mailOptions = {
    from: `"CodeX Platform" <${ENV.GMAIL_USER}>`,
    to: toEmail,
    subject: `Your CodeX Interview Performance Report — ${problem}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);">
                  
                  <!-- HEADER -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#059669,#0891b2,#6366f1);padding:40px 48px;text-align:center;">
                      <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:2px;color:rgba(255,255,255,0.8);text-transform:uppercase;">Performance Report</p>
                      <h1 style="margin:0;font-size:36px;font-weight:900;color:#ffffff;letter-spacing:-1px;">CodeX</h1>
                      <p style="margin:8px 0 0 0;font-size:15px;color:rgba(255,255,255,0.8);">AI-Powered Interview Analysis</p>
                    </td>
                  </tr>

                  <!-- BODY -->
                  <tr>
                    <td style="padding:48px;">
                      <p style="margin:0 0 8px 0;font-size:18px;color:#e2e8f0;font-weight:700;">Hello, ${candidateName}! 👋</p>
                      <p style="margin:0 0 32px 0;font-size:15px;color:#94a3b8;line-height:1.7;">
                        Your interview session with <strong style="color:#a78bfa;">${hostName}</strong> has concluded. Here is your detailed performance report.
                      </p>

                      <!-- RATINGS TABLE -->
                      <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">Performance Ratings</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;border:1px solid #334155;border-radius:10px;overflow:hidden;margin:0 0 32px 0;">
                        ${ratingRows}
                      </table>

                      <!-- AI REPORT -->
                      <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">✨ AI Performance Analysis</p>
                      <div style="background-color:#0f172a;border:1px solid #334155;border-left:4px solid #6366f1;border-radius:10px;padding:24px;margin:0 0 32px 0;">
                        <p style="margin:0;font-size:15px;color:#cbd5e1;line-height:1.85;white-space:pre-line;">${aiReport}</p>
                      </div>

                      <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                        Keep practicing and improving. Every interview is a learning opportunity. 💪
                      </p>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background-color:#0f172a;padding:24px 48px;border-top:1px solid #1e293b;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#334155;">
                        © 2025 CodeX Platform · AI report generated by Groq
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Report email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Gmail report email error:", error);
    throw new Error(`Failed to send report email: ${error.message}`);
  }
}
