import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerateRace = async () => {
    setLoading(true);
    setMessage('');

    try {
      const result = await devApi.generateRace();
      setGeneratedEventId(result.eventId);
      setMessage(`Generated race #${result.eventId} with ${result.runners.length} horses`);
    } catch (error: unknown) {
      setMessage(`Error: ${getApiErrorMessage(error, 'Failed to generate race.')}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSettleRace = async () => {
    if (!generatedEventId) return;

    setLoading(true);
    setMessage('');

    try {
      const result = await devApi.settleRace(generatedEventId);
      setMessage(`Race settled. Winner: Horse #${result.winningHorseId}, ${result.settledBets} bets settled`);
    } catch (error: unknown) {
      setMessage(`Error: ${getApiErrorMessage(error, 'Failed to settle race.')}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunRace = async () => {
    if (!generatedEventId) return;

    setLoading(true);
    setMessage('');

    try {
      const result = await devApi.runRace(generatedEventId);
      setMessage(`Race simulation started. ID: ${result.simulationId}`);
    } catch (error: unknown) {
      setMessage(`Error: ${getApiErrorMessage(error, 'Failed to run race simulation.')}`);
    } finally {
      setLoading(false);
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
        <button className="primary-action" type="button" onClick={handleGenerateRace} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Horse Race'}
        </button>

        {generatedEventId && (
          <>
            <div className="generated-race-summary">
              <span>Generated Race</span>
              <strong>#{generatedEventId}</strong>
            </div>
            <div className="dev-control-actions">
              <button className="secondary-action" type="button" onClick={handleSettleRace} disabled={loading}>
                Instant Settle
              </button>
              <button className="secondary-action" type="button" onClick={handleRunRace} disabled={loading}>
                Run 30s Sim
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
