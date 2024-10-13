'use client';
import { useState } from 'react';
import PersonalSign from "@/components/PersonalSign";
import SwitchChains from "@/components/SwitchChains";
import { useWallet } from "@/components/WalletContext";
import { initSilk } from '@silk-wallet/silk-wallet-sdk';
import { ethers } from 'ethers';

export default function Home() {
  const { connected, walletClient, userAddress } = useWallet();
  const [error, setError] = useState("");
  
  const handleLogin = async () => {
    try {
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array([/* Challenge goes here */]),
        rp: { name: "My PWA" },
        user: {
          id: new Uint8Array(16),
          name: "user@example.com",
          displayName: "User",
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000,
        attestation: "direct" as AttestationConveyancePreference, // Fix the attestation type
      };

      const credential = await navigator.credentials.create({ publicKey });
      if (credential) {
        const password = prompt("Enter your password");
        if (!password) throw new Error("Password required");

        const hash = ethers.utils.id(credential.id + password);
        const wallet = ethers.Wallet.createRandom({ entropy: ethers.utils.toUtf8Bytes(hash) });
        const generatedAddress = wallet.address;

        const silkProvider = initSilk();
        await silkProvider.login();

        const accounts = (await silkProvider.request({ method: "eth_accounts" })) as string[];
        if (!accounts.includes(generatedAddress)) {
          throw new Error("Failed to login with generated address");
        }

        console.log("Logged in with address:", generatedAddress);
      }
    } catch (err) {
      console.error("Error during thumbprint login:", err as Error);
      setError((err as Error).message);
    }
  };

  return (
    <main className="flex flex-grow flex-col items-center justify-between p-24">
      <div className="w-full max-w-5xl flex flex-col items-center space-y-4 font-mono text-sm lg:flex">
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
