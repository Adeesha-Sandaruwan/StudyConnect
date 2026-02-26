import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service for Student Request Management
 * Uses Resend API or Nodemailer SMTP
 * 
 * Features:
 * - Send notifications when tutor is assigned
 * - Send notifications when request status changes
 * - Send notifications when new request is created
 */

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send email when a tutor is assigned to a student request
 * @param {Object} studentEmail - Student's email
 * @param {String} studentName - Student's name
 * @param {String} tutorName - Assigned tutor's name
 * @param {String} subject - Request subject
 * @param {String} requestId - Request ID for reference
 */
export const sendTutorAssignmentEmail = async (
  studentEmail,
  studentName,
  tutorName,
  subject,
  requestId
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: `Great News! A Tutor Has Been Assigned - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2>Tutor Assigned Successfully!</h2>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hi <strong>${studentName}</strong>,</p>
            
            <p>We're excited to inform you that a qualified tutor has been assigned to your <strong>${subject}</strong> request!</p>
            
            <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
              <p><strong>Tutor Name:</strong> ${tutorName}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Request ID:</strong> ${requestId}</p>
            </div>
            
            <p>Your tutor will be reaching out soon to discuss the best learning schedule and approach tailored to your needs.</p>
            
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              Best regards,<br/>
              <strong>StudyConnect Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 15px; color: #999; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px;">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Tutor assignment email sent to ${studentEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending tutor assignment email:', error);
    return false;
  }
};

/**
 * Send email when request status is updated
 * @param {Object} userEmail - User's email
 * @param {String} userName - User's name
 * @param {String} status - New status
 * @param {String} subject - Request subject
 * @param {String} requestId - Request ID
 */
export const sendStatusUpdateEmail = async (
  userEmail,
  userName,
  status,
  subject,
  requestId
) => {
  try {
    const statusMessages = {
      'open': 'Your request is now open and visible to tutors.',
      'in-progress': 'Your request has been accepted and is in progress.',
      'completed': 'Congratulations! Your request has been completed.',
      'cancelled': 'Your request has been cancelled.'
    };

    const statusColor = {
      'open': '#2196F3',
      'in-progress': '#FF9800',
      'completed': '#4CAF50',
      'cancelled': '#f44336'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Request Status Update - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: ${statusColor[status] || '#2196F3'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2>Request Status Updated</h2>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hi <strong>${userName}</strong>,</p>
            
            <p>Your <strong>${subject}</strong> request status has been updated:</p>
            
            <div style="background-color: ${statusColor[status] || '#2196F3'}20; padding: 20px; border-left: 4px solid ${statusColor[status] || '#2196F3'}; margin: 20px 0; border-radius: 4px;">
              <p style="font-size: 18px; font-weight: bold; color: ${statusColor[status] || '#2196F3'}; margin: 0;">
                ${status.toUpperCase()}
              </p>
              <p style="margin: 10px 0 0 0;">${statusMessages[status]}</p>
            </div>
            
            <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
              <p><strong>Request ID:</strong> ${requestId}</p>
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              If you have any questions, feel free to reach out to our support team.<br/>
              Best regards,<br/>
              <strong>StudyConnect Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 15px; color: #999; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px;">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Status update email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending status update email:', error);
    return false;
  }
};

/**
 * Send email when a new student request is created
 * Notifies student of creation confirmation
 * @param {Object} studentEmail - Student's email
 * @param {String} studentName - Student's name
 * @param {String} subject - Request subject
 * @param {String} gradeLevel - Grade level
 * @param {String} requestId - Request ID
 */
export const sendRequestCreationEmail = async (
  studentEmail,
  studentName,
  subject,
  gradeLevel,
  requestId
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: `Request Created Successfully - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #2196F3; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2>Request Created Successfully!</h2>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hi <strong>${studentName}</strong>,</p>
            
            <p>Thank you for creating a request on StudyConnect! We've successfully received your request and it's now live on our platform.</p>
            
            <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
              <p><strong>Request Details:</strong></p>
              <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 8px 0;"><strong>Grade Level:</strong> ${gradeLevel}</p>
              <p style="margin: 8px 0;"><strong>Request ID:</strong> ${requestId}</p>
              <p style="margin: 8px 0;"><strong>Status:</strong> Open</p>
            </div>
            
            <p>Qualified tutors will be notified about your request and can now start responding. You'll receive an email notification as soon as a tutor is assigned to your request.</p>
            
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              What's next?
            </p>
            <ul style="color: #666; font-size: 14px;">
              <li>Tutors will review your request</li>
              <li>You'll be notified when a tutor is assigned</li>
              <li>Start your learning journey!</li>
            </ul>
            
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              Best regards,<br/>
              <strong>StudyConnect Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 15px; color: #999; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px;">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Request creation email sent to ${studentEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending request creation email:', error);
    return false;
  }
};

/**
 * Send email to admin/tutors when a new student request is created
 * @param {Array<String>} emailList - List of admin/tutor emails
 * @param {String} subject - Request subject
 * @param {String} gradeLevel - Grade level
 * @param {String} studentName - Student's name
 * @param {String} description - Request description
 * @param {String} requestId - Request ID
 */
export const sendAdminNotificationEmail = async (
  emailList,
  subject,
  gradeLevel,
  studentName,
  description,
  requestId
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailList.join(', '),
      subject: `New Tutoring Request - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #FF9800; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2>New Request Available</h2>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hi Admin/Tutor,</p>
            
            <p>A new student request has been posted on StudyConnect. Please review and consider assigning it if you're available.</p>
            
            <div style="background-color: #fff8e1; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
              <p><strong>Request Details:</strong></p>
              <p style="margin: 8px 0;"><strong>Request ID:</strong> ${requestId}</p>
              <p style="margin: 8px 0;"><strong>Student:</strong> ${studentName}</p>
              <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 8px 0;"><strong>Grade Level:</strong> ${gradeLevel}</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 15px; border: 1px solid #eee; margin: 15px 0; border-radius: 4px;">
              <p><strong>Description:</strong></p>
              <p style="color: #666; word-wrap: break-word;">${description}</p>
            </div>
            
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              If you're interested in this request, please log in to the admin panel to assign this request to yourself or another tutor.
            </p>
            
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              Best regards,<br/>
              <strong>StudyConnect System</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 15px; color: #999; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px;">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Admin notification email sent to ${emailList.length} recipients`);
    return true;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
};

export default {
  sendTutorAssignmentEmail,
  sendStatusUpdateEmail,
  sendRequestCreationEmail,
  sendAdminNotificationEmail
};
