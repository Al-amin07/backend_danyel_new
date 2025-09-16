import { User } from '../modules/user/user.model';
import { sendEmail } from './sendEmail';

const emailSendBulkOrSingle = async (
  sendToList: string[] | 'all' | string,
  subject: string,
  html: string,
) => {
  if (sendToList === 'all') {
    // Fetch all active and approved users who are not deleted
    const allEmails = await User.find(
      {
        isDeleted: false,
        requestState: 'approved',
        status: 'activeMember',
      },
      { email: 1, _id: 0 }, // Only select the 'email' field
    );

    // Extract email addresses from the result
    const emailAddresses = allEmails.map((user) => user.email);

    // Send an email to each address
    for (const to of emailAddresses) {
      await sendEmail(to, subject, html);
    }
  } else if (typeof sendToList === 'string') {
    // Handle single email string
    await sendEmail(sendToList, subject, html);
  } else if (Array.isArray(sendToList)) {
    // Handle array of email addresses
    for (const to of sendToList) {
      await sendEmail(to, subject, html);
    }
  } else {
    throw new Error('Invalid input for sendToList');
  }
};

export default emailSendBulkOrSingle;
