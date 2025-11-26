/**
 * Telegram Notification Service
 * Sends notifications for scheduled transfers
 */

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface NotificationMessage {
  type: 'scheduled' | 'reminder' | 'completed' | 'failed';
  transferId: string;
  amount: string;
  token: string;
  recipient: string;
  scheduledTime: number;
  status?: string;
  txHash?: string;
}

/**
 * Load Telegram configuration from localStorage
 */
export function getTelegramConfig(userAddress: string): TelegramConfig | null {
  if (typeof window === 'undefined') return null;
  
  const saved = localStorage.getItem(`telegram_config_${userAddress}`);
  if (!saved) return null;
  
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

/**
 * Save Telegram configuration to localStorage
 */
export function saveTelegramConfig(userAddress: string, config: TelegramConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`telegram_config_${userAddress}`, JSON.stringify(config));
}

/**
 * Format notification message for Telegram
 */
function formatMessage(notification: NotificationMessage): string {
  const timeStr = new Date(notification.scheduledTime).toLocaleString();
  
  switch (notification.type) {
    case 'scheduled':
      return `🔔 *Transfer Scheduled*\n\n` +
             `Amount: ${notification.amount} ${notification.token}\n` +
             `To: ${notification.recipient}\n` +
             `Scheduled: ${timeStr}\n` +
             `ID: ${notification.transferId}`;
    
    case 'reminder':
      return `⏰ *Transfer Reminder*\n\n` +
             `Your scheduled transfer will execute in 8 hours!\n\n` +
             `Amount: ${notification.amount} ${notification.token}\n` +
             `To: ${notification.recipient}\n` +
             `Scheduled: ${timeStr}\n` +
             `ID: ${notification.transferId}`;
    
    case 'completed':
      return `✅ *Transfer Completed*\n\n` +
             `Amount: ${notification.amount} ${notification.token}\n` +
             `To: ${notification.recipient}\n` +
             `Time: ${timeStr}\n` +
             `Transaction: ${notification.txHash}\n` +
             `View: https://celo-sepolia.blockscout.com/tx/${notification.txHash}`;
    
    case 'failed':
      return `❌ *Transfer Failed*\n\n` +
             `Amount: ${notification.amount} ${notification.token}\n` +
             `To: ${notification.recipient}\n` +
             `Time: ${timeStr}\n` +
             `Status: ${notification.status || 'Unknown error'}`;
    
    default:
      return '';
  }
}

/**
 * Send notification via Telegram Bot API
 */
export async function sendTelegramNotification(
  config: TelegramConfig,
  notification: NotificationMessage
): Promise<boolean> {
  if (!config.enabled || !config.botToken || !config.chatId) {
    console.log('Telegram notifications disabled or not configured');
    return false;
  }

  try {
    const message = formatMessage(notification);
    
    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('Telegram API error:', data);
      return false;
    }

    console.log('✅ Telegram notification sent:', notification.type);
    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

/**
 * Check if a reminder should be sent (8 hours before scheduled time)
 */
export function shouldSendReminder(scheduledTime: number, lastReminderSent?: number): boolean {
  const now = Date.now();
  const eightHoursBefore = scheduledTime - (8 * 60 * 60 * 1000);
  
  // Check if we're within the reminder window (8 hours before to scheduled time)
  if (now < eightHoursBefore || now > scheduledTime) {
    return false;
  }
  
  // Check if reminder was already sent
  if (lastReminderSent && lastReminderSent > eightHoursBefore) {
    return false;
  }
  
  return true;
}

/**
 * Send test notification to verify configuration
 */
export async function sendTestNotification(config: TelegramConfig): Promise<boolean> {
  if (!config.botToken || !config.chatId) {
    throw new Error('Bot token and chat ID are required');
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: '✅ *Telegram Integration Test*\n\nYour Celo scheduled transfer notifications are now active!',
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.description || 'Failed to send test message');
    }

    return true;
  } catch (error) {
    console.error('Test notification failed:', error);
    throw error;
  }
}
