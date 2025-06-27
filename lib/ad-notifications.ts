import { sendEmail } from '@/lib/email';
import { createInAppNotification } from '@/lib/notificationService';
import { getUsersByRole } from '@/lib/user-utils';

interface AdDetails {
  submitterId: string | undefined;
  submitterEmail: string | undefined;
  title: string;
  adId: string;
}

interface NotificationParams {
  adDetails: AdDetails;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

export async function sendAdReviewNotifications(params: NotificationParams) {
  const { adDetails, status, rejectionReason } = params;

  const { submitterId, submitterEmail, title, adId } = adDetails;

  let submitterNotificationTitle = '';
  let submitterNotificationMessage = '';
  let submitterNotificationLevel: 'success' | 'error' = 'success';
  let emailSubject = '';
  let emailText = '';
  let emailHtmlContent = '';

  if (status === 'approved') {
    submitterNotificationTitle = 'Your Ad Has Been Approved!';
    submitterNotificationMessage = `Congratulations! Your ad "${title}" (ID: ${adId}) has been approved.`;
    submitterNotificationLevel = 'success';

    emailSubject = `Ad Approved: "${title}"`;
    emailText = `Hi,\n\nYour ad titled "${title}" (ID: ${adId}) has been approved.\n\Thank you for complying!`;
    emailHtmlContent = `<p>Hi,</p><p>Your ad titled "<strong>${title}</strong>" (ID: ${adId}) has been approved.</p><p>Thank you for complying with AdScreener!</p>`;
  } else { // 'rejected'
    submitterNotificationTitle = 'Your Ad Has Been Rejected';
    submitterNotificationMessage = `Unfortunately, your ad "${title}" (ID: ${adId}) has been rejected. Reason: ${rejectionReason}`;
    submitterNotificationLevel = 'error';

    emailSubject = `Ad Rejected: "${title}"`;
    emailText = `Hi,\n\nYour ad titled "${title}" (ID: ${adId}) has been rejected.\nReason: ${rejectionReason}\n\nPlease review the feedback and make necessary changes if you wish to resubmit.\n\nAdScreener Team`;
    emailHtmlContent = `<p>Hi,</p><p>Your ad titled "<strong>${title}</strong>" (ID: ${adId}) has been rejected.</p><p><strong>Reason:</strong> ${rejectionReason}</p><p>Please review the feedback and resubmit if applicable.</p><p>AdScreener Team</p>`;
  }

  // 1. In-App Notification to Submitter
  if (submitterId) {
    console.log(`[API - Ad Review] Attempting to send in-app notification to submitter ${submitterId} for Ad ${adId} status ${status}`);
    createInAppNotification({
      userId: submitterId,
      title: submitterNotificationTitle,
      message: submitterNotificationMessage,
      level: submitterNotificationLevel,
      deepLink: `/submitter/ads?adId=${adId}` // Example deep link
    }).then(() => console.log(`[API - Ad Review] In-app notification sent to submitter ${submitterId} for Ad ${adId}`))
      .catch(err => console.error(`[API - Ad Review] Failed to send in-app notification to submitter ${submitterId} for Ad ${adId}:`, err));
  } else {
    console.warn(`No submitterId found for Ad ${adId}, cannot send in-app notification.`);
  }

  // 2. Email Notification to Submitter
  if (submitterEmail) {
    console.log(`[API - Ad Review] Attempting to send email notification to submitter ${submitterEmail} for Ad ${adId} status ${status}`);
    sendEmail({
      to: submitterEmail,
      subject: emailSubject,
      text: emailText,
      htmlContent: emailHtmlContent
    }).then(() => console.log(`[API - Ad Review] Email notification sent to submitter ${submitterEmail} for Ad ${adId}`))
      .catch(err => console.error(`[API - Ad Review] Failed to send email notification to submitter ${submitterEmail} for Ad ${adId}:`, err));
  } else {
    console.warn(`No submitterEmail found for Ad ${adId}, cannot send email notification.`);
  }

  // 3. In-App Notification to Reviewers and Admins
  try {
    const reviewers = await getUsersByRole(['reviewer']);
    const admins = await getUsersByRole(['admin', 'superadmin']);

    const notificationTitle = `Ad ${status === 'approved' ? 'Approved' : 'Rejected'}`;
    const notificationMessage = `Ad "${title}" (ID: ${adId}) has been ${status}.`;
    const notificationLevel: 'info' | 'success' | 'warning' | 'error' = status === 'approved' ? 'success' : 'error';
    const deepLink = `/admin/ads?adId=${adId}`; // Example deep link for admins/reviewers

    // Notify Reviewers
    for (const reviewer of reviewers) {
      console.log(`[API - Ad Review] Attempting to send in-app notification to reviewer ${reviewer._id} for Ad ${adId} status ${status}`);
      createInAppNotification({
        userId: reviewer._id,
        title: notificationTitle,
        message: notificationMessage,
        level: notificationLevel,
        deepLink: deepLink
      }).then(() => console.log(`[API - Ad Review] In-app notification sent to reviewer ${reviewer._id} for Ad ${adId}`))
        .catch(err => console.error(`[API - Ad Review] Failed to send in-app notification to reviewer ${reviewer._id} for Ad ${adId}:`, err));
    }

    // Notify Admins
    for (const admin of admins) {
      console.log(`[API - Ad Review] Attempting to send in-app notification to admin ${admin._id} for Ad ${adId} status ${status}`);
      createInAppNotification({
        userId: admin._id,
        title: notificationTitle,
        message: notificationMessage,
        level: notificationLevel,
        deepLink: deepLink
      }).then(() => console.log(`[API - Ad Review] In-app notification sent to admin ${admin._id} for Ad ${adId}`))
        .catch(err => console.error(`[API - Ad Review] Failed to send in-app notification to admin ${admin._id} for Ad ${adId}:`, err));
    }
  } catch (error) {
    console.error(`[API - Ad Review] Error sending notifications to reviewers/admins for Ad ${adId}:`, error);
  }
}
