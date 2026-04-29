import { useState, type FormEvent } from 'react';
import { devApi } from '../services/api';

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || fallback;
  }

  return fallback;
}

export default function DevControlsPanel() {
  const [generatedEventId, setGeneratedEventId] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState('1000');
  const [loadingAction, setLoadingAction] = useState<'deposit' | 'generate' | 'settle' | 'run' | null>(null);
  const [message, setMessage] = useState('');
  const loading = loadingAction !== null;

  const handleDeposit = async (event: FormEvent) => {
    event.preventDefault();

    const amount = Number.parseFloat(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Error: Enter a deposit amount greater than 0.');
      return;
    }

    setLoadingAction('deposit');
    setMessage('');

    try {
      const result = await devApi.depositToWallet(amount);
      window.dispatchEvent(new Event('wallet:updated'));
      setMessage(`Deposited $${result.transaction.amount.toFixed(2)}. New balance: $${result.transaction.balanceAfter.toFixed(2)}`);
    } catch (error: unknown) {
      setMessage(`Error: ${getApiErrorMessage(error, 'Failed to deposit funds.')}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateRace = async () => {
    setLoadingAction('generate');
    setMessage('');

    try {
      const result = await devApi.generateRace();
      setGeneratedEventId(result.eventId);
      setMessage(`Generated race #${result.eventId} with ${result.runners.length} horses`);
    } catch (error: unknown) {
      setMessage(`Error: ${getApiErrorMessage(error, 'Failed to generate race.')}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSettleRace = async () => {
    if (!generatedEventId) return;

    setLoadingAction('settle');
    setMessage('');

    try {
      const result = await devApi.settleRace(generatedEventId);
      setMessage(`Race settled. Winner: Horse #${result.winningHorseId}, ${result.settledBets} bets settled`);
    } catch (error: unknown) {
      setMessage(`Error: ${getApiErrorMessage(error, 'Failed to settle race.')}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRunRace = async () => {
    if (!generatedEventId) return;

    setLoadingAction('run');
    setMessage('');

    try {
      const result = await devApi.runRace(generatedEventId);
      setMessage(`Race simulation started. ID: ${result.simulationId}`);
    } catch (error: unknown) {
      setMessage(`Error: ${getApiErrorMessage(error, 'Failed to run race simulation.')}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <section className="panel dev-controls-panel">
      <div className="panel-heading-row">
        <h2>Dev Controls</h2>
      </div>

      {message && (
        <div className={`message-banner ${message.startsWith('Error') ? 'error' : 'success'}`} role="status">
          {message}
        </div>
      )}

      <div className="dev-control-stack">
        <form className="dev-deposit-form" onSubmit={handleDeposit}>
          <label htmlFor="dev-deposit-amount">
            <span>Deposit Credits</span>
            <input
              id="dev-deposit-amount"
              type="number"
              value={depositAmount}
              min="1"
              max="100000"
              step="0.01"
              onChange={(event) => setDepositAmount(event.target.value)}
              disabled={loading}
            />
          </label>
          <button className="primary-action" type="submit" disabled={loading}>
            {loadingAction === 'deposit' ? 'Processing...' : 'Deposit'}
          </button>
        </form>

        <button className="primary-action" type="button" onClick={handleGenerateRace} disabled={loading}>
          {loadingAction === 'generate' ? 'Generating...' : 'Generate Horse Race'}
        </button>

        {generatedEventId && (
          <>
            <div className="generated-race-summary">
              <span>Generated Race</span>
              <strong>#{generatedEventId}</strong>
            </div>
            <div className="dev-control-actions">
              <button className="secondary-action" type="button" onClick={handleSettleRace} disabled={loading}>
                {loadingAction === 'settle' ? 'Settling...' : 'Instant Settle'}
              </button>
              <button className="secondary-action" type="button" onClick={handleRunRace} disabled={loading}>
                {loadingAction === 'run' ? 'Starting...' : 'Run 30s Sim'}
              </button>
            </div>
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                window.location.href = `/events/${generatedEventId}`;
              }}
            >
              Open Race Page
            </button>
          </>
        )}
      </div>
    </section>
  );
}
