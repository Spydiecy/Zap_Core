interface Window {
  solana?: {
    isPhantom?: boolean;
    isConnected: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    on: (event: string, callback: () => void) => void;
    off: (event: string, callback?: () => void) => void;
    publicKey?: { toString: () => string };
  };
}
