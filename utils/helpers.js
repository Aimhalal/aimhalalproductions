import nodemailer from "nodemailer";
import notification from '../models/notification.js';
import { Vonage } from "@vonage/server-sdk";
import axios from "axios";
import activity from "../models/activity.js";
import Twilio from "twilio/lib/rest/Twilio.js";
import sizeOf from 'image-size';

import serviceAccount from "../config/psi.js";
import Admin from 'firebase-admin';

import fs from 'fs';
import path from 'node:path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

Admin.initializeApp({
    credential: Admin.credential.cert(serviceAccount)
});

const vonage = new Vonage({
    apiKey: "3d4c4028",
    apiSecret: "HJuo5Eh5oH0nUHkK"
})

const sendVendorRequest = async (email) => {
  console.log("email value vendor", email);
  try {
  //   let transportor = nodemailer.createTransport({
  //     host: process.env.HOST,
  //     port: process.env.MAIL_PORT,
  //     auth: {
  //         user: process.env.MAIL_USERNAME,
  //         pass: process.env.MAIL_PASSWAORD
  //     }
  // })
  // let mailOption = {
  //     from: process.env.MAIL_USERNAME,
  //     to: "connect@aimhalal.com",
  //     subject: "New Vendor Registration",
  //     text: `Dear Admin, a new user vendor has registered`
  // }
  // let result = await transportor.sendMail(mailOption);
  // console.log(result);
  // return result;
    // Create a configured nodemailer transporter for this specific email (Outlook SMTP)
    // console.log(process.env.SMTP_PASSWORD);
    const mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // STARTTLS on 587
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      requireTLS: true,
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false,
      },
    });

    // Verify the transporter configuration works
    await mailTransporter.verify();

    // Configure email options
    var emailOptions = {
      from: process.env.SMTP_MAIL,
      to: "beastmafia787898@gmail.com",
      subject: "New Vendor Registration",
      text: `Dear Admin, a new user vendor has registered`,
    };

    // Send the email
    let result = await mailTransporter.sendMail(emailOptions);
    return result;
  } catch (error) {
    
    return error.message;
  }
};

const sendNewsletter = async (email) => {
    try {
        let transportor = nodemailer.createTransport({
            host: process.env.HOST,
            port: process.env.MAIL_PORT,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWAORD
            }
        })
        let mailOption = {
            from: process.env.MAIL_USERNAME,
            to: 'connect@aimhalal.com',
            subject: "New Emails Subscription",
            text: `Dear Admin, You have a new email subscription`
        }
        let result = await transportor.sendMail(mailOption);
        return result;
    }
    catch (error) {
        return error.message
    }
}

const inquiry = async (data) => {
    try {
        let transportor = nodemailer.createTransport({
            host: process.env.HOST,
            port: process.env.MAIL_PORT,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWAORD
            }
        })
        let mailOption = {
            from: process.env.MAIL_USERNAME,
            to: 'connect@aimhalal.com',
            subject: "New Contact Us Inquiry",
            text: `
            subject : ${data.subject},
            user type : ${data.usertype},
            name: ${data.name},
            email: ${data.email}
            number:  ${data.dial_code}  ${data.phone_number}
            message : ${data.message}
        `
        }
        let result = await transportor.sendMail(mailOption);
        return result;
    }
    catch (error) {
        return error.message
    }
}

const sendAcceptanceEmail = async (email, password = '') => {
  console.log("sendAcceptanceEmail password and email", password, email);
    try {
        // let transportor = nodemailer.createTransport({
        //     host: process.env.HOST,
        //     port: process.env.MAIL_PORT,
        //     auth: {
        //         user: process.env.MAIL_USERNAME,
        //         pass: process.env.MAIL_PASSWAORD
        //     }
        // })
        // let mailOption = {
        //     from: process.env.MAIL_USERNAME,
        //     to: [email],
        //     subject: "New Vendor Registration",
        //     text: `
            
        //     Dear Vendor, Your Account has been Successfully Registered,

        //     Please find your credentials here

        //     email  : ${email}
        //     password : ${password}

        //     You can login to your store from the following link

        //     https://aimhalal.com/login

            
        //     `
        // }
        // let result = await transportor.sendMail(mailOption);
        // return result;
        const mailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
          },
          requireTLS: true,
          tls: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: false,
          },
        });
    
        // Verify the transporter configuration works
        await mailTransporter.verify();
    
        // Configure email options
        var emailOptions = {
          from: process.env.SMTP_MAIL,
          to: email,
          subject: "Vendor Approval",
          text: `Dear Vendor, Your Account has been Successfully Registered,

          Please find your credentials here

          email  : ${email}
          password : ${password}
          `,
        };
    
        // Send the email
        let result = await mailTransporter.sendMail(emailOptions);
        return result;
    }
    catch (error) {
        console.log(error);
        return error.message
    }

}

const sendEmailsForCustomer = async (email) => {
    try {
        // let transportor = nodemailer.createTransport({
        //     host: process.env.HOST,
        //     port: process.env.MAIL_PORT,
        //     auth: {
        //         user: process.env.MAIL_USERNAME,
        //         pass: process.env.MAIL_PASSWAORD
        //     }
        // })
        // let mailOption = {
        //     from: process.env.MAIL_USERNAME,
        //     to: [email],
        //     subject: "Vendor Approval",
        //     text: `
            
        //     Dear Customer, Your vendor Account has been Successfully Registered,

        //     you can login using your exisiting credentials 

        //     https://aimhalal.com/login

        //     `
        // }
        // let result = await transportor.sendMail(mailOption);
        // return result;
        const mailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
          },
          requireTLS: true,
          tls: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: false,
          },
        });
    
        // Verify the transporter configuration works
        await mailTransporter.verify();
    
        // Configure email options
        var emailOptions = {
          from: process.env.SMTP_MAIL,
          to: email,
          subject: "Vendor Approval",
          text: `Dear Customer, Your vendor Account has been Successfully Registered,

          you can login using your exisiting credentials 

          https://aimhalal.com/login

          `,
        };
    
        // Send the email
        let result = await mailTransporter.sendMail(emailOptions);
        return result;
    }
    catch (error) {
        console.log(error);
        return error.message
    }

}

const sendOrderEmail = async (email, text) => {
    try {
        // let transportor = nodemailer.createTransport({
        //     host: process.env.HOST,
        //     port: process.env.MAIL_PORT,
        //     auth: {
        //         user: process.env.MAIL_USERNAME,
        //         pass: process.env.MAIL_PASSWAORD
        //     }
        // })
        // let mailOption = {
        //     from: process.env.MAIL_USERNAME,
        //     to: [email],
        //     subject: "AIMHALAL",
        //     text: text
        // }
        // let result = await transportor.sendMail(mailOption);
        // return result;
        // Configure Outlook SMTP with STARTTLS
        const smtpPort = Number(process.env.SMTP_PORT) || 587;
        const mailTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
            port: smtpPort,
            secure: false,
            auth: {
              user: process.env.SMTP_MAIL,
              pass: process.env.SMTP_PASSWORD,
            },
            requireTLS: true,
            tls: {
              minVersion: 'TLSv1.2',
              rejectUnauthorized: false,
            }
          });

        await mailTransporter.verify();

        var emailOptions = {
          from: process.env.SMTP_MAIL,
          to: email,
          subject: "Aim Halal Order",
          text: text
        }
        let result = await mailTransporter.sendMail(emailOptions);
        console.log(result);
        console.log("Email sent successfully");
        return result;
    }
    catch (error) {
        console.log(error);
        return error.message
    }

}

const updateSettingPassword = async (email, password = '') => {
    try {
        let transportor = nodemailer.createTransport({
            host: process.env.HOST,
            port: process.env.MAIL_PORT,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWAORD
            }
        })
        let mailOption = {
            from: process.env.MAIL_USERNAME,
            to: [email],
            subject: "Password Updated",
            text: `
            
            Dear user, You have successfully updated your password

            Please find your credentials here

            email  : ${email}
            password : ${password}

            You can login to your store from the following link

            https://aimhalal.com/login

            
            `
        }
        let result = await transportor.sendMail(mailOption);
        return result;
    }
    catch (error) {
        console.log(error);
        return error.message
    }

}

const sendOtp = async (email, code, type = 'forget_password') => {
    try {
        // let transportor = nodemailer.createTransport({
        //     host: process.env.HOST,
        //     port: process.env.MAIL_PORT,
        //     auth: {
        //         user: process.env.MAIL_USERNAME,
        //         pass: process.env.MAIL_PASSWAORD
        //     }
        // })
        // let mailOption = {
        //     from: process.env.MAIL_USERNAME,
        //     to: [email],
        //     subject: "AIM HALAL (OTP REQUEST)",
        //     text: `
        //     OTP CODE : ${code}
        //     `
        // }
        // let result = await transportor.sendMail(mailOption);
        // return result;
        // Force Outlook settings per your working config
        const primaryHost = 'smtp-mail.outlook.com';
        const smtpPort = 587;
        const isSslPort = false;

        async function createAndVerify(hostname) {
          const transporter = nodemailer.createTransport({
            host: hostname,
            port: smtpPort,
            secure: false, // STARTTLS on 587
            auth: {
              user: process.env.SMTP_MAIL,
              pass: process.env.SMTP_PASSWORD,
            },
            requireTLS: true,
            family: 4,
            connectionTimeout: 45000,
            greetingTimeout: 30000,
            socketTimeout: 60000,
            authMethod: 'LOGIN',
            tls: {
              minVersion: 'TLSv1.2',
              servername: hostname,
              rejectUnauthorized: false,
            }
          });
          
          await transporter.verify();
          return transporter;
        }

        let mailTransporter = await createAndVerify(primaryHost);
      
          // Configure email options
          var emailOptions = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject: "Aim Halal Otp",
            text: `Your Otp code for Aim Halal :  ${code}`,
          };
      
          // Send the email
          let result = await mailTransporter.sendMail(emailOptions);
          return { ok: true, info: result };
    }       
    catch (error) {
        console.log('sendOtp email error:', error?.message);
        return { ok: false, error: error?.message || 'Unknown email error' };
    }

}

const paginate = async (model, query = {}, populateFields = [], select = {}, page = 1, pageSize = 10, sortField = 'createdAt', sortOrder = 'desc') => {


    const skip = (page - 1) * pageSize;
    const countQuery = model.countDocuments(query);


    let dataQuery = model.find(query)
        .skip(skip)
        .limit(pageSize)
        .sort({ [sortField]: sortOrder }).select(select).lean()
        ;

    if (populateFields.length > 0) {
        console.log(populateFields);
        // Add populate logic for each field
        populateFields.forEach((field) => {
            dataQuery = dataQuery.populate(field.path, field.select);
        });
    }

    const [totalLength, results] = await Promise.all([countQuery, dataQuery.exec()]);

    const totalPages = Math.ceil(totalLength / pageSize);
    let pagination = {
        currentPage: page,
        totalPages,
        totalLength,
    }
    return {
        pagination,
        data: results,
    };
}
function paginateNew(records, page = 1, limit = 10) {
    page = isNaN(parseInt(page)) ? 1 : parseInt(page),
        limit = isNaN(parseInt(limit)) ? 1 : parseInt(limit);

    const results = {};
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    if (endIndex < records.length) {
        results.next = {
            page: page + 1,
            limit: limit
        }
    }
    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit
        }
    }
    results.totalPages = {
        page: Math.ceil(records.length / limit),
        limit: limit,
        totalRecords: records.length
    };

    results.result = records.slice(startIndex, endIndex);
    return results;
}

function generatePassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}


// notifications

let createNotification = async (req, fcmToken) => {
    console.log('req ============================', req);
    console.log('fcmToken ============================', fcmToken);
    try {
        
        const payload = {
            notification: {
                title: req.title,
                body: req.body,
            },
            data: {
                notification_id: "1212", // Convert _id to a string
            },
            token : fcmToken?.fcmToken || fcmToken
        };
        // fcm_token = 'eFlh-DQFSIulNlcVplBW1M:APA91bET06IE8r6XISxzGEk_bTOlbw1zqamOt8C9KXmfqhDQEN_Mbt3nQnTS1nP-GEBoRUWPOCYuDXmzU57a7wH6dUYh9V_reDf6fjFFyVDzRJJReXFxWwfUBmVPDvu3jeXZdCV05cxM';
        const response = await Admin.messaging().send(payload);
        console.log(response);
        return response;
    }
    catch (error) {
        console.log(error);
        return error.message
    }
}

async function sendTestNotification(fcmToken) {
    const payload = {
        notification: {
            title: "Test Notification",
            body: "This is a test notification sent using FCM!",
            sound: "adhan"
        },
        data: {
            notification_id: "12345",
            route: "/prayerTimeView",
            click_action: "FLUTTER_NOTIFICATION_CLICK"
        }
    };

    try {
        const response = await Admin.messaging().sendToDevice([fcmToken], payload);
        console.log("Successfully sent message:", response);
        return true
    } catch (error) {
        console.error("Error sending message:", error);
        return false
    }
}


const vonageSmsIntegration = async (number, msg) => {
    try {
        const from = "AIM HALAL"
        const text = msg

        let sendSms = await vonage.sms.send({ number, from, text })

        // Check if any messages failed to send
        if (sendSms.response && sendSms.response['message-count'] !== sendSms.response.messageCount) {
            console.error("Some SMS messages failed to send");
            return {
                error: true,
                message: "Some SMS messages failed to send"
            }
        }
        return {
            error: false,
            message: sendSms
        }
    } catch (error) {
        console.error(error);
        return {
            error: true,
            message: error.message
        }
    }
}


const sendUpdatedEmail = async (email, number = '', password = '') => {
    try {
        let transportor = nodemailer.createTransport({
            host: process.env.HOST,
            port: process.env.MAIL_PORT,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWAORD
            }
        })
        let mailOption = {
            from: process.env.MAIL_USERNAME,
            to: [email],
            subject: "Credential Updated",
            text: `
            
            Dear Vendor, Your Email and Number has been Successfully Updated,

            Please find your data here

            email  : ${email}
            number : ${number}
            password : ${password}

            You can login to your store from the following link

            https://aimhalal.com/login

            
            `
        }
        let result = await transportor.sendMail(mailOption);
        return result;
    }
    catch (error) {
        return error.message
    }

}

const sendPasswordResetEmail = async (email, resetUrl, username = '') => {
    try {
        const mailTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
            requireTLS: true,
            tls: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: false,
            },
        });

        // Verify the transporter configuration works
        await mailTransporter.verify();

        // Configure email options
        var emailOptions = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject: "Password Reset - Aim Halal",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c5aa0;">Password Reset Request</h2>
                    <p>Hello ${username || 'User'},</p>
                    <p>We received a request to reset your password for your Aim Halal account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #2c5aa0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                    <p><strong>Important:</strong></p>
                    <ul>
                        <li>This link will expire in 1 hour for security reasons</li>
                        <li>If you didn't request this password reset, please ignore this email</li>
                        <li>For security, never share this link with anyone</li>
                    </ul>
                    <p>If you have any questions, please contact our support team.</p>
                    <p>Best regards,<br>The Aim Halal Team</p>
                </div>
            `,
            text: `
                Password Reset Request - Aim Halal
                
                Hello ${username || 'User'},
                
                We received a request to reset your password for your Aim Halal account.
                
                Click the link below to reset your password:
                ${resetUrl}
                
                Important:
                - This link will expire in 1 hour for security reasons
                - If you didn't request this password reset, please ignore this email
                - For security, never share this link with anyone
                
                If you have any questions, please contact our support team.
                
                Best regards,
                The Aim Halal Team
            `
        };

        // Send the email
        let result = await mailTransporter.sendMail(emailOptions);
        return { ok: true, info: result };
    } catch (error) {
        console.log('sendPasswordResetEmail error:', error?.message);
        return { ok: false, error: error?.message || 'Unknown email error' };
    }
}


const sendOtpVonage = async (number) => {
    try {

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://api.nexmo.com/verify/json?&api_key=3d4c4028&api_secret=HJuo5Eh5oH0nUHkK&number=${number}&brand=AimHalal`,
            headers: {}
        };
        const response = await axios.request(config);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


const verifyOtpVonage = async (number, code, request_id) => {
    try {

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://api.nexmo.com/verify/check/json?api_key=3d4c4028&api_secret=HJuo5Eh5oH0nUHkK&request_id=${request_id}&code=${code}`,
            headers: {}
        };
        const response = await axios.request(config);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

const activityLog = async (data) => {
    let storeActivity = new activity(data);
    await storeActivity.save();

}

const sendTwilioOtp = async (code, number) => {
    console.log("code", code, number);
    try {
        const accountSid = 'ACcb1f278fb63de0ef55fc17120c5f101b';
        const authToken = '70f6e3d4548592cc6f1a02b20bbc1fc1';
        const client = new Twilio(accountSid, authToken);

        const message = await client.messages.create({
            body: `Your Otp code for Aim Halal :  ${code}`,
            to: number,  // Replace with your recipient's phone number #+966566935647
            from: '+14452569740' // Replace with your Twilio phone number
        });
        return message;


    }
    catch (error) {
        return error;
    }
}

const sendTwilioSMS = async (msg, number) => {
    try {
        const accountSid = 'ACcb1f278fb63de0ef55fc17120c5f101b';
        const authToken = '70f6e3d4548592cc6f1a02b20bbc1fc1';
        const client = new Twilio(accountSid, authToken);

        const message = await client.messages.create({
            body: msg,
            to: number,  // Replace with your recipient's phone number #+966566935647
            from: '+14452569740' // Replace with your Twilio phone number
        });
        console.log(message);
        return message;


    }
    catch (error) {
        console.log(error.message);
        return error;
    }
}

const trimFile = async (file) => {
    return file.replace(/\s+/g, ''); // Replace all whitespace characters with an empty string

    return file;
}


async function storeImageWithValidation(imageBuffer) {
    let resultObject = {
        height: 0,
        width: 0
    }
    try {
        // Validate image format using sizeOf
        if (imageBuffer) {
            const uint8Array = new Uint8Array(imageBuffer); // Convert to Uint8Array (if needed)
            const dimensions = await sizeOf(uint8Array);

            resultObject.height = dimensions.height
            resultObject.width = dimensions.width
        }
        console.log(resultObject)

        return resultObject;


    } catch (error) {
        console.error('Error storing image:', error.message);
        // You can also send an error response to Postman here
    }
}


//   push notification

function notificationHelper(fcmToken, title, body, data, payloadData, daterId) {
    const fcmKey = process.env.FCM_KEY || 'your_fcm_server_key';
    var fcm = new FCM(fcmKey);
    var message = {
        to: fcmToken,
        collapse_key: 'your_collapse_key',

        notification: {
            title: title,
            body: body
        },
        data: data
    };

    notifications.create({
        daterId: daterId,
        title: title,
        body: body,
        data: payloadData,
        readStatus: 0
    });

    fcm.send(message, function (err, response) {
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
}


const convertDataToImage = async (data) => {
    try {
        console.log(req.body);
        const decodedData = Buffer.from(data, 'base64'); // Convert base64 string to binary data
        const filename = `image_${Date.now()}.png`;

        // Get the parent directory of the current directory
        const parentDir = path.dirname(__dirname);

        // Specify the directory path where the image will be saved
        const directoryPath = path.join(parentDir, 'public', 'store');

        // Ensure the directory exists
        await fs.promises.mkdir(directoryPath, { recursive: true });

        // Specify the path where the image will be saved
        const imagePath = path.join(directoryPath, filename);

        // Save the binary data to the specified path
        await fs.promises.writeFile(imagePath, decodedData);

        return `store/${filename}`;
    } catch (error) {
        console.error('Error saving PNG file:', error);
        return error.message;
    }
};

export default {
    sendVendorRequest,
    paginate,
    paginateNew,
    sendOtp,
    sendAcceptanceEmail,
    sendEmailsForCustomer,
    sendOrderEmail,
    sendUpdatedEmail,
    sendPasswordResetEmail,
    generatePassword,
    createNotification,
    vonageSmsIntegration,
    sendNewsletter,
    inquiry,
    sendOtpVonage,
    verifyOtpVonage,
    activityLog,
    sendTwilioOtp,
    sendTwilioSMS,
    updateSettingPassword,
    storeImageWithValidation,
    trimFile,
    notificationHelper,
    convertDataToImage,
    sendTestNotification
}