import { all, spawn } from 'redux-saga/effects'
import { connectionSaga } from './connection'
import { poolsSaga } from './pool'
import { swapSaga } from './swap'
import { walletSaga } from './wallet'
import { positionsSaga } from './positions'
import { intervalStatsHandler } from './stats'
import { creatorSaga } from './creator'
import { lockerSaga } from './locker'

export function* rootSaga(): Generator {
  yield all(
    [
      connectionSaga,
      walletSaga,
      swapSaga,
      positionsSaga,
      poolsSaga,
      intervalStatsHandler,
      creatorSaga,
      lockerSaga
    ].map(spawn)
  )
}
export default rootSaga
