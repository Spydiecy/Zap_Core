// Access Control Contract Configuration
export const ACCESS_CONTROL_CONFIG = {
  contractAddress: '0x44CEb2bEc4a921E383f269000A50560317C0Ef5B',
  subscriptionFee: '10000000000000000', // 0.01 OKB in wei (0.01 * 10^18)
  chainId: 195, // X Layer Testnet
  gasLimit: BigInt(100000), // Set reasonable gas limit
}

// Simplified ABI for the access control contractalr
export const ACCESS_CONTROL_ABI = [
	{
		"inputs": [],
		"name": "pay",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "hasPaid",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "paid",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
] as const

export interface SubscriptionStatus {
  hasAccess: boolean
  isLoading: boolean
}

/**
 * Check if a user has active subscription
 * @param address User's wallet address
 * @param readContract Function to read from contract
 * @returns SubscriptionStatus
 */
export async function checkSubscriptionStatus(
  address: `0x${string}`,
  readContract: (config: any) => Promise<any>
): Promise<SubscriptionStatus> {
  try {
    const hasAccess = await readContract({
      address: ACCESS_CONTROL_CONFIG.contractAddress as `0x${string}`,
      abi: ACCESS_CONTROL_ABI,
      functionName: 'hasPaid',
      args: [address],
    })

    return {
      hasAccess: Boolean(hasAccess),
      isLoading: false
    }
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return {
      hasAccess: false,
      isLoading: false
    }
  }
}

/**
 * Subscribe to the platform
 * @param writeContract Function to write to contract
 * @returns Transaction hash
 */
export async function subscribeToAccess(
  writeContract: (config: any) => Promise<any>
): Promise<string> {
  try {
    const txHash = await writeContract({
      address: ACCESS_CONTROL_CONFIG.contractAddress as `0x${string}`,
      abi: ACCESS_CONTROL_ABI,
      functionName: 'pay',
      value: BigInt(ACCESS_CONTROL_CONFIG.subscriptionFee),
      gas: ACCESS_CONTROL_CONFIG.gasLimit,
    })

    return txHash
  } catch (error) {
    console.error('Error subscribing:', error)
    throw error
  }
}

/**
 * Format OKB amount for display
 */
export function formatOKB(wei: string | bigint): string {
  const value = typeof wei === 'string' ? BigInt(wei) : wei
  const okb = Number(value) / 10**18
  return okb.toFixed(4)
}
