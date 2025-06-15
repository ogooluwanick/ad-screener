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
