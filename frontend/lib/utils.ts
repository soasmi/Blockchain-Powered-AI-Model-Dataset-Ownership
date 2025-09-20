import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatEther(value: bigint): string {
  return (Number(value) / 1e18).toFixed(4)
}

export function parseEther(value: string): bigint {
  return BigInt(Math.floor(parseFloat(value) * 1e18))
}

export function formatDate(date: Date | number): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateAssetId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function getAssetTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'model':
      return 'asset-type-model'
    case 'script':
      return 'asset-type-script'
    case 'dataset':
      return 'asset-type-dataset'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getAssetTypeIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'model':
      return '🧠'
    case 'script':
      return '📜'
    case 'dataset':
      return '📊'
    default:
      return '📁'
  }
}