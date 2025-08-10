// Access Control Configuration for X Layer Testnet
export const ACCESS_CONTROL_CONFIG = {
  // New access control contract address
  contractAddress: "0x44CEb2bEc4a921E383f269000A50560317C0Ef5B",
  
  // Access fee in wei (0.01 OKB = 0.01 ETH = 10000000000000000 wei)
  accessFee: "10000000000000000", // 0.01 OKB
  
  // X Layer Testnet configuration
  chainId: 195,
  chainName: "X Layer Testnet",
  nativeCurrency: {
    name: "OKB",
    symbol: "OKB",
    decimals: 18,
  },
  rpcUrl: "https://xlayertestrpc.okx.com",
  explorerUrl: "https://www.oklink.com/xlayer-test",
}

// Access Control ABI (basic functions for checking access and paying fees)
export const ACCESS_CONTROL_ABI = [
  {
    "inputs": [],
    "name": "payAccessFee",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "hasAccess",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "accessFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Helper function to format OKB amounts
export function formatOKB(wei: string | bigint): string {
  const value = typeof wei === 'string' ? BigInt(wei) : wei
  return (Number(value) / 1e18).toFixed(6).replace(/\.?0+$/, '')
}

// Helper function to check if user has access
export async function checkUserAccess(userAddress: string): Promise<boolean> {
  // This would typically make a contract call
  // For now, return true if wallet is connected
  return !!userAddress
}
