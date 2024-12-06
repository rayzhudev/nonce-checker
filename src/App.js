import { useState } from 'react';
import { ethers } from 'ethers';
import { CHAINS } from './constants/chains';
import './App.css';

function App() {
  const [address, setAddress] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [nonces, setNonces] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resolveAddress = async (input) => {
    setAddress(input);
    try {
      // Check if input is ENS name
      if (input.endsWith('.eth')) {
        const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
        const resolved = await provider.resolveName(input);
        if (resolved) {
          setResolvedAddress(resolved);
          setError('');
          // Automatically check nonces after resolving ENS
          await checkNoncesForAddress(resolved);
        } else {
          setError('Could not resolve ENS name');
          setResolvedAddress('');
        }
      } else {
        setResolvedAddress(input);
        // If it's a regular address, check if it's valid and check nonces
        if (ethers.isAddress(input)) {
          await checkNoncesForAddress(input);
        }
      }
    } catch (err) {
      console.error('ENS resolution error:', err);
      setError('Error resolving ENS name');
      setResolvedAddress('');
    }
  };

  const checkNoncesForAddress = async (addressToCheck) => {
    if (!ethers.isAddress(addressToCheck)) {
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
            const nonce = await provider.getTransactionCount(addressToCheck);
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
          onChange={(e) => resolveAddress(e.target.value)}
          placeholder="Enter Ethereum address or ENS name"
        />
        <button onClick={() => checkNoncesForAddress(resolvedAddress)} disabled={loading}>
          {loading ? 'Checking...' : 'Check Nonces'}
        </button>
      </div>

      {resolvedAddress && address.endsWith('.eth') && (
        <div className="resolved-address">
          Resolved address: {resolvedAddress}
        </div>
      )}

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