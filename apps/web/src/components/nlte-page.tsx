/**
 * NLTE Main Page Component
 * Orchestrates natural language command parsing and transaction drafting
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, encodeFunctionData } from 'viem';
import { useSearchParams } from 'next/navigation';
import { NLTEInput } from '@/components/nlte-input';
import { TransactionDraftDisplay } from '@/components/nlte-draft-display';
import { ParseCommandResponse, TransactionDraft, DraftTransactionResponse, TransactionIntent, CeloToken } from '@/types/nlte.types';
import { buildSwapTransaction, buildApprovalTransaction, isSwapSupported } from '@/utils/swap-helpers';
import { buildStakeTransaction, buildClaimRewardsTransaction, isStakingSupported } from '@/utils/staking-helpers';
import { addTokenToMetaMask } from '@/utils/metamask-helpers';
import { getTelegramConfig, sendTelegramNotification } from '@/lib/telegram-notifier';
import { getTokenAddresses, ERC20_ABI } from '@/utils/celo-config';
import { parseTokenAmount } from '@/utils/transaction-helpers';

interface NLTEPageState {
  step: 'input' | 'draft' | 'submitting' | 'approving' | 'swapping' | 'success' | 'error';
  parseResponse?: ParseCommandResponse;
  draftTransaction?: TransactionDraft;
  error?: string;
  txHash?: string;
  approvalTxHash?: string;
}

/**
 * Main NLTE interface
 */
export function NLTEPage() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const { sendTransaction, data: txHash, error: txError, reset: resetTx } = useSendTransaction();
  const { 
    isLoading: isTxPending, 
    isSuccess: isTxSuccess,
    data: txReceipt 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const [state, setState] = useState<NLTEPageState>({ step: 'input' });
  const [isLoading, setIsLoading] = useState(false);
  const [swapStep, setSwapStep] = useState<'idle' | 'approval' | 'swap'>('idle');
  const [initialCommand, setInitialCommand] = useState<string>('');

  // Handle URL query parameters
  useEffect(() => {
    if (searchParams) {
      const recipient = searchParams.get('recipient');
      if (recipient) {
        // Auto-fill command with recipient name
        setInitialCommand(`send 10 cUSD to ${recipient}`);
      }
    }
  }, [searchParams]);

  const handleCommandParsed = async (response: ParseCommandResponse) => {
    if (!response.success || !response.data || !isConnected || !address) {
      setState({ step: 'input', error: 'Failed to parse command or wallet not connected' });
      return;
    }

    try {
      setIsLoading(true);
      setState({ step: 'input', parseResponse: response });

      // Check if this is a scheduled transfer
      const params = response.data.parameters as any;
      if (params.scheduledTime && params.isScheduled) {
        const scheduledTime = params.scheduledTime as number;
        
        // Ask user for auto-approval
        const autoApprove = confirm(
          `Schedule this transfer?\n\n` +
          `Amount: ${params.amount} ${params.token}\n` +
          `To: ${params.recipient}\n` +
          `Time: ${new Date(scheduledTime).toLocaleString()}\n\n` +
          `✅ Click OK to AUTO-EXECUTE at scheduled time (no MetaMask approval needed)\n` +
          `❌ Click Cancel to require manual approval later`
        );
        
        // Save to scheduled transfers
        const scheduledTransfer = {
          id: Date.now().toString(),
          recipientAddress: params.recipient as string,
          recipientName: '', // Could be populated from contacts
          amount: params.amount as string,
          token: params.token as string,
          scheduledTime,
          status: 'pending' as const,
          createdAt: Date.now(),
          autoApproved: autoApprove,
        };

        const saved = localStorage.getItem(`scheduled_transfers_${address}`);
        const transfers = saved ? JSON.parse(saved) : [];
        transfers.push(scheduledTransfer);
        localStorage.setItem(`scheduled_transfers_${address}`, JSON.stringify(transfers));

        // Send Telegram notification
        const telegramConfig = getTelegramConfig(address);
        if (telegramConfig?.enabled) {
          sendTelegramNotification(telegramConfig, {
            type: 'scheduled',
            transferId: scheduledTransfer.id,
            amount: scheduledTransfer.amount,
            token: scheduledTransfer.token,
            recipient: scheduledTransfer.recipientAddress,
            scheduledTime: scheduledTransfer.scheduledTime,
          });
        }

        setState({
          step: 'input',
          error: undefined,
        });
        
        // Show success message and redirect
        const approvalStatus = autoApprove ? '🔐 Auto-execution enabled' : '⚠️ Manual approval required';
        alert(`✅ Transfer scheduled for ${new Date(scheduledTime).toLocaleString()}!\n${approvalStatus}\n\nGo to Scheduled Transfers page to view and manage it.`);
        setIsLoading(false);
        return;
      }

      // Draft immediate transaction
      const draftRes = await fetch('/api/nlte/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedCommand: response.data,
          userAddress: address,
        }),
      });

      const draftData: DraftTransactionResponse = await draftRes.json();

      if (draftData.success && draftData.data) {
        setState({
          step: 'draft',
          parseResponse: response,
          draftTransaction: draftData.data,
        });
      } else {
        setState({
          step: 'input',
          error: draftData.error || 'Failed to draft transaction',
          parseResponse: response,
        });
      }
    } catch (error) {
      setState({
        step: 'input',
        error: error instanceof Error ? error.message : 'Unknown error',
        parseResponse: response,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!state.draftTransaction || !isConnected || !address) {
      setState((prev) => ({ ...prev, error: 'Transaction not ready' }));
      return;
    }

    try {
      setIsLoading(true);
      setState((prev) => ({ ...prev, step: 'submitting' }));
      
      const draft = state.draftTransaction;
      
      // Handle different transaction types
      if (draft.intent === TransactionIntent.SEND) {
        // SEND transaction - handle native CELO vs ERC20 tokens (cUSD, cEUR, cREAL)
        if (draft.token === CeloToken.CELO) {
          // Native CELO transfer
          console.log('💰 Sending native CELO:', draft.amount);
          sendTransaction({
            to: draft.to as `0x${string}`,
            value: parseEther(draft.amount.toString()),
          });
        } else {
          // ERC20 token transfer (cUSD, cEUR, cREAL)
          console.log('💵 Sending ERC20 token:', draft.token, draft.amount);
          const tokenAddresses = getTokenAddresses();
          const tokenAddress = tokenAddresses[draft.token] as `0x${string}`;
          const amount = parseTokenAmount(draft.amount.toString(), 18);
          
          const data = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [draft.to as `0x${string}`, amount],
          });
          
          sendTransaction({
            to: tokenAddress,
            data,
            value: 0n,
          });
        }
      } else if (draft.intent === TransactionIntent.SWAP) {
        // SWAP transaction via Mento Protocol (2-step process)
        const fromToken = draft.metadata?.fromToken;
        const toToken = draft.token;
        
        if (!fromToken || !isSwapSupported(fromToken, toToken)) {
          throw new Error(
            `Swap from ${fromToken} to ${toToken} is not supported yet. ` +
            `Currently only CELO -> cUSD swaps are available via Mento.`
          );
        }
        
        console.log('🔄 Starting Mento Swap (2-step process)...');
        console.log('From:', fromToken, 'Amount:', draft.amount);
        console.log('To:', toToken);
        console.log('User Address:', address);
        
        // Step 1: Approve CELO token
        setState((prev) => ({ ...prev, step: 'approving' }));
        setSwapStep('approval');
        const approvalTx = buildApprovalTransaction(draft.amount, address);
        
        console.log('📝 Step 1: Approval Transaction');
        console.log({
          to: approvalTx.to,
          value: approvalTx.value.toString(),
          dataPreview: approvalTx.data.substring(0, 66) + '...',
        });
        
        // Send approval first
        sendTransaction({
          to: approvalTx.to,
          value: approvalTx.value,
          data: approvalTx.data,
        });
      } else if (draft.intent === TransactionIntent.STAKE) {
        // STAKE: Stake CELO tokens
        if (!isStakingSupported()) {
          throw new Error('Staking is not available on this network yet.');
        }
        
        console.log('🔒 Staking CELO...');
        console.log('Amount:', draft.amount, 'CELO');
        console.log('Duration:', draft.metadata.stakeDuration || 0, 'days');
        
        const stakeTx = buildStakeTransaction(
          draft.amount,
          draft.metadata.stakeDuration || 0,
          address
        );
        
        setState((prev) => ({ ...prev, step: 'submitting' }));
        
        sendTransaction({
          to: stakeTx.to,
          value: stakeTx.value,
          data: stakeTx.data,
        });
      } else if (draft.intent === TransactionIntent.CLAIM_REWARDS) {
        // CLAIM_REWARDS: Claim rewards from staking/rewards contracts
        if (!isStakingSupported()) {
          throw new Error('Rewards claiming is not available on this network yet.');
        }
        
        console.log('🎁 Claiming rewards...');
        
        const claimTx = buildClaimRewardsTransaction(address);
        
        setState((prev) => ({ ...prev, step: 'submitting' }));
        
        sendTransaction({
          to: claimTx.to,
          data: claimTx.data,
          value: claimTx.value,
        });
      } else {
        throw new Error(`Transaction type ${draft.intent} is not yet supported`);
      }
      
    } catch (error) {
      console.error('Transaction error:', error);
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'Failed to submit transaction',
      }));
      setIsLoading(false);
    }
  };

  // Watch for transaction completion
  useEffect(() => {
    if (txHash && !isTxPending) {
      setIsLoading(false);
      if (isTxSuccess && txReceipt) {
        console.log('✅ Transaction Receipt:', txReceipt);
        console.log('Transaction Status:', txReceipt.status);
        console.log('Gas Used:', txReceipt.gasUsed.toString());
        console.log('Swap Step:', swapStep);
        
        // Check if transaction actually succeeded (status === 'success')
        if (txReceipt.status === 'success') {
          // Check if this was approval or swap
          if (swapStep === 'approval') {
            // Approval succeeded, now do the swap
            console.log('✅ Approval successful! Now executing swap...');
            setState((prev) => ({ 
              ...prev, 
              step: 'swapping',
              approvalTxHash: txHash,
            }));
            setSwapStep('swap');
            
            // Build and send swap transaction
            const draft = state.draftTransaction;
            if (draft && address) {
              const swapTx = buildSwapTransaction(
                draft.metadata?.fromToken as CeloToken,
                draft.token,
                draft.amount,
                address,
                10.0 // 10% slippage for testnet
              );
              
              console.log('📦 Step 2: Swap Transaction');
              console.log({
                to: swapTx.to,
                value: swapTx.value.toString(),
                dataPreview: swapTx.data.substring(0, 66) + '...',
              });
              
              // Reset transaction state before sending new one
              resetTx();
              
              // Send swap transaction after small delay
              setTimeout(() => {
                sendTransaction({
                  to: swapTx.to,
                  value: swapTx.value,
                  data: swapTx.data,
                });
              }, 1500);
            }
          } else if (swapStep === 'swap') {
            // Swap succeeded
            console.log('✅ Swap successful!');
            setState((prev) => ({
              ...prev,
              step: 'success',
              txHash: txHash,
            }));
            setSwapStep('idle');
          } else {
            // Simple send transaction
            setState((prev) => ({
              ...prev,
              step: 'success',
              txHash: txHash,
            }));
            setSwapStep('idle');
          }
        } else {
          setState((prev) => ({
            ...prev,
            step: 'error',
            error: 'Transaction was mined but reverted. The swap may have failed due to slippage or insufficient liquidity.',
          }));
          setSwapStep('idle');
        }
      }
    }
  }, [txHash, isTxPending, isTxSuccess, txReceipt, swapStep]);

  // Watch for transaction errors
  useEffect(() => {
    if (txError) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: txError.message,
      }));
      setIsLoading(false);
    }
  }, [txError]);

  const handleReject = () => {
    setState({ step: 'input' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Natural Language Transaction Engine
          </h1>
          <p className="text-lg text-gray-600">
            Describe transactions in plain English, we'll handle the rest
          </p>
        </div>

        {/* Connection Status */}
        {!isConnected ? (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
            <p className="text-yellow-800">Please connect your wallet to get started</p>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
            <p className="text-green-800">
              Connected: <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </p>
          </div>
        )}

        {/* Error Messages */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800">{state.error}</p>
          </div>
        )}

        {/* Main Content */}
        {state.step === 'input' && (
          <NLTEInput 
            onCommandParsed={handleCommandParsed} 
            isLoading={isLoading}
            userAddress={address}
            initialCommand={initialCommand}
          />
        )}

        {state.step === 'draft' && state.draftTransaction && (
          <TransactionDraftDisplay
            draft={state.draftTransaction}
            onApprove={handleApprove}
            onReject={handleReject}
            isProcessing={isLoading}
          />
        )}

        {state.step === 'submitting' && (
          <div className="p-6 text-center bg-white rounded-lg shadow-lg">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold mb-2">Sending Transaction...</h2>
            <p className="text-gray-600">Please confirm in MetaMask</p>
            {isTxPending && txHash && (
              <p className="text-sm text-gray-500 mt-4">
                Waiting for confirmation...
              </p>
            )}
          </div>
        )}

        {state.step === 'approving' && (
          <div className="p-6 text-center bg-white rounded-lg shadow-lg">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold mb-2">Step 1: Approving CELO</h2>
            <p className="text-gray-600 mb-4">Please approve Mento Broker to spend your CELO tokens</p>
            {isTxPending && txHash && (
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-semibold">✅ Approval confirmed in MetaMask</p>
                <p className="text-sm text-gray-500">Waiting for blockchain confirmation...</p>
                <a
                  href={`https://celo-sepolia.blockscout.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-xs block"
                >
                  View approval transaction →
                </a>
              </div>
            )}
          </div>
        )}

        {state.step === 'swapping' && (
          <div className="p-6 text-center bg-white rounded-lg shadow-lg">
            <div className="animate-spin text-6xl mb-4">🔄</div>
            <h2 className="text-2xl font-bold mb-2">Step 2: Executing Swap</h2>
            <p className="text-gray-600 mb-4">Swapping CELO for cUSD via Mento Protocol</p>
            {state.approvalTxHash && (
              <p className="text-sm text-green-600 mb-2">✅ Approval completed</p>
            )}
            {isTxPending && txHash && (
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-semibold">✅ Swap confirmed in MetaMask</p>
                <p className="text-sm text-gray-500">Waiting for blockchain confirmation...</p>
                <a
                  href={`https://celo-sepolia.blockscout.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-xs block"
                >
                  View swap transaction →
                </a>
              </div>
            )}
          </div>
        )}

        {state.step === 'success' && (
          <div className="p-6 text-center bg-white rounded-lg shadow-lg">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">
              {state.draftTransaction?.intent === TransactionIntent.SWAP ? 'Swap Successful!' : 'Transaction Successful!'}
            </h2>
            <p className="text-gray-600 mb-4">
              {state.draftTransaction?.intent === TransactionIntent.SWAP
                ? 'Your CELO has been swapped for cUSD via Mento Protocol'
                : 'Your transaction has been confirmed on Celo Sepolia'}
            </p>
            
            {/* SWAP specific instructions */}
            {state.draftTransaction?.intent === TransactionIntent.SWAP && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-3">
                  💡 Add cUSD to MetaMask to see your balance
                </p>
                <button
                  onClick={async () => {
                    try {
                      await addTokenToMetaMask(CeloToken.cUSD);
                    } catch (error) {
                      console.error('Token import failed:', error);
                      alert('Token import başarısız. Lütfen manuel olarak ekleyin.');
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition mb-3"
                >
                  🦊 Import cUSD to MetaMask
                </button>
                {state.approvalTxHash && (
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-xs text-blue-700 mb-2">Transaction Details:</p>
                    <a
                      href={`https://celo-sepolia.blockscout.com/tx/${state.approvalTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-xs block mb-1"
                    >
                      View Step 1: Approval →
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {state.txHash && (
              <a
                href={`https://celo-sepolia.blockscout.com/tx/${state.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-sm block mb-4"
              >
                {state.draftTransaction?.intent === TransactionIntent.SWAP 
                  ? 'View Step 2: Swap Transaction →'
                  : 'View on Sepolia Block Explorer →'}
              </a>
            )}
            <div className="mt-6">
              <button
                onClick={() => setState({ step: 'input' })}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                New Transaction
              </button>
            </div>
          </div>
        )}

        {state.step === 'error' && (
          <div className="p-6 text-center bg-white rounded-lg shadow-lg">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">Transaction Failed</h2>
            <p className="text-gray-600 mb-4">{state.error || 'Unknown error occurred'}</p>
            <button
              onClick={() => setState({ step: 'input' })}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
