import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { network, rpcAddress, status } from '@store/selectors/solanaConnection'
import { Status, actions as solanaConnectionActions } from '@store/reducers/solanaConnection'
import { actions } from '@store/reducers/pools'
import { actions as positionsActions } from '@store/reducers/positions'
import { poolsArraySortedByFees } from '@store/selectors/pools'
import { swap } from '@store/selectors/swap'
import { IWallet } from '@invariant-labs/sdk-sonic'
import { PublicKey } from '@solana/web3.js'
import { getMarketProgramSync } from '@utils/web3/programs/amm'
import { getCurrentSolanaConnection } from '@utils/web3/connection'
import { getFullNewTokensData, getNetworkTokensList, ROUTES } from '@utils/utils'
import { getSonicWallet } from '@utils/web3/wallet'
import {
  currentPoolIndex,
  currentPositionData,
  currentPositionId,
  lockedPositionsWithPoolsData,
  positionsWithPoolsData
} from '@store/selectors/positions'
import { useLocation } from 'react-router-dom'

const MarketEvents = () => {
  const dispatch = useDispatch()
  const networkType = useSelector(network)
  const rpc = useSelector(rpcAddress)
  const wallet = getSonicWallet()
  const marketProgram = getMarketProgramSync(networkType, rpc, wallet as IWallet)
  const { tokenFrom, tokenTo } = useSelector(swap)
  const networkStatus = useSelector(status)
  const allPools = useSelector(poolsArraySortedByFees)
  const positionsList = useSelector(positionsWithPoolsData)
  const lockedPositionsList = useSelector(lockedPositionsWithPoolsData)
  const currentPositionIndex = useSelector(currentPositionId)
  const currentPosition = useSelector(currentPositionData)
  const newPositionPoolIndex = useSelector(currentPoolIndex)
  const [subscribedSwapPools, _setSubscribedSwapPools] = useState<Set<string>>(new Set())
  const [subscribedPositionsPools, _setSubscribedPositionsPools] = useState<Set<string>>(new Set())
  const [newPositionSubscribedPool, setNewPositionSubscribedPool] = useState<PublicKey>(
    PublicKey.default
  )

  const location = useLocation()

  useEffect(() => {
    const connection = getCurrentSolanaConnection()
    if (networkStatus !== Status.Initialized || !connection) {
      return
    }
    const connectEvents = () => {
      let tokens = getNetworkTokensList(networkType)

      const currentListStr = localStorage.getItem(`CUSTOM_TOKENS_${networkType}`)
      const currentList: PublicKey[] =
        currentListStr !== null
          ? JSON.parse(currentListStr)
              .filter((address: string) => !tokens[address])
              .map((address: string) => new PublicKey(address))
          : []

      const lastTokenFrom = localStorage.getItem(`INVARIANT_LAST_TOKEN_FROM_${networkType}`)
      const lastTokenTo = localStorage.getItem(`INVARIANT_LAST_TOKEN_FROM_${networkType}`)

      if (
        lastTokenFrom !== null &&
        !tokens[lastTokenFrom] &&
        !currentList.find(addr => addr.toString() === lastTokenFrom)
      ) {
        currentList.push(new PublicKey(lastTokenFrom))
      }

      if (
        lastTokenTo !== null &&
        !tokens[lastTokenTo] &&
        !currentList.find(addr => addr.toString() === lastTokenTo)
      ) {
        currentList.push(new PublicKey(lastTokenTo))
      }

      getFullNewTokensData(currentList, connection)
        .then(data => {
          tokens = {
            ...tokens,
            ...data
          }
        })
        .finally(() => {
          dispatch(actions.addTokens(tokens))
        })
    }

    connectEvents()
  }, [dispatch, networkStatus])

  // New position pool subscription
  useEffect(() => {
    if (newPositionPoolIndex !== null && newPositionPoolIndex !== undefined) {
      const pool = allPools[newPositionPoolIndex]
      if (pool && !pool.address.equals(newPositionSubscribedPool)) {
        marketProgram.program.account.pool.unsubscribe(newPositionSubscribedPool)
        setNewPositionSubscribedPool(pool.address)
        marketProgram.onPoolChange(
          pool.tokenX,
          pool.tokenY,
          { fee: pool.fee, tickSpacing: pool.tickSpacing },
          poolStructure => {
            dispatch(
              actions.updatePool({
                address: pool.address,
                poolStructure
              })
            )
          }
        )
      }
    }
  }, [dispatch, networkStatus, newPositionPoolIndex])

  // User position pool subscriptions
  useEffect(() => {
    if (
      networkStatus !== Status.Initialized ||
      !marketProgram ||
      (!location.pathname.startsWith(ROUTES.PORTFOLIO) &&
        !location.pathname.startsWith(ROUTES.POSITION))
    ) {
      return
    }

    const connectEvents = () => {
      const allPositions = [...positionsList, ...lockedPositionsList]

      const pools = allPositions.map(position => position.poolData)

      const poolsAddresses = pools.map(pool => pool.address.toBase58())
      const unsubscribedPools = Array.from(subscribedPositionsPools).filter(
        pool => !poolsAddresses.includes(pool)
      )

      for (const pool of unsubscribedPools) {
        marketProgram.program.account.pool.unsubscribe(new PublicKey(pool))
        subscribedPositionsPools.delete(pool)
      }

      for (const pool of pools) {
        if (subscribedPositionsPools.has(pool.address.toBase58())) {
          continue
        }

        subscribedPositionsPools.add(pool.address.toBase58())

        marketProgram.onPoolChange(
          pool.tokenX,
          pool.tokenY,
          { fee: pool.fee, tickSpacing: pool.tickSpacing },
          poolStructure => {
            const positionsInPool = allPositions.filter(position =>
              position.pool.equals(pool.address)
            )

            if (pool.currentTickIndex !== poolStructure.currentTickIndex) {
              positionsInPool.map(position => {
                //update current position details
                if (
                  currentPositionIndex ===
                    position.id.toString() + '_' + position.pool.toString() &&
                  currentPosition
                ) {
                  if (
                    (pool.currentTickIndex >= currentPosition?.lowerTickIndex &&
                      poolStructure.currentTickIndex < currentPosition?.lowerTickIndex) ||
                    (pool.currentTickIndex < currentPosition?.lowerTickIndex &&
                      poolStructure.currentTickIndex >= currentPosition?.lowerTickIndex)
                  ) {
                    dispatch(
                      positionsActions.getCurrentPositionRangeTicks({
                        id: currentPositionIndex,
                        fetchTick: 'lower'
                      })
                    )
                  } else if (
                    (pool.currentTickIndex < currentPosition?.upperTickIndex &&
                      poolStructure.currentTickIndex >= currentPosition?.upperTickIndex) ||
                    (pool.currentTickIndex >= currentPosition?.upperTickIndex &&
                      poolStructure.currentTickIndex < currentPosition?.upperTickIndex)
                  ) {
                    dispatch(
                      positionsActions.getCurrentPositionRangeTicks({
                        id: currentPositionIndex,
                        fetchTick: 'upper'
                      })
                    )
                  }
                }
              })
            }

            dispatch(
              actions.updatePool({
                address: pool.address,
                poolStructure
              })
            )
          }
        )
      }
    }

    connectEvents()
  }, [
    dispatch,
    lockedPositionsList,
    positionsList,
    networkStatus,
    marketProgram,
    currentPositionIndex,
    location.pathname
  ])

  useEffect(() => {
    window.addEventListener('unhandledrejection', e => {
      dispatch(solanaConnectionActions.handleRpcError(e))
    })

    return () => {}
  }, [])

  // Swap pool & tickmap and ticks query
  useEffect(() => {
    if (tokenFrom && tokenTo) {
      dispatch(actions.getNearestTicksForPair({ tokenFrom, tokenTo, allPools }))
      dispatch(actions.getTicksAndTickMaps({ tokenFrom, tokenTo, allPools }))

      const pools = allPools.filter(
        p =>
          (p.tokenX.equals(tokenFrom) && p.tokenY.equals(tokenTo)) ||
          (p.tokenX.equals(tokenTo) && p.tokenY.equals(tokenFrom))
      )

      for (const subscribedPool of Array.from(subscribedSwapPools)) {
        if (pools.some(p => p.address.toString() === subscribedPool)) {
          continue
        } else {
          marketProgram.program.account.pool.unsubscribe(new PublicKey(subscribedPool))
          subscribedSwapPools.delete(subscribedPool)
        }
      }

      if (pools) {
        for (const pool of pools) {
          subscribedSwapPools.add(pool.address.toString())

          marketProgram.onPoolChange(
            pool.tokenX,
            pool.tokenY,
            { fee: pool.fee, tickSpacing: pool.tickSpacing },
            poolStructure => {
              dispatch(
                actions.updatePool({
                  address: pool.address,
                  poolStructure
                })
              )
            }
          )
        }
      }
    }
  }, [tokenFrom, tokenTo])

  useEffect(() => {
    // Unsubscribe from swap pools on different pages than swap
    if (!location.pathname.startsWith(ROUTES.EXCHANGE)) {
      for (const pool of Array.from(subscribedSwapPools)) {
        marketProgram.program.account.pool.unsubscribe(new PublicKey(pool))
        subscribedSwapPools.delete(pool)
      }
    }

    // Unsubscribe from new position pool on different pages than new position
    if (
      !location.pathname.startsWith(ROUTES.NEW_POSITION) &&
      !newPositionSubscribedPool.equals(PublicKey.default)
    ) {
      marketProgram.program.account.pool.unsubscribe(newPositionSubscribedPool)
      setNewPositionSubscribedPool(PublicKey.default)
    }
    // Unsubscribe from position details pools on different pages than portfolio
    if (
      !location.pathname.startsWith(ROUTES.PORTFOLIO) &&
      !location.pathname.startsWith(ROUTES.POSITION)
    ) {
      for (const pool of Array.from(subscribedPositionsPools)) {
        marketProgram.program.account.pool.unsubscribe(new PublicKey(pool))
        subscribedPositionsPools.delete(pool)
      }
    }
  }, [location.pathname])

  return null
}

export default MarketEvents
