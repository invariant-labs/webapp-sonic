import { call, put, select, takeEvery } from 'typed-redux-saga'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { actions as swapActions } from '@store/reducers/swap'
import { swap } from '@store/selectors/swap'
import { poolsArraySortedByFees, tickMaps, tokens } from '@store/selectors/pools'
import { accounts } from '@store/selectors/solanaWallet'
import { createAccount, getWallet } from './wallet'
import { IWallet, Pair } from '@invariant-labs/sdk-sonic'
import { getConnection, handleRpcError } from './connection'
import {
  Keypair,
  sendAndConfirmRawTransaction,
  Transaction,
  TransactionExpiredTimeoutError,
  TransactionInstruction
} from '@solana/web3.js'
import {
  MAX_CROSSES_IN_SINGLE_TX,
  SIGNING_SNACKBAR_CONFIG,
  TIMEOUT_ERROR_MESSAGE,
  WRAPPED_SOL_ADDRESS
} from '@store/consts/static'
import { network, rpcAddress } from '@store/selectors/solanaConnection'
import { actions as connectionActions } from '@store/reducers/solanaConnection'
import { closeSnackbar } from 'notistack'
import { createLoaderKey, ensureError } from '@utils/utils'
import { getMarketProgram } from '@utils/web3/programs/amm'
import {
  createNativeAtaInstructions,
  createNativeAtaWithTransferInstructions
} from '@invariant-labs/sdk-sonic/lib/utils'
import { networkTypetoProgramNetwork } from '@utils/web3/connection'
import { actions as RPCAction, RpcStatus } from '@store/reducers/solanaConnection'

export function* handleSwapWithETH(): Generator {
  const loaderSwappingTokens = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  try {
    const tickmaps = yield* select(tickMaps)
    const allTokens = yield* select(tokens)
    const allPools = yield* select(poolsArraySortedByFees)
    const {
      slippage,
      tokenFrom,
      tokenTo,
      amountIn,
      estimatedPriceAfterSwap,
      poolIndex,
      byAmountIn,
      amountOut
    } = yield* select(swap)

    const wallet = yield* call(getWallet)
    const tokensAccounts = yield* select(accounts)
    const connection = yield* call(getConnection)
    const networkType = yield* select(network)
    const rpc = yield* select(rpcAddress)
    const marketProgram = yield* call(getMarketProgram, networkType, rpc, wallet as IWallet)
    const swapPool = allPools.find(
      pool =>
        (tokenFrom.equals(pool.tokenX) && tokenTo.equals(pool.tokenY)) ||
        (tokenFrom.equals(pool.tokenY) && tokenTo.equals(pool.tokenX))
    )

    if (!swapPool) {
      return
    }

    yield put(
      snackbarsActions.add({
        message: 'Swapping tokens...',
        variant: 'pending',
        persist: true,
        key: loaderSwappingTokens
      })
    )

    const isXtoY = tokenFrom.equals(swapPool.tokenX)

    const wrappedEthAccount = Keypair.generate()

    const net = networkTypetoProgramNetwork(networkType)
    let initialTx: Transaction
    let unwrapIx: TransactionInstruction
    if (allTokens[tokenFrom.toString()].address.toString() === WRAPPED_SOL_ADDRESS) {
      const {
        createIx,
        transferIx,
        initIx,
        unwrapIx: unwrap
      } = createNativeAtaWithTransferInstructions(
        wrappedEthAccount.publicKey,
        wallet.publicKey,
        net,
        amountIn.toNumber()
      )
      unwrapIx = unwrap
      initialTx = new Transaction().add(createIx).add(transferIx).add(initIx)
    } else {
      const {
        createIx,
        initIx,
        unwrapIx: unwrap
      } = createNativeAtaInstructions(wrappedEthAccount.publicKey, wallet.publicKey, net)
      unwrapIx = unwrap
      initialTx = new Transaction().add(createIx).add(initIx)
    }

    // const initialBlockhash = yield* call([connection, connection.getRecentBlockhash])
    // initialTx.recentBlockhash = initialBlockhash.blockhash
    // initialTx.feePayer = wallet.publicKey

    let fromAddress =
      allTokens[tokenFrom.toString()].address.toString() === WRAPPED_SOL_ADDRESS
        ? wrappedEthAccount.publicKey
        : tokensAccounts[tokenFrom.toString()]
          ? tokensAccounts[tokenFrom.toString()].address
          : null
    if (fromAddress === null) {
      fromAddress = yield* call(createAccount, tokenFrom)
    }
    let toAddress =
      allTokens[tokenTo.toString()].address.toString() === WRAPPED_SOL_ADDRESS
        ? wrappedEthAccount.publicKey
        : tokensAccounts[tokenTo.toString()]
          ? tokensAccounts[tokenTo.toString()].address
          : null
    if (toAddress === null) {
      toAddress = yield* call(createAccount, tokenTo)
    }

    const swapIx = yield* call(
      [marketProgram, marketProgram.swapIx],
      {
        pair: new Pair(tokenFrom, tokenTo, {
          fee: allPools[poolIndex].fee,
          tickSpacing: allPools[poolIndex].tickSpacing
        }),
        xToY: isXtoY,
        amount: byAmountIn ? amountIn : amountOut,
        estimatedPriceAfterSwap,
        slippage: slippage,
        accountX: isXtoY ? fromAddress : toAddress,
        accountY: isXtoY ? toAddress : fromAddress,
        byAmountIn: byAmountIn,
        owner: wallet.publicKey
      },
      {
        pool: allPools[poolIndex],
        tickmap: tickmaps[allPools[poolIndex].tickmap.toString()]
      },
      { tickCrosses: MAX_CROSSES_IN_SINGLE_TX }
    )

    initialTx.add(swapIx)
    initialTx.add(unwrapIx)

    // const swapBlockhash = yield* call([connection, connection.getRecentBlockhash])
    // swapTx.recentBlockhash = swapBlockhash.blockhash
    // swapTx.feePayer = wallet.publicKey

    // const unwrapTx = new Transaction().add(unwrapIx)
    // const unwrapBlockhash = yield* call([connection, connection.getRecentBlockhash])
    // unwrapTx.recentBlockhash = unwrapBlockhash.blockhash
    // unwrapTx.feePayer = wallet.publicKey

    const initialBlockhash = yield* call([connection, connection.getLatestBlockhash])
    initialTx.recentBlockhash = initialBlockhash.blockhash
    initialTx.feePayer = wallet.publicKey

    yield put(snackbarsActions.add({ ...SIGNING_SNACKBAR_CONFIG, key: loaderSigningTx }))

    const initialSignedTx = (yield* call(
      [wallet, wallet.signTransaction],
      initialTx
    )) as Transaction

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    initialSignedTx.partialSign(wrappedEthAccount)

    const initialTxid = yield* call(
      sendAndConfirmRawTransaction,
      connection,
      initialSignedTx.serialize(),
      {
        skipPreflight: false
      }
    )

    if (!initialTxid.length) {
      yield put(swapActions.setSwapSuccess(false))

      closeSnackbar(loaderSwappingTokens)
      yield put(snackbarsActions.remove(loaderSwappingTokens))

      return yield put(
        snackbarsActions.add({
          message: 'ETH wrapping failed. Please try again',
          variant: 'error',
          persist: false,
          txid: initialTxid
        })
      )
    }

    // const swapTxid = yield* call(
    //   sendAndConfirmRawTransaction,
    //   connection,
    //   swapSignedTx.serialize(),
    //   {
    //     skipPreflight: false
    //   }
    // )

    // if (!swapTxid.length) {
    //   yield put(swapActions.setSwapSuccess(false))

    //   return yield put(
    //     snackbarsActions.add({
    //       message:
    //         'Tokens swapping failed. Please unwrap wrapped ETH in your wallet and try again.',
    //       variant: 'error',
    //       persist: false,
    //       txid: swapTxid
    //     })
    //   )
    // } else {
    yield put(
      snackbarsActions.add({
        message: 'Tokens swapped successfully',
        variant: 'success',
        persist: false,
        txid: initialTxid
      })
    )
    // }

    // const unwrapTxid = yield* call(
    //   sendAndConfirmRawTransaction,
    //   connection,
    //   unwrapSignedTx.serialize(),
    //   {
    //     skipPreflight: false
    //   }
    // )

    yield put(swapActions.setSwapSuccess(true))

    // if (!unwrapTxid.length) {
    //   yield put(
    //     snackbarsActions.add({
    //       message: 'Wrapped ETH unwrap failed. Try to unwrap it in your wallet.',
    //       variant: 'warning',
    //       persist: false,
    //       txid: unwrapTxid
    //     })
    //   )
    // } else {
    //   yield put(
    //     snackbarsActions.add({
    //       message: 'ETH unwrapped successfully.',
    //       variant: 'success',
    //       persist: false,
    //       txid: unwrapTxid
    //     })
    //   )
    // }

    closeSnackbar(loaderSwappingTokens)
    yield put(snackbarsActions.remove(loaderSwappingTokens))
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    yield put(swapActions.setSwapSuccess(false))

    closeSnackbar(loaderSwappingTokens)
    yield put(snackbarsActions.remove(loaderSwappingTokens))
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    if (error instanceof TransactionExpiredTimeoutError) {
      yield put(
        snackbarsActions.add({
          message: TIMEOUT_ERROR_MESSAGE,
          variant: 'info',
          persist: true,
          txid: error.signature
        })
      )
      yield put(connectionActions.setTimeoutError(true))
      yield put(RPCAction.setRpcStatus(RpcStatus.Error))
    } else {
      yield put(
        snackbarsActions.add({
          message: 'Failed to send. Please try again',
          variant: 'error',
          persist: false
        })
      )
    }

    yield* call(handleRpcError, error.message)
  }
}

export function* handleSwap(): Generator {
  const loaderSwappingTokens = createLoaderKey()
  const loaderSigningTx = createLoaderKey()
  const tickmaps = yield* select(tickMaps)

  try {
    const allTokens = yield* select(tokens)
    const allPools = yield* select(poolsArraySortedByFees)
    const {
      slippage,
      tokenFrom,
      tokenTo,
      amountIn,
      estimatedPriceAfterSwap,
      poolIndex,
      byAmountIn,
      amountOut
    } = yield* select(swap)

    if (
      allTokens[tokenFrom.toString()].address.toString() === WRAPPED_SOL_ADDRESS ||
      allTokens[tokenTo.toString()].address.toString() === WRAPPED_SOL_ADDRESS
    ) {
      return yield* call(handleSwapWithETH)
    }

    const wallet = yield* call(getWallet)
    const tokensAccounts = yield* select(accounts)
    const networkType = yield* select(network)
    const rpc = yield* select(rpcAddress)
    const marketProgram = yield* call(getMarketProgram, networkType, rpc, wallet as IWallet)
    const swapPool = allPools.find(
      pool =>
        (tokenFrom.equals(pool.tokenX) && tokenTo.equals(pool.tokenY)) ||
        (tokenFrom.equals(pool.tokenY) && tokenTo.equals(pool.tokenX))
    )

    if (!swapPool) {
      return
    }

    yield put(
      snackbarsActions.add({
        message: 'Swapping tokens...',
        variant: 'pending',
        persist: true,
        key: loaderSwappingTokens
      })
    )

    const isXtoY = tokenFrom.equals(swapPool.tokenX)

    let fromAddress = tokensAccounts[tokenFrom.toString()]
      ? tokensAccounts[tokenFrom.toString()].address
      : null
    if (fromAddress === null) {
      fromAddress = yield* call(createAccount, tokenFrom)
    }
    let toAddress = tokensAccounts[tokenTo.toString()]
      ? tokensAccounts[tokenTo.toString()].address
      : null
    if (toAddress === null) {
      toAddress = yield* call(createAccount, tokenTo)
    }

    const swapTx = yield* call(
      [marketProgram, marketProgram.swapTx],
      {
        pair: new Pair(tokenFrom, tokenTo, {
          fee: allPools[poolIndex].fee,
          tickSpacing: allPools[poolIndex].tickSpacing
        }),
        xToY: isXtoY,
        amount: byAmountIn ? amountIn : amountOut,
        estimatedPriceAfterSwap,
        slippage: slippage,
        accountX: isXtoY ? fromAddress : toAddress,
        accountY: isXtoY ? toAddress : fromAddress,
        byAmountIn: byAmountIn,
        owner: wallet.publicKey
      },
      {
        pool: allPools[poolIndex],
        tickmap: tickmaps[allPools[poolIndex].tickmap.toString()],
        tokenXProgram: allTokens[allPools[poolIndex].tokenX.toString()].tokenProgram,
        tokenYProgram: allTokens[allPools[poolIndex].tokenY.toString()].tokenProgram
      }
    )
    const connection = yield* call(getConnection)
    const blockhash = yield* call([connection, connection.getLatestBlockhash])
    swapTx.recentBlockhash = blockhash.blockhash
    swapTx.feePayer = wallet.publicKey

    yield put(snackbarsActions.add({ ...SIGNING_SNACKBAR_CONFIG, key: loaderSigningTx }))

    const signedTx = (yield* call([wallet, wallet.signTransaction], swapTx)) as Transaction

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    const txid = yield* call(sendAndConfirmRawTransaction, connection, signedTx.serialize(), {
      skipPreflight: false
    })

    yield put(swapActions.setSwapSuccess(!!txid.length))

    if (!txid.length) {
      yield put(
        snackbarsActions.add({
          message: 'Tokens swapping failed. Please try again',
          variant: 'error',
          persist: false,
          txid
        })
      )
    } else {
      yield put(
        snackbarsActions.add({
          message: 'Tokens swapped successfully',
          variant: 'success',
          persist: false,
          txid
        })
      )
    }

    closeSnackbar(loaderSwappingTokens)
    yield put(snackbarsActions.remove(loaderSwappingTokens))
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    yield put(swapActions.setSwapSuccess(false))

    closeSnackbar(loaderSwappingTokens)
    yield put(snackbarsActions.remove(loaderSwappingTokens))
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    if (error instanceof TransactionExpiredTimeoutError) {
      yield put(
        snackbarsActions.add({
          message: TIMEOUT_ERROR_MESSAGE,
          variant: 'info',
          persist: true,
          txid: error.signature
        })
      )
      yield put(connectionActions.setTimeoutError(true))
      yield put(RPCAction.setRpcStatus(RpcStatus.Error))
    } else {
      yield put(
        snackbarsActions.add({
          message: 'Failed to send. Please try again',
          variant: 'error',
          persist: false
        })
      )
    }

    yield* call(handleRpcError, error.message)
  }
}

export function* swapHandler(): Generator {
  yield* takeEvery(swapActions.swap, handleSwap)
}
