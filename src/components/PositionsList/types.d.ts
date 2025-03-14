import { BN } from '@coral-xyz/anchor'
import { Position } from '@invariant-labs/sdk-sonic/lib/market'
import { PublicKey } from '@solana/web3.js'
import { NetworkType } from '@store/consts/static'
import { PoolWithAddressAndIndex } from '@store/selectors/positions'

export interface IPositionItem {
  tokenXName: string
  tokenYName: string
  tokenXIcon: string
  tokenYIcon: string
  tokenXLiq: number
  poolAddress: PublicKey
  position: Position
  tokenYLiq: number
  fee: number
  min: number
  max: number
  valueX: number
  valueY: number
  id: string
  address: string
  isActive?: boolean
  currentPrice: number
  network: NetworkType
  isFullRange: boolean
  isLocked: boolean
  poolData: PoolWithAddressAndIndex
  liquidity: BN
}
