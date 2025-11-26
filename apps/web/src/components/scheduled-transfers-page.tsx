'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTelegramConfig, sendTelegramNotification, shouldSendReminder } from '@/lib/telegram-notifier';

interface Contact {
  id: string;
  name: string;
  address: string;
}

interface ScheduledTransfer {
  id: string;
  recipientName: string;
  recipientAddress: string;
  amount: string; // Plain number as string (e.g., "1.5", not wei)
  token?: string; // Token type (CELO, cUSD, etc.)
  scheduledTime: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  txHash?: string;
  errorMessage?: string;
  createdAt: number;
  lastReminderSent?: number; // Timestamp of last reminder sent
  autoApproved?: boolean; // User pre-approved auto-execution
}

export function ScheduledTransfersPage() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { sendTransaction, data: txHash, error: txError } = useSendTransaction();
  const { isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  
  const [transfers, setTransfers] = useState<ScheduledTransfer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    date: '',
    time: '',
    autoApprove: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected && address) {
      loadTransfers();
      loadContacts();
    }
  }, [mounted, isConnected, address]);

  // Handle transaction success
  useEffect(() => {
    if (isTxSuccess && txHash && executingId) {
      const transfer = transfers.find(t => t.id === executingId);
      const updated = transfers.map(t =>
        t.id === executingId
          ? { ...t, status: 'completed' as const, txHash: txHash }
          : t
      );
      saveTransfers(updated);
      setExecutingId(null);
      console.log(`✅ Scheduled transfer ${executingId} completed: ${txHash}`);
      
      // Send Telegram notification
      if (transfer && address) {
        const telegramConfig = getTelegramConfig(address);
        if (telegramConfig?.enabled) {
          sendTelegramNotification(telegramConfig, {
            type: 'completed',
            transferId: transfer.id,
            amount: transfer.amount,
            token: transfer.token || 'CELO',
            recipient: transfer.recipientName || transfer.recipientAddress,
            scheduledTime: transfer.scheduledTime,
            txHash: txHash,
          });
        }
      }
    }
  }, [isTxSuccess, txHash, executingId]);

  // Handle transaction error
  useEffect(() => {
    if (txError && executingId) {
      const transfer = transfers.find(t => t.id === executingId);
      const updated = transfers.map(t =>
        t.id === executingId
          ? { ...t, status: 'failed' as const, errorMessage: txError.message }
          : t
      );
      saveTransfers(updated);
      setExecutingId(null);
      console.error(`❌ Scheduled transfer ${executingId} failed:`, txError.message);
      
      // Send Telegram notification
      if (transfer && address) {
        const telegramConfig = getTelegramConfig(address);
        if (telegramConfig?.enabled) {
          sendTelegramNotification(telegramConfig, {
            type: 'failed',
            transferId: transfer.id,
            amount: transfer.amount,
            token: transfer.token || 'CELO',
            recipient: transfer.recipientName || transfer.recipientAddress,
            scheduledTime: transfer.scheduledTime,
            status: txError.message,
          });
        }
      }
    }
  }, [txError, executingId]);

  const loadTransfers = () => {
    if (!address) return;
    const saved = localStorage.getItem(`scheduled_transfers_${address}`);
    if (saved) {
      setTransfers(JSON.parse(saved));
    }
  };

  const loadContacts = () => {
    if (!address) return;
    const saved = localStorage.getItem(`contacts_${address}`);
    if (saved) {
      setContacts(JSON.parse(saved));
    }
  };

  const saveTransfers = (newTransfers: ScheduledTransfer[]) => {
    if (!address) return;
    localStorage.setItem(`scheduled_transfers_${address}`, JSON.stringify(newTransfers));
    setTransfers(newTransfers);
  };

  const checkAndExecutePendingTransfers = useCallback(() => {
    if (!address || executingId) return; // Don't execute if already executing one

    const now = Date.now();
    const pendingTransfers = transfers.filter(
      t => t.status === 'pending' && t.scheduledTime <= now && t.autoApproved
    );

    if (pendingTransfers.length > 0) {
      const transfer = pendingTransfers[0]; // Execute first pending
      const tokenType = transfer.token || 'CELO';
      console.log(`⏰ Executing auto-approved scheduled transfer: ${transfer.amount} ${tokenType} to ${transfer.recipientAddress}`);
      
      setExecutingId(transfer.id);
      
      try {
        // For now, only CELO transfers are supported (native token)
        // TODO: Add ERC20 token support for cUSD, cEUR, cREAL
        if (tokenType === 'CELO' || !transfer.token) {
          sendTransaction({
            to: transfer.recipientAddress as `0x${string}`,
            value: parseEther(transfer.amount), // Parse from plain string to wei
          });
        } else {
          throw new Error(`Token ${tokenType} not supported yet for scheduled transfers`);
        }
      } catch (err) {
        console.error('Failed to execute scheduled transfer:', err);
        const updated = transfers.map(t =>
          t.id === transfer.id
            ? { ...t, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'Unknown error' }
            : t
        );
        saveTransfers(updated);
        setExecutingId(null);
      }
    }
  }, [address, transfers, executingId, sendTransaction]);

  const checkAndSendReminders = useCallback(() => {
    if (!address) return;

    const telegramConfig = getTelegramConfig(address);
    if (!telegramConfig?.enabled) return;

    const now = Date.now();
    const pendingTransfers = transfers.filter(t => t.status === 'pending');

    pendingTransfers.forEach(transfer => {
      if (shouldSendReminder(transfer.scheduledTime, transfer.lastReminderSent)) {
        console.log(`⏰ Sending 8-hour reminder for transfer ${transfer.id}`);
        
        sendTelegramNotification(telegramConfig, {
          type: 'reminder',
          transferId: transfer.id,
          amount: transfer.amount,
          token: transfer.token || 'CELO',
          recipient: transfer.recipientName || transfer.recipientAddress,
          scheduledTime: transfer.scheduledTime,
        }).then(success => {
          if (success) {
            // Update lastReminderSent timestamp
            const updated = transfers.map(t =>
              t.id === transfer.id ? { ...t, lastReminderSent: now } : t
            );
            saveTransfers(updated);
          }
        });
      }
    });
  }, [address, transfers]);

  // Auto-execute pending transfers and send reminders
  useEffect(() => {
    if (!mounted || !isConnected || !address) return;
    
    // Check immediately
    checkAndExecutePendingTransfers();
    checkAndSendReminders();
    
    // Check for transfers to execute every 30 seconds
    const checkInterval = setInterval(() => {
      checkAndExecutePendingTransfers();
      checkAndSendReminders();
    }, 30000);

    return () => clearInterval(checkInterval);
  }, [mounted, isConnected, address, transfers, executingId, checkAndExecutePendingTransfers, checkAndSendReminders]);

  const handleScheduleTransfer = () => {
    setError('');

    if (!formData.recipient) {
      setError('Please select a recipient');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!formData.date || !formData.time) {
      setError('Please select date and time');
      return;
    }

    const scheduledTime = new Date(`${formData.date}T${formData.time}`).getTime();
    const now = Date.now();

    if (scheduledTime <= now) {
      setError('Scheduled time must be in the future');
      return;
    }

    const contact = contacts.find(c => c.address === formData.recipient);

    // Show confirmation dialog with important warning
    const scheduledDate = new Date(scheduledTime).toLocaleString('tr-TR');
    const confirmMessage = formData.autoApprove 
      ? `⚠️ ÖNEMLİ UYARI ⚠️

📅 Planlanan Transfer:
• Alıcı: ${contact?.name || formData.recipient}
• Tutar: ${formData.amount} CELO
• Tarih: ${scheduledDate}

🔐 OTOMATİK İMZALAMA:
Bu transfer zamanı geldiğinde MetaMask onayı OLMADAN otomatik olarak gerçekleştirilecektir.

⚠️ Bu işlemi onaylıyor musunuz?`
      : `📅 Planlanan Transfer:
• Alıcı: ${contact?.name || formData.recipient}
• Tutar: ${formData.amount} CELO
• Tarih: ${scheduledDate}

⏰ MANUEL ONAY GEREKLİ:
Zamanı geldiğinde MetaMask'ta onaylamanız gerekecektir.
Browser'ınız açık olmalı ve MetaMask'ı onaylamalısınız.

Anladınız mı?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    const newTransfer: ScheduledTransfer = {
      id: `${Date.now()}-${Math.random()}`,
      recipientName: contact?.name || 'Unknown',
      recipientAddress: formData.recipient,
      amount: formData.amount, // Store as plain string (e.g., "1.5")
      scheduledTime,
      status: 'pending',
      createdAt: Date.now(),
      autoApproved: formData.autoApprove,
    };

    saveTransfers([...transfers, newTransfer]);
    setFormData({ recipient: '', amount: '', date: '', time: '', autoApprove: false });
    setShowScheduleForm(false);

    // Send Telegram notification
    if (address) {
      const telegramConfig = getTelegramConfig(address);
      if (telegramConfig?.enabled) {
        sendTelegramNotification(telegramConfig, {
          type: 'scheduled',
          transferId: newTransfer.id,
          amount: newTransfer.amount,
          token: 'CELO',
          recipient: newTransfer.recipientName || newTransfer.recipientAddress,
          scheduledTime: newTransfer.scheduledTime,
        });
      }
    }
  };

  const handleCancelTransfer = (id: string) => {
    if (confirm('Are you sure you want to cancel this transfer?')) {
      const updated = transfers.map(t => 
        t.id === id ? { ...t, status: 'cancelled' as const } : t
      );
      saveTransfers(updated);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'completed': return 'bg-green-50 border-green-200 text-green-700';
      case 'failed': return 'bg-red-50 border-red-200 text-red-700';
      case 'cancelled': return 'bg-gray-50 border-gray-200 text-gray-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      default: return '📋';
    }
  };

  const getTimeUntil = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    
    if (diff < 0) return 'Overdue';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h`;
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `in ${minutes}m`;
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
          <p className="text-gray-600">Please connect your wallet to schedule transfers</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">⏰ Scheduled Transfers</h1>
        <Button onClick={() => setShowScheduleForm(!showScheduleForm)}>
          {showScheduleForm ? '❌ Cancel' : '➕ Schedule Transfer'}
        </Button>
      </div>

      {/* Schedule Form */}
      {showScheduleForm && (
        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-bold mb-4">Schedule New Transfer</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Recipient</label>
              <select
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a contact...</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.address}>
                    {contact.name} ({contact.address.slice(0, 6)}...{contact.address.slice(-4)})
                  </option>
                ))}
              </select>
              {contacts.length === 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  <a href="/contacts" className="text-blue-600 hover:underline">Add contacts</a> first to schedule transfers
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount (CELO)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

      

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <Button onClick={handleScheduleTransfer} className="w-full">
              ⏰ Schedule Transfer
            </Button>
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-6 mb-6 bg-green-50 border-green-200">
        <h3 className="font-bold mb-2">💡 About Scheduled Transfers</h3>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>• Schedule payments for a specific date and time</li>
          <li>• Use NLTE: "Send 10 CELO to Alice tomorrow at 3pm"</li>
    <li>• 🔄 Checks every 30 seconds for pending transfers</li>
        </ul>
      </Card>

      {/* Transfers List */}
      <div className="space-y-3">
        {transfers.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">⏰</div>
            <div className="text-xl mb-2">No scheduled transfers</div>
            <div className="text-gray-600">Schedule your first transfer to automate payments!</div>
          </Card>
        ) : (
          transfers
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((transfer) => (
              <Card key={transfer.id} className={`p-4 ${getStatusColor(transfer.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl">{getStatusIcon(transfer.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold">
                            {transfer.amount} {transfer.token || 'CELO'}
                          </h3>
                          {transfer.autoApproved && transfer.status === 'pending' && (
                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                              🔐 Auto
                            </span>
                          )}
                        </div>
                        <p className="text-sm">
                          to {transfer.recipientName || transfer.recipientAddress.slice(0, 10) + '...'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span>📅 {new Date(transfer.scheduledTime).toLocaleString()}</span>
                        {transfer.status === 'pending' && (
                          <span className="font-medium">({getTimeUntil(transfer.scheduledTime)})</span>
                        )}
                      </div>
                      {!transfer.autoApproved && transfer.status === 'pending' && (
                        <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          ⚠️ Manual approval required - MetaMask will prompt when time comes
                        </div>
                      )}
                      {transfer.txHash && (
                        <div className="text-xs">
                          Tx: <a 
                            href={`https://celo-sepolia.blockscout.com/tx/${transfer.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {transfer.txHash.slice(0, 10)}...{transfer.txHash.slice(-8)}
                          </a>
                        </div>
                      )}
                      {transfer.errorMessage && (
                        <div className="text-red-600 text-xs">
                          Error: {transfer.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  {transfer.status === 'pending' && (
                    <Button
                      onClick={() => handleCancelTransfer(transfer.id)}
                      size="sm"
                      variant="destructive"
                    >
                      ❌ Cancel
                    </Button>
                  )}
                </div>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
