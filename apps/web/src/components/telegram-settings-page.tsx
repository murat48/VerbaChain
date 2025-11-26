'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTelegramConfig, saveTelegramConfig, sendTestNotification, TelegramConfig } from '@/lib/telegram-notifier';

export function TelegramSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const [config, setConfig] = useState<TelegramConfig>({
    botToken: '',
    chatId: '',
    enabled: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected && address) {
      loadConfig();
    }
  }, [mounted, isConnected, address]);

  const loadConfig = () => {
    if (!address) return;
    const saved = getTelegramConfig(address);
    if (saved) {
      setConfig(saved);
    }
  };

  const handleSave = () => {
    if (!address) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      saveTelegramConfig(address, config);
      setMessage({ type: 'success', text: '✅ Telegram settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.botToken || !config.chatId) {
      setMessage({ type: 'error', text: '❌ Please enter bot token and chat ID first' });
      return;
    }

    setIsTesting(true);
    setMessage(null);

    try {
      await sendTestNotification(config);
      setMessage({ type: 'success', text: '✅ Test notification sent! Check your Telegram.' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `❌ Failed to send test notification: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="animate-pulse">Loading...</div>
        </Card>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to configure Telegram notifications</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📱 Telegram Notifications</h1>
        <p className="text-gray-600">Get notified about your scheduled transfers via Telegram</p>
      </div>

      {/* Instructions */}
      <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-bold text-lg">📖 Setup Instructions</h3>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showInstructions ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showInstructions && (
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <div>
                <strong>Create a Telegram Bot:</strong>
                <ul className="list-disc ml-5 mt-1">
                  <li>Open Telegram and search for <code className="bg-blue-100 px-1 rounded">@BotFather</code></li>
                  <li>Send <code className="bg-blue-100 px-1 rounded">/newbot</code> command</li>
                  <li>Follow instructions to create your bot</li>
                  <li>Copy the <strong>Bot Token</strong> (format: 123456:ABC-DEF...)</li>
                </ul>
              </div>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <div>
                <strong>Get Your Chat ID:</strong>
                <ul className="list-disc ml-5 mt-1">
                  <li>Search for your newly created bot in Telegram</li>
                  <li>Send <code className="bg-blue-100 px-1 rounded">/start</code> to your bot</li>
                  <li>Visit: <code className="bg-blue-100 px-1 rounded text-xs">https://api.telegram.org/bot&lt;YOUR_BOT_TOKEN&gt;/getUpdates</code></li>
                  <li>Find your <strong>chat ID</strong> in the JSON response (e.g., 123456789)</li>
                </ul>
              </div>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <div>
                <strong>Configure Below:</strong>
                <ul className="list-disc ml-5 mt-1">
                  <li>Paste your Bot Token and Chat ID</li>
                  <li>Enable notifications</li>
                  <li>Test the connection</li>
                </ul>
              </div>
            </li>
          </ol>
        )}
      </Card>

      {/* Configuration Form */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Bot Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Bot Token <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              value={config.botToken}
              onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              Get this from @BotFather on Telegram
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Chat ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="123456789"
              value={config.chatId}
              onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-xs text-gray-600 mt-1">
              Your personal Telegram chat ID
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="telegram-enabled"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-5 h-5"
            />
            <label htmlFor="telegram-enabled" className="font-medium cursor-pointer">
              Enable Telegram Notifications
            </label>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? '⏳ Saving...' : '💾 Save Settings'}
            </Button>
            <Button
              onClick={handleTest}
              disabled={isTesting || !config.botToken || !config.chatId}
              variant="outline"
              className="flex-1"
            >
              {isTesting ? '⏳ Testing...' : '🧪 Test Notification'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Features Info */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="font-bold mb-3">🔔 What You'll Receive:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span>📝</span>
            <span><strong>Transfer Scheduled:</strong> Instant notification when you schedule a transfer</span>
          </li>
          <li className="flex items-start gap-2">
            <span>⏰</span>
            <span><strong>8-Hour Reminder:</strong> Alert 8 hours before scheduled execution</span>
          </li>
          <li className="flex items-start gap-2">
            <span>✅</span>
            <span><strong>Completion Notification:</strong> Confirmation with transaction hash when transfer completes</span>
          </li>
          <li className="flex items-start gap-2">
            <span>❌</span>
            <span><strong>Failure Alert:</strong> Immediate notification if transfer fails</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
