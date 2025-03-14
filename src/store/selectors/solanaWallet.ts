import { BN } from '@coral-xyz/anchor'
import { createSelector } from '@reduxjs/toolkit'
import { keySelectors, AnyProps } from './helpers'
import { PublicKey } from '@solana/web3.js'
import { tokens } from './pools'
import { ISolanaWallet, ITokenAccount, solanaWalletSliceName } from '@store/reducers/solanaWallet'
import { WRAPPED_SOL_ADDRESS } from '@store/consts/static'

const store = (s: AnyProps) => s[solanaWalletSliceName] as ISolanaWallet

export const {
  address,
  balance,
  accounts,
  status,
  solBalanceLoading,
  tokenBalanceLoading,
  thankYouModalShown
} = keySelectors(store, [
  'address',
  'balance',
  'accounts',
  'status',
  'solBalanceLoading',
  'tokenBalanceLoading',
  'thankYouModalShown'
])

export const balanceLoading = createSelector(
  solBalanceLoading,
  tokenBalanceLoading,
  (a, b) => a || b
)

export const tokenBalance = (tokenAddress: PublicKey) =>
  createSelector(accounts, tokensAccounts => {
    if (!tokensAccounts[tokenAddress.toString()]) {
      return { balance: new BN(0), decimals: 9 }
    }
    return {
      balance: tokensAccounts[tokenAddress.toString()].balance,
      decimals: tokensAccounts[tokenAddress.toString()].decimals
    }
  })
export const tokenAccount = (tokenAddress: PublicKey) =>
  createSelector(accounts, tokensAccounts => {
    if (tokensAccounts[tokenAddress.toString()]) {
      return tokensAccounts[tokenAddress.toString()]
    }
  })

export const tokenAccountsAddress = () =>
  createSelector(accounts, tokenAccounts => {
    return Object.values(tokenAccounts).map(item => {
      return item.address
    })
  })

export interface SwapToken {
  balance: BN
  decimals: number
  symbol: string
  assetAddress: PublicKey
  name: string
  logoURI: string
  isUnknown?: boolean
  coingeckoId?: string
}

export const swapTokens = createSelector(
  accounts,
  tokens,
  balance,
  (allAccounts, tokens, solBalance) => {
    return Object.values(tokens).map(token => ({
      ...token,
      assetAddress: token.address,
      balance:
        token.address.toString() === WRAPPED_SOL_ADDRESS
          ? solBalance
          : allAccounts[token.address.toString()]?.balance ?? new BN(0)
    }))
  }
)

export const poolTokens = createSelector(
  accounts,
  tokens,
  balance,
  (allAccounts, tokens, solBalance) => {
    return Object.values(tokens).map(token => ({
      ...token,
      assetAddress: token.address,
      balance:
        token.address.toString() === WRAPPED_SOL_ADDRESS
          ? solBalance
          : allAccounts[token.address.toString()]?.balance ?? new BN(0)
    }))
  }
)

export const swapTokensDict = createSelector(
  accounts,
  tokens,
  balance,
  (allAccounts, tokens, solBalance) => {
    const swapTokens: Record<string, SwapToken> = {}

    Object.entries(tokens).forEach(([key, val]) => {
      swapTokens[key] = {
        ...val,
        assetAddress: val.address,
        balance:
          val.address.toString() === WRAPPED_SOL_ADDRESS
            ? solBalance
            : allAccounts[val.address.toString()]?.balance ?? new BN(0)
      }
    })

    return swapTokens
  }
)

export type TokenAccounts = ITokenAccount & {
  symbol: string
  usdValue: BN
  assetDecimals: number
}

export const solanaWalletSelectors = {
  address,
  balance,
  accounts,
  status,
  tokenAccount,
  solBalanceLoading,
  tokenBalanceLoading,
  thankYouModalShown
}
export default solanaWalletSelectors
