import twilio from "twilio";

const hasTwilioCredentials = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
const twilioClient = hasTwilioCredentials ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const smsFrom = process.env.TWILIO_FROM_PHONE;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

const canSendMessages = Boolean(
  twilioClient && (messagingServiceSid || smsFrom || whatsappFrom)
);

export const dispatchOtp = async (phoneNumber, otp) => {
  const body = `Your Chatty verification code is ${otp}. It expires in a few minutes.`;

  if (!canSendMessages) {
    console.log(`[OTP][DEV] ${phoneNumber} -> ${otp}`);
    return { mocked: true };
  }

  const payload = {
    body,
    to: whatsappFrom ? `whatsapp:${phoneNumber}` : phoneNumber,
  };

  if (whatsappFrom) {
    payload.from = whatsappFrom.startsWith("whatsapp:") ? whatsappFrom : `whatsapp:${whatsappFrom}`;
  } else if (messagingServiceSid) {
    payload.messagingServiceSid = messagingServiceSid;
  } else {
    payload.from = smsFrom;
  }

  await twilioClient.messages.create(payload);
  return { mocked: false };
};
