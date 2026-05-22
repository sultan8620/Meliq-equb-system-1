import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface SMSLogEntry {
  id?: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  status: 'sent' | 'failed' | 'processing';
  type: 'approval' | 'campaign';
  sentAt: any;
  error?: string;
}

/**
 * Utility to send SMS.
 * It writes a log to Firestore under 'sms_logs' so the admin has a central campaign audit trial.
 * In a production setup, this can trigger a Twilio API, Firebase Cloud Function, or local gateway.
 */
export async function sendSMS(
  toPhone: string,
  message: string,
  recipientName: string,
  type: 'approval' | 'campaign'
): Promise<boolean> {
  try {
    if (!toPhone) {
      console.warn("SMS sending bypassed: Phone number is empty.");
      return false;
    }

    console.log(`[SMS Helper] Sending SMS to ${toPhone} (${recipientName}): "${message}"`);

    // Ensure the phone number starts with proper prefix if needed, or keep it as inputted
    const cleanPhone = toPhone.trim();

    // 1. Production API Integration Trigger (Optional: Twilio / HahuSMS / SemaSMS Gateway)
    // If the admin configures an API endpoint, we can fire a post request here.
    const smsApiKey = (import.meta as any).env?.VITE_SMS_API_KEY;
    const smsEndpoint = (import.meta as any).env?.VITE_SMS_ENDPOINT;

    let dispatchStatus: 'sent' | 'failed' = 'sent';
    let errorMessage = '';

    if (smsApiKey && smsEndpoint) {
      try {
        const response = await fetch(smsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${smsApiKey}`
          },
          body: JSON.stringify({
            to: cleanPhone,
            message: message,
            sender: "MelikEqub"
          })
        });

        if (!response.ok) {
          dispatchStatus = 'failed';
          errorMessage = `HTTP error ${response.status}: ${await response.text()}`;
        }
      } catch (err: any) {
        dispatchStatus = 'failed';
        errorMessage = err.message || 'Network dispatch failed';
      }
    }

    // 2. Persist SMS Audit Trail Log in Firestore
    await addDoc(collection(db, 'sms_logs'), {
      recipientPhone: cleanPhone,
      recipientName: recipientName || 'Member',
      message: message,
      status: dispatchStatus,
      type: type,
      sentAt: serverTimestamp(),
      ...(errorMessage ? { error: errorMessage } : {})
    });

    return dispatchStatus === 'sent';
  } catch (err) {
    console.error("Critical error in sendSMS utility:", err);
    return false;
  }
}
