export function shortenAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

import { formatUnits } from 'viem'

/** Format a wei-denominated price to human-readable string */
export function formatPrice(price: string | number, decimals = 6): string {
  const formatted = formatUnits(BigInt(price), decimals)
  // Drop unnecessary trailing zeros but keep at least 2 decimal places for display
  const num = Number(formatted)
  if (num === 0) return '0'
  return num % 1 === 0
    ? num.toLocaleString()
    : num.toLocaleString(undefined, { maximumFractionDigits: decimals })
}
