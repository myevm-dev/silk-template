'use client';
import React, { useState } from 'react';
import PersonalSign from "@/components/PersonalSign";
import SwitchChains from "@/components/SwitchChains";
import { useWallet } from "@/components/WalletContext";
import { keccak256 } from 'ethereum-cryptography/keccak';
import { utf8ToBytes } from 'ethereum-cryptography/utils';
import { initSilk } from '@silk-wallet/silk-wallet-sdk';

export default function Home() {
  const { connected, walletClient, userAddress } = useWallet();
  const [hashedAddress, setHashedAddress] = useState("");
  const [error, setError] = useState("");
  const [isLoggedInWithThumbprint, setIsLoggedInWithThumbprint] = useState(false);

  // Handle thumbprint + password login
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

      // Step 1: Use WebAuthn API to authenticate thumbprint
      const credential = await navigator.credentials.create({ publicKey });
      if (credential) {
        const password = prompt("Enter your password");
        if (!password) throw new Error("Password required");

        // Step 2: Combine thumbprint data and password
        const combinedData = credential.id + password;

        // Step 3: Hash the combined data using Keccak256
        const dataBytes = utf8ToBytes(combinedData);
        const hash = keccak256(dataBytes);

        // Step 4: Use the first 20 bytes of the hash to create an Ethereum-like address
        const hashedAddress = `0x${Buffer.from(hash).toString('hex').slice(0, 40)}`;
        setHashedAddress(hashedAddress);

        // Step 5: Initialize Silk SDK and directly use hashed address as login credential
        const silkProvider = initSilk();

        // Simulate login with the hashed address
        const silkLoginResponse = (await silkProvider.request({
          method: 'eth_accounts',
          params: [hashedAddress],
        })) as string[];

        if (silkLoginResponse.includes(hashedAddress)) {
          console.log('Logged in with hashed address:', hashedAddress);
          setIsLoggedInWithThumbprint(true);
        } else {
          throw new Error('Failed to log in with the hashed address');
        }
      }
    } catch (err) {
      console.error('Error during thumbprint login:', err as Error);
      setError((err as Error).message);
    }
  };

  return (
    <main className="flex flex-grow flex-col items-center justify-between p-24">
      <div className="w-full max-w-5xl flex flex-col items-center space-y-4 font-mono text-sm lg:flex">
        {/* If the user is logged in with thumbprint + password */}
        {isLoggedInWithThumbprint ? (
          <>
            <div className="p-4 rounded-md border-black border bg-white w-1/2">
              <h2 className="text-lg font-semibold mb-2">Hashed Address</h2>
              <p className="mt-2 text-gray-600 break-all">{hashedAddress}</p>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={handleLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Connect with Thumbprint and Password
            </button>
            {error && <p className="text-red-500">{error}</p>}
          </>
        )}

        {/* If the user is connected to the wallet */}
        {connected && walletClient && userAddress ? (
          <>
            <div className="p-4 rounded-md border-black border bg-white w-1/2">
              <h2 className="text-lg font-semibold mb-2">Address</h2>
              <p className="mt-2 text-gray-600 break-all">{userAddress}</p>
            </div>
            <PersonalSign />
            <SwitchChains />
          </>
        ) : (
          "Not connected"
        )}
      </div>
    </main>
  );
}
