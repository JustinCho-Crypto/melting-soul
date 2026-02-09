export function shortenAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatPrice(price: string | number): string {
  return Number(price).toLocaleString()
}
