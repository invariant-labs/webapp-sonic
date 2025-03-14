import { createSelector } from '@reduxjs/toolkit'
import { IPoolsStore, poolsSliceName } from '../reducers/pools'
import { keySelectors, AnyProps } from './helpers'

const store = (s: AnyProps) => s[poolsSliceName] as IPoolsStore

export const {
  pools,
  tokens,
  poolTicks,
  isLoadingLatestPoolsForTransaction,
  tickMaps,
  volumeRanges,
  nearestPoolTicksForPair,
  isLoadingTicksAndTickMaps,
  isLoadingTokens,
  isLoadingPathTokens,
  isLoadingTokensError
} = keySelectors(store, [
  'pools',
  'tokens',
  'poolTicks',
  'isLoadingLatestPoolsForTransaction',
  'tickMaps',
  'volumeRanges',
  'nearestPoolTicksForPair',
  'isLoadingTicksAndTickMaps',
  'isLoadingTokens',
  'isLoadingPathTokens',
  'isLoadingTokensError'
])

export const poolsArraySortedByFees = createSelector(pools, allPools =>
  Object.values(allPools).sort((a, b) => a.fee.sub(b.fee).toNumber())
)

export const hasTokens = createSelector(tokens, allTokens => !!Object.values(allTokens).length)

export const poolsSelectors = {
  pools,
  tokens,
  poolTicks,
  isLoadingLatestPoolsForTransaction,
  tickMaps,
  volumeRanges,
  nearestPoolTicksForPair,
  isLoadingTicksAndTickMaps,
  isLoadingTokens,
  isLoadingPathTokens,
  isLoadingTokensError
}

export default poolsSelectors
