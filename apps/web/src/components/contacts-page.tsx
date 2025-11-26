'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Contact {
  id: string;
  name: string;
  address: string;
  createdAt: number;
}

export function ContactsPage() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected && address) {
      loadContacts();
    }
  }, [mounted, isConnected, address]);

  const loadContacts = () => {
    if (!address) return;
    const saved = localStorage.getItem(`contacts_${address}`);
    if (saved) {
      setContacts(JSON.parse(saved));
    }
  };

  const saveContacts = (newContacts: Contact[]) => {
    if (!address) return;
    localStorage.setItem(`contacts_${address}`, JSON.stringify(newContacts));
    setContacts(newContacts);
  };

  const handleAddContact = () => {
    setError('');
    
    if (!formData.name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!formData.address.trim()) {
      setError('Please enter an address');
      return;
    }

    if (!isAddress(formData.address)) {
      setError('Invalid Ethereum address');
      return;
    }

    // Check if contact already exists
    if (contacts.some(c => c.address.toLowerCase() === formData.address.toLowerCase())) {
      setError('This address is already in your contacts');
      return;
    }

    const newContact: Contact = {
      id: `${Date.now()}-${Math.random()}`,
      name: formData.name,
      address: formData.address,
      createdAt: Date.now(),
    };

    saveContacts([...contacts, newContact]);
    setFormData({ name: '', address: '' });
    setShowAddForm(false);
  };

  const handleDeleteContact = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      saveContacts(contacts.filter(c => c.id !== id));
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
          <p className="text-gray-600">Please connect your wallet to manage contacts</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">👥 My Contacts</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '❌ Cancel' : '➕ Add Contact'}
        </Button>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-bold mb-4">Add New Contact</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                placeholder="e.g., Alice"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CELO Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <Button onClick={handleAddContact} className="w-full">
              ✓ Save Contact
            </Button>
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-6 mb-6 bg-green-50 border-green-200">
        <h3 className="font-bold mb-2">💡 How to use contacts</h3>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>• Add friends and family with easy-to-remember names</li>
          <li>• Use names in NLTE: "Send 10 CELO to Alice"</li>
          <li>• Schedule future payments: "Send 5 CELO to Bob tomorrow at 3pm"</li>
        </ul>
      </Card>

      {/* Contacts List */}
      <div className="space-y-3">
        {contacts.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">👤</div>
            <div className="text-xl mb-2">No contacts yet</div>
            <div className="text-gray-600">Add your first contact to start using names in transactions!</div>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">👤</div>
                    <div>
                      <h3 className="text-lg font-bold">{contact.name}</h3>
                      <p className="text-sm text-gray-600 font-mono">{contact.address}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Added {new Date(contact.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      window.location.href = `/nlte?recipient=${contact.name}`;
                    }}
                    size="sm"
                    variant="outline"
                  >
                    💸 Send
                  </Button>
                  <Button
                    onClick={() => handleDeleteContact(contact.id)}
                    size="sm"
                    variant="destructive"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
