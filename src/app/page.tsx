'use client';

import React, { useState } from 'react';
import PersonalSign from "@/components/PersonalSign";
import SwitchChains from "@/components/SwitchChains";
import { useWallet } from "@/components/WalletContext";
import { keccak256 } from 'ethereum-cryptography/keccak';
import { utf8ToBytes } from 'ethereum-cryptography/utils';
import { initSilk } from '@silk-wallet/silk-wallet-sdk';

// Function to generate a compliant password for Silk's authentication
const generateCompliantPassword = (basePassword: string): string => {
  let password = basePassword;

  // Ensure at least one uppercase letter
  if (!/[A-Z]/.test(password)) password += 'A';
  // Ensure at least one lowercase letter
  if (!/[a-z]/.test(password)) password += 'a';
  // Ensure at least one number
  if (!/[0-9]/.test(password)) password += '1';
  // Ensure at least one special character
  if (!/[^A-Za-z0-9]/.test(password)) password += '!';
  // Ensure the password is at least 14 characters long
  while (password.length < 14) password += 'x';

  return password;
};

// Function to generate an Ethereum-like address using thumbprint + password
const generateEthereumAddress = (thumbprint: string, password: string): string => {
  const combinedData = thumbprint + password;
  const dataBytes = utf8ToBytes(combinedData);
  const hash = keccak256(dataBytes);
  const ethereumAddress = `0x${Buffer.from(hash).toString('hex').slice(0, 40)}`;
  return ethereumAddress;
};

export default function Home() {
  const { connected, walletClient, userAddress } = useWallet();
  const [hashedAddress, setHashedAddress] = useState("");
  const [error, setError] = useState("");
  const [isLoggedInWithThumbprint, setIsLoggedInWithThumbprint] = useState(false);

  // Handle thumbprint + password login
  const handleLogin = async () => {
    try {
      const thumbprint = 'user-thumbprint';  // Replace with actual thumbprint data
      const password = prompt("Enter your password");
      if (!password) throw new Error("Password required");

      // Generate the same Ethereum wallet every time based on thumbprint + password
      const ethereumAddress = generateEthereumAddress(thumbprint, password);
      setHashedAddress(ethereumAddress);
      console.log("Generated Ethereum Address:", ethereumAddress);

      // Make the password compliant for Silk SDK submission (if necessary)
      const compliantPassword = generateCompliantPassword(password);

      // Now submit the compliant password to Silk SDK for authentication
      const silkProvider = initSilk();

      await silkProvider.request({
        method: 'silk_finishAuthentication', // Hypothetical Silk SDK method
        params: { password: compliantPassword },
      });

      console.log("Final authentication step completed!");
      setIsLoggedInWithThumbprint(true);

    } catch (err) {
      console.error("Error during authentication step:", err);
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
              <h2 className="text-lg font-semibold mb-2">Hashed Address (Ethereum Wallet)</h2>
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
