import { StrategyConfig } from '@store/types/userOverview'
import { USDC_MAIN, WSOL_MAIN } from './static'
export const DEFAULT_FEE_TIER = '0_10'
export const STRATEGIES: StrategyConfig[] = [
  {
    tokenAddressA: WSOL_MAIN.address.toString(),
    tokenAddressB: USDC_MAIN.address.toString(),
    feeTier: '0_09'
  }
]
