'use client';  // Ensure this component runs on the client-side

import React, { useState } from 'react';  // Import useState from React
import { keccak256 } from 'ethereum-cryptography/keccak';
import { utf8ToBytes } from 'ethereum-cryptography/utils';
import { initSilk } from '@silk-wallet/silk-wallet-sdk';  // Import initSilk

export default function Home() {
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hashedAddress, setHashedAddress] = useState("");

  const handleLogin = async () => {
    try {
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(16),
        rp: { name: "My PWA" },
        user: {
          id: new Uint8Array(16),  // Unique user ID
          name: "anonymous",  // Placeholder for name
          displayName: "User",  // Placeholder for display name
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: { 
          authenticatorAttachment: "platform", 
          userVerification: "required" 
        },
        timeout: 60000,
        attestation: "direct",
      };

      const credential = await navigator.credentials.create({ publicKey });
      if (credential) {
        const password = prompt("Enter your password");
        if (!password) throw new Error("Password required");

        const combinedData = credential.id + password;

        // Convert combined data to bytes using utf8ToBytes
        const dataBytes = utf8ToBytes(combinedData);

        // Hash the data with keccak256
        const hash = keccak256(dataBytes);

        // Convert the first 20 bytes of the hash to an Ethereum-like address
        const hashedAddress = `0x${Buffer.from(hash).toString('hex').slice(0, 40)}`;

        setHashedAddress(hashedAddress);

        // Initialize Silk SDK and log in using hashedAddress...
        const silkProvider = initSilk();
        await silkProvider.login();

        const accounts = (await silkProvider.request({ method: "eth_accounts" })) as string[];
        if (!accounts.includes(hashedAddress)) {
          throw new Error("Failed to log in with the hashed address");
        }

        console.log("Logged in with hashed address:", hashedAddress);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error("Error during thumbprint login:", err as Error);
      setError((err as Error).message);
    }
  };

  return (
    <main className="flex flex-grow flex-col items-center justify-between p-24">
      <div className="w-full max-w-5xl flex flex-col items-center space-y-4 font-mono text-sm lg:flex">
        {isLoggedIn ? (
          <div>
            <p>Successfully Logged In!</p>
            <p>Your Hashed Address: {hashedAddress}</p>
          </div>
        ) : (
          <>
            <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
              Connect with Thumbprint and Password
            </button>
            {error && <p className="text-red-500">{error}</p>}
          </>
        )}
      </div>
    </main>
  );
}
