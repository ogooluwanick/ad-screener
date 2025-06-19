import nodemailer from "nodemailer";

const email = process.env.NEXT_PUBLIC_NODEMAIL_EMAIL;
const password = process.env.NEXT_PUBLIC_NODEMAIL_PASS;

if (!email || !password) {
  console.error("Email or password for nodemailer is not defined in environment variables.");
  // Optionally, throw an error or handle this case as per your application's needs
  // throw new Error("Nodemailer email or password not configured");
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email,
    pass: password,
  },
});

export const mailOptsBase = {
  from: email,
  // 'to' will be set per email
};

// Placeholder for the capitalize function
// You should replace this with your actual implementation
const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Placeholder for the email template
// You should replace this with your actual HTML email template
const getDefaultEmailTemplate = (customerName: string, message: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Notification</title>
    </head>
    <body>
      <p>Hi ${customerName},</p>
      <p>${message}</p>
      <p>Thank you,</p>
      <p>AdScreener's </p>
    </body>
    </html>
  `;
};

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  htmlContent?: string; // Optional: if not provided, a default template will be used
  customerName?: string; // Optional: for personalizing the default template
}

export const sendEmail = async ({ to, subject, text, htmlContent, customerName = "Valued Customer" }: SendEmailParams) => {
  if (!email) {
    console.error("Nodemailer 'from' email is not configured. Email not sent.");
    return; // Or throw an error
  }

  const mailOptions = {
    ...mailOptsBase,
    to: to,
    subject: subject,
    text: text,
    html: htmlContent || getDefaultEmailTemplate(capitalize(customerName.split(" ")[0]), text),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to} with subject "${subject}"`);
  } catch (error) {
    console.error("Error sending email:", error);
    // Handle error appropriately
  }
};

// Example usage (from your snippet, adapted)
export const sendSignupEmail = async (customerEmail: string, Cname: string) => {
  if (!email) {
    console.error("Nodemailer 'from' email is not configured. Signup email not sent.");
    return;
  }
  const subject = `AdScreener's  SIGNUP! 🎉`;
  const text = `Hi ${capitalize(Cname.split(" ")[0])}, \nThank you for signing up with us at AdScreener's . Enjoy a beautiful shopping experience.`;
  
  // Assuming you have a specific HTML template for signups
  // For now, using a modified version of the default template or you can provide your specific 'template' variable
  const signupHtmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Welcome to AdScreener's !</title>
    </head>
    <body>
      <h1>Welcome, ${capitalize(Cname.split(" ")[0])}!</h1>
      <p>Thank you for signing up with us at AdScreener's .</p>
      <p>We're thrilled to have you. Enjoy a beautiful shopping experience!</p>
      <p>Best regards,</p>
      <p>The AdScreener's  Team</p>
    </body>
    </html>
  `;

  await sendEmail({
    to: customerEmail, // Assuming the customer's email is the recipient for their signup confirmation
    subject,
    text,
    htmlContent: signupHtmlTemplate, // Or your specific template variable
    customerName: Cname,
  });

  // If you also need to send a notification to the admin email (yourself)
  // await sendEmail({
  //   to: email, // Admin email
  //   subject: `New Signup: ${Cname}`,
  //   text: `A new user has signed up: ${Cname} (${customerEmail})`,
  //   customerName: "Admin"
  // });
};

export const sendVerificationEmail = async (customerEmail: string, Cname: string, verificationToken: string) => {
  if (!email) {
    console.error("Nodemailer 'from' email is not configured. Verification email not sent.");
    // Potentially throw an error to be caught by the calling function in register route
    throw new Error("Nodemailer 'from' email is not configured.");
  }

  // Ensure NEXT_PUBLIC_APP_URL is set in your .env file
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const verificationLink = `${appUrl}/api/auth/verify-email?token=${verificationToken}`;

  const subject = `Verify Your Email for AdScreener`;
  const text = `Hi ${capitalize(Cname.split(" ")[0])}, \nPlease verify your email address by clicking the link below:\n${verificationLink}\nIf you did not request this, please ignore this email. This link will expire in 24 hours.`;
  
  const verificationHtmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { width: 90%; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .button { background-color: #007bff; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
        .footer { margin-top: 20px; font-size: 0.9em; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Verify Your Email Address</h1>
        <p>Hi ${capitalize(Cname.split(" ")[0])},</p>
        <p>Thanks for signing up for AdScreener! To complete your registration, please verify your email address by clicking the button below:</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${verificationLink}" class="button">Verify Email Address</a>
        </p>
        <p>If the button above doesn't work, copy and paste the following link into your web browser:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>This verification link is valid for the next 24 hours.</p>
        <p>If you didn't sign up for AdScreener, please disregard this email.</p>
        <div class="footer">
          <p>Thanks,</p>
          <p>The AdScreener Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: customerEmail,
    subject,
    text,
    htmlContent: verificationHtmlTemplate,
    customerName: Cname,
  });
};

export const sendPasswordResetEmail = async (customerEmail: string, Cname: string, resetLink: string) => {
  if (!email) {
    console.error("Nodemailer 'from' email is not configured. Password reset email not sent.");
    return;
  }
  const subject = `AdScreener Password Reset Request`;
  const text = `Hi ${capitalize(Cname.split(" ")[0])}, \nYou requested a password reset. Click the link below to reset your password:\n${resetLink}\nIf you did not request this, please ignore this email. This link will expire in 1 hour.`;
  
  const passwordResetHtmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Password Reset Request</title>
    </head>
    <body>
      <h1>Password Reset Request</h1>
      <p>Hi ${capitalize(Cname.split(" ")[0])},</p>
      <p>You recently requested to reset your password for your AdScreener account. Click the button below to reset it.</p>
      <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Your Password</a>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>This password reset link is only valid for the next 1 hour.</p>
      <p>Thanks,</p>
      <p>The AdScreener Team</p>
    </body>
    </html>
  `;

  await sendEmail({
    to: customerEmail,
    subject,
    text,
    htmlContent: passwordResetHtmlTemplate,
    customerName: Cname,
  });
};
