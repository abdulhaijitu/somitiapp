/**
 * SMS Provider Abstraction Layer
 * Supports multiple Bangladesh SMS gateways with a unified interface
 */

export interface SmsMessage {
  to: string;
  message: string;
  tenantId?: string;
  memberId?: string;
  notificationType?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  cost?: number;
}

export interface SmsProvider {
  name: string;
  send(message: SmsMessage): Promise<SmsResult>;
}

/**
 * Generic HTTP SMS Provider - works with most BD SMS APIs
 */
export class GenericSmsProvider implements SmsProvider {
  name: string;
  private apiUrl: string;
  private apiKey: string;
  private senderId: string;

  constructor(config: {
    name: string;
    apiUrl: string;
    apiKey: string;
    senderId: string;
  }) {
    this.name = config.name;
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.senderId = config.senderId;
  }

  async send(message: SmsMessage): Promise<SmsResult> {
    try {
      // Format phone number for Bangladesh
      const phone = this.formatPhoneNumber(message.to);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          to: phone,
          message: message.message,
          sender_id: this.senderId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.message_id || data.id,
          provider: this.name,
          cost: data.cost
        };
      }

      return {
        success: false,
        provider: this.name,
        error: data.message || data.error || 'SMS sending failed'
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Bangladesh numbers
    if (cleaned.startsWith('880')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+880' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      return '+880' + cleaned;
    }
    
    return '+' + cleaned;
  }
}

/**
 * Console SMS Provider - for development/testing
 */
export class ConsoleSmsProvider implements SmsProvider {
  name = 'console';

  async send(message: SmsMessage): Promise<SmsResult> {
    console.log('=== SMS (Console Provider) ===');
    console.log(`To: ${message.to}`);
    console.log(`Message: ${message.message}`);
    console.log('==============================');
    
    return {
      success: true,
      messageId: `console-${Date.now()}`,
      provider: this.name
    };
  }
}

/**
 * SMS Service Factory
 */
export function createSmsProvider(): SmsProvider {
  const provider = Deno.env.get('SMS_PROVIDER') || 'console';
  
  switch (provider) {
    case 'generic':
      const apiUrl = Deno.env.get('SMS_API_URL');
      const apiKey = Deno.env.get('SMS_API_KEY');
      const senderId = Deno.env.get('SMS_SENDER_ID') || 'SOMITI';
      
      if (!apiUrl || !apiKey) {
        console.warn('SMS API URL or Key not configured, falling back to console provider');
        return new ConsoleSmsProvider();
      }
      
      return new GenericSmsProvider({
        name: 'generic',
        apiUrl,
        apiKey,
        senderId
      });
      
    case 'console':
    default:
      return new ConsoleSmsProvider();
  }
}

/**
 * Message templates (Bangla first)
 */
export const messageTemplates = {
  paymentSuccess: (amount: number, somitiName: string, date: string) => ({
    bn: `${somitiName}: আপনার ৳${amount} টাকা পেমেন্ট সফল হয়েছে। তারিখ: ${date}। ধন্যবাদ।`,
    en: `${somitiName}: Your payment of ৳${amount} was successful. Date: ${date}. Thank you.`
  }),
  
  paymentFailed: (amount: number, somitiName: string) => ({
    bn: `${somitiName}: দুঃখিত, আপনার ৳${amount} টাকা পেমেন্ট ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।`,
    en: `${somitiName}: Sorry, your payment of ৳${amount} failed. Please try again.`
  }),
  
  paymentConfirmation: (amount: number, somitiName: string, date: string) => ({
    bn: `${somitiName}: আপনার ৳${amount} টাকা পেমেন্ট রেকর্ড করা হয়েছে। তারিখ: ${date}।`,
    en: `${somitiName}: Your payment of ৳${amount} has been recorded. Date: ${date}.`
  }),
  
  duesReminder: (amount: number, somitiName: string, month: string) => ({
    bn: `${somitiName}: আপনার ${month} মাসের ৳${amount} টাকা বকেয়া আছে। অনুগ্রহ করে পরিশোধ করুন।`,
    en: `${somitiName}: You have ৳${amount} due for ${month}. Please pay at your earliest convenience.`
  }),
  
  overdueReminder: (amount: number, somitiName: string, daysOverdue: number) => ({
    bn: `${somitiName}: আপনার ৳${amount} টাকা ${daysOverdue} দিন যাবৎ বকেয়া। অনুগ্রহ করে শীঘ্রই পরিশোধ করুন।`,
    en: `${somitiName}: Your ৳${amount} payment is ${daysOverdue} days overdue. Please pay soon.`
  }),
  
  otp: (code: string, somitiName: string) => ({
    bn: `${somitiName}: আপনার OTP কোড হলো ${code}। এই কোড ৫ মিনিট বৈধ।`,
    en: `${somitiName}: Your OTP code is ${code}. Valid for 5 minutes.`
  }),
  
  adminAlert: (alertType: string, details: string, somitiName: string) => ({
    bn: `${somitiName} অ্যালার্ট: ${alertType} - ${details}`,
    en: `${somitiName} Alert: ${alertType} - ${details}`
  })
};
