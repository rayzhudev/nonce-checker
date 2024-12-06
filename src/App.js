import { useState } from 'react';
import { ethers } from 'ethers';
import { CHAINS } from './constants/chains';
import './App.css';

function App() {
  const [address, setAddress] = useState('');
  const [nonces, setNonces] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkNonces = async () => {
    if (!ethers.isAddress(address)) {
      setError('Invalid Ethereum address');
      return;
    }

    setLoading(true);
    setError('');
    const newNonces = {};

    try {
      const results = await Promise.allSettled(
        CHAINS.map(async (chain) => {
          try {
            const provider = new ethers.JsonRpcProvider(chain.rpc);
            const nonce = await provider.getTransactionCount(address);
            return { chain: chain.name, nonce };
          } catch (err) {
            console.error(`Error fetching nonce for ${chain.name}:`, err);
            return { chain: chain.name, nonce: null };
          }
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          newNonces[result.value.chain] = result.value.nonce;
        } else {
          newNonces[result.value.chain] = 'Error';
        }
      });

      setNonces(newNonces);
    } catch (err) {
      setError('Error fetching nonces. Please try again.');
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="App">
      <h1>Multi-Chain Nonce Checker</h1>
      
      <div className="input-section">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Ethereum address"
        />
        <button onClick={checkNonces} disabled={loading}>
          {loading ? 'Checking...' : 'Check Nonces'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {Object.keys(nonces).length > 0 && (
        <div className="results">
          <h2>Nonces:</h2>
          <div className="nonce-grid">
            {CHAINS.map((chain) => (
              <div key={chain.chainId} className="nonce-item">
                <h3>{chain.name}</h3>
                <p>{nonces[chain.name] === null ? 'Error' : nonces[chain.name] ?? 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 