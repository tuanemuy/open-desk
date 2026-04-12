import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Notification } from "@/core/domain/notification/entity";
import type { EmailNotificationSender } from "@/core/domain/notification/ports/emailNotificationSender";
import type { EmailNotificationFormat as EmailNotificationFormatType } from "@/core/domain/notification/valueObject";

/**
 * SMTP configuration for the email notification sender.
 */
export type SmtpConfig = Readonly<{
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}>;

/**
 * Strip HTML tags from a string to produce plain text.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Wrap notification content in a simple HTML email template.
 */
function buildHtmlBody(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;font-family:sans-serif;background-color:#f4f4f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding:24px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:24px 32px;">
              <h1 style="margin:0 0 16px;font-size:20px;color:#333333;">${escapeHtml(title)}</h1>
              <div style="font-size:14px;line-height:1.6;color:#555555;">${content}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Escape special characters for safe HTML insertion.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * SMTP-based implementation of EmailNotificationSender using Nodemailer.
 */
export class SmtpEmailNotificationSender implements EmailNotificationSender {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: SmtpConfig) {
    this.from = config.from;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }

  async send(
    notification: Notification,
    recipientEmail: string,
    format: EmailNotificationFormatType,
  ): Promise<void> {
    const subject = String(notification.title);
    const content = String(notification.content);

    const mailOptions =
      format === "HTML"
        ? {
            from: this.from,
            to: recipientEmail,
            subject,
            html: buildHtmlBody(subject, content),
            text: stripHtml(content),
          }
        : {
            from: this.from,
            to: recipientEmail,
            subject,
            text: stripHtml(content),
          };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error: unknown) {
      throw new SystemError(
        SystemErrorCode.NetworkError,
        `Failed to send email notification to ${recipientEmail}`,
        error,
      );
    }
  }

  async sendBatch(
    items: ReadonlyArray<{
      notification: Notification;
      recipientEmail: string;
      format: EmailNotificationFormatType;
    }>,
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      items.map((item) =>
        this.send(item.notification, item.recipientEmail, item.format),
      ),
    );

    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    if (failures.length > 0) {
      throw new SystemError(
        SystemErrorCode.NetworkError,
        `Failed to send ${failures.length} of ${items.length} email notifications`,
        failures[0].reason,
      );
    }
  }
}
