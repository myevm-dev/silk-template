'use client';
import { useState } from 'react';
import { initSilk } from '@silk-wallet/silk-wallet-sdk';
import { sha256 } from 'crypto-hash'; // Use any hashing function

export default function Home() {
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hashedAddress, setHashedAddress] = useState("");

  // Function to handle login with thumbprint and password
  const handleLogin = async () => {
    try {
      // Step 1: Use WebAuthn API to authenticate the thumbprint
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(16), // Provide a challenge
        rp: { name: "My PWA" },
        user: {
          id: new Uint8Array(16), // Unique user ID
          name: "anonymous", // Placeholder for name
          displayName: "User", // Placeholder for display name
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
        // Step 2: Ask for the user's password
        const password = prompt("Enter your password");
        if (!password) throw new Error("Password required");

        // Step 3: Combine thumbprint ID and password to create a unique identifier
        const combinedData = credential.id + password;

        // Step 4: Hash the combined data to generate a unique identifier (hashed address)
        const hashedAddress = await sha256(combinedData);
        setHashedAddress(`0x${hashedAddress.slice(0, 40)}`); // Ethereum-like format

        // Step 5: Initialize Silk SDK
        const silkProvider = initSilk();

        // Step 6: Use the hashed address to log in with the Silk SDK
        const accounts = (await silkProvider.request({ method: "eth_accounts" })) as string[]; // Cast accounts as string[]

        // Step 7: Validate the hashed address
        if (!accounts.includes(hashedAddress)) {
          throw new Error("Failed to log in with the hashed address");
        }

        // Successfully logged in
        console.log("Logged in with hashed address:", hashedAddress);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error("Error during thumbprint login:", err as Error); // Cast err as Error
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
            <button
              onClick={handleLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Connect with Thumbprint and Password
            </button>
            {error && <p className="text-red-500">{error}</p>}
          </>
        )}
      </div>
    </main>
  );
}
