import { BN } from '@coral-xyz/anchor'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PublicKey } from '@solana/web3.js'
import { PayloadType } from '@store/consts/types'
import { DEFAULT_PUBLICKEY } from '@store/consts/static'

export enum Status {
  Uninitialized = 'uninitialized',
  Init = 'init',
  Error = 'error',
  Initialized = 'initalized'
}
export interface ITokenAccount {
  programId: PublicKey
  balance: BN
  address: PublicKey
  decimals: number
}
export interface ITokenData {
  programId: string
  mintAuthority: string | null
  freezeAuthority: string | null
  supply: number
  decimals: number
}
export interface ITransaction {
  recipient: string
  amount: number
  txid: string
  sending: boolean
  token?: PublicKey
  error?: string
}
export interface ISolanaWallet {
  status: Status
  address: PublicKey
  balance: BN
  accounts: { [key in string]: ITokenAccount }
  solBalanceLoading: boolean
  tokenBalanceLoading: boolean
  thankYouModalShown: boolean
}

export const defaultState: ISolanaWallet = {
  status: Status.Uninitialized,
  address: DEFAULT_PUBLICKEY,
  balance: new BN(0),
  accounts: {},
  solBalanceLoading: false,
  tokenBalanceLoading: false,
  thankYouModalShown: false
}

export const solanaWalletSliceName = 'solanaWallet'
const solanaWalletSlice = createSlice({
  name: solanaWalletSliceName,
  initialState: defaultState,
  reducers: {
    resetState() {
      return defaultState
    },
    initWallet(state) {
      return state
    },
    setAddress(state, action: PayloadAction<PublicKey>) {
      state.address = action.payload
      return state
    },
    setStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload
      return state
    },
    setBalance(state, action: PayloadAction<BN>) {
      state.balance = action.payload
      return state
    },
    getBalance(state) {
      return state
    },
    changeWalletInExtension(state) {
      return state
    },
    setIsSolBalanceLoading(state, action: PayloadAction<boolean>) {
      action.payload ? (state.solBalanceLoading = true) : (state.solBalanceLoading = false)
      return state
    },
    addTokenAccount(state, action: PayloadAction<ITokenAccount>) {
      state.accounts[action.payload.programId.toString()] = action.payload
      return state
    },
    addTokenAccounts(state, action: PayloadAction<ITokenAccount[]>) {
      action.payload.forEach(account => {
        state.accounts[account.programId.toString()] = account
      })
      return state
    },
    setTokenAccounts(state, action: PayloadAction<ITokenAccount[]>) {
      state.accounts = {}
      action.payload.forEach(account => {
        state.accounts[account.programId.toString()] = account
      })
      return state
    },
    setTokenBalance(state, action: PayloadAction<IsetTokenBalance>) {
      state.accounts[action.payload.programId].balance = action.payload.balance
      return state
    },
    showThankYouModal(state, action: PayloadAction<boolean>) {
      state.thankYouModalShown = action.payload
      return state
    },
    setIsTokenBalanceLoading(state, action: PayloadAction<boolean>) {
      state.tokenBalanceLoading = action.payload
      return state
    },
    rescanTokens() {},
    airdrop() {},
    connect(state, _action: PayloadAction<boolean>) {
      return state
    },
    disconnect() {},
    reconnect() {},
    unwrapWSOL() {}
  }
})
interface IsetTokenBalance {
  address: string
  programId: string
  balance: BN
}

export const actions = solanaWalletSlice.actions
export const reducer = solanaWalletSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
