import { all, call, put, SagaGenerator, select, takeLeading, spawn } from 'typed-redux-saga'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Connection } from '@solana/web3.js'
import { PayloadAction } from '@reduxjs/toolkit'
import { network, rpcAddress, rpcStatus } from '@store/selectors/solanaConnection'
import { getSolanaConnection } from '@utils/web3/connection'
import { actions, RpcStatus, Status } from '@store/reducers/solanaConnection'
import { NetworkType, RECOMMENDED_RPC_ADDRESS } from '@store/consts/static'
import { ensureError } from '@utils/utils'

export function* handleRpcError(error: string): Generator {
  const currentRpc = yield* select(rpcAddress)
  const currentRpcStatus = yield* select(rpcStatus)
  const networkType = yield* select(network)

  console.log(error)
  if (!error || error === 'undefined') {
    return
  }
  if (
    currentRpc !== RECOMMENDED_RPC_ADDRESS[networkType] &&
    (error.includes('Failed to fetch') || error.includes('400') || error.includes('403'))
  ) {
    if (currentRpcStatus === RpcStatus.Uninitialized) {
      yield* put(actions.setRpcStatus(RpcStatus.Error))
    } else if (currentRpcStatus === RpcStatus.Ignored) {
      yield* put(actions.setRpcStatus(RpcStatus.IgnoredWithError))
    }
  }
}

export function* handleRpcErrorHandler(action: PayloadAction<PromiseRejectionEvent>): Generator {
  yield* call(handleRpcError, action.payload.reason.message)
}

export function* getConnection(): SagaGenerator<Connection> {
  const rpc = yield* select(rpcAddress)
  const connection = yield* call(getSolanaConnection, rpc)

  return connection
}

export function* initConnection(): Generator {
  try {
    yield* call(getConnection)

    yield* put(
      snackbarsActions.add({
        message: 'Sonic network connected',
        variant: 'success',
        persist: false
      })
    )
    yield* put(actions.setStatus(Status.Initialized))
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    yield* put(actions.setStatus(Status.Error))
    yield put(
      snackbarsActions.add({
        message: 'Failed to connect to Sonic network',
        variant: 'error',
        persist: false
      })
    )

    yield* call(handleRpcError, error.message)
  }
}

export function* handleNetworkChange(action: PayloadAction<NetworkType>): Generator {
  yield* put(
    snackbarsActions.add({
      message: `You are on network ${action.payload}`,
      variant: 'info',
      persist: false
    })
  )

  localStorage.setItem('INVARIANT_NETWORK_SONIC', action.payload)
  window.location.reload()
}

export function* updateSlot(): Generator {
  const connection = yield* call(getConnection)
  const slot = yield* call([connection, connection.getSlot])
  yield* put(actions.setSlot(slot))
}

export function* updateSlotSaga(): Generator {
  yield takeLeading(actions.updateSlot, updateSlot)
}

export function* networkChangeSaga(): Generator {
  yield takeLeading(actions.setNetwork, handleNetworkChange)
}
export function* initConnectionSaga(): Generator {
  yield takeLeading(actions.initSolanaConnection, initConnection)
}

export function* handleRpcErrorSaga(): Generator {
  yield takeLeading(actions.handleRpcError, handleRpcErrorHandler)
}
export function* connectionSaga(): Generator {
  yield* all([networkChangeSaga, initConnectionSaga, updateSlotSaga, handleRpcErrorSaga].map(spawn))
}
