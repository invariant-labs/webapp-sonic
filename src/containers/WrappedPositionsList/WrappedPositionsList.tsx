import { PositionsList } from '@components/PositionsList/PositionsList'
import { POSITIONS_PER_PAGE } from '@store/consts/static'
import { calculatePriceSqrt } from '@invariant-labs/sdk-sonic'
import { getX, getY } from '@invariant-labs/sdk-sonic/lib/math'
import { DECIMAL, getMaxTick, getMinTick } from '@invariant-labs/sdk-sonic/lib/utils'
import { actions } from '@store/reducers/positions'
import { Status, actions as walletActions } from '@store/reducers/solanaWallet'
import {
  isLoadingPositionsList,
  lastPageSelector,
  lockedPositionsWithPoolsData,
  positionsWithPoolsData
} from '@store/selectors/positions'
import { address, status } from '@store/selectors/solanaWallet'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { calcYPerXPriceBySqrtPrice, printBN, ROUTES } from '@utils/utils'
import { IPositionItem } from '@components/PositionsList/types'
import { network } from '@store/selectors/solanaConnection'
import { actions as actionsStats } from '@store/reducers/stats'
import { actions as lockerActions } from '@store/reducers/locker'

export const WrappedPositionsList: React.FC = () => {
  const walletAddress = useSelector(address)
  const list = useSelector(positionsWithPoolsData)
  const lockedList = useSelector(lockedPositionsWithPoolsData)
  const isLoading = useSelector(isLoadingPositionsList)
  const lastPage = useSelector(lastPageSelector)
  const walletStatus = useSelector(status)
  const currentNetwork = useSelector(network)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const setLastPage = (page: number) => {
    dispatch(actions.setLastPage(page))
  }

  useEffect(() => {
    if (list.length === 0) {
      setLastPage(1)
    }

    if (lastPage > Math.ceil(list.length / POSITIONS_PER_PAGE)) {
      setLastPage(lastPage === 1 ? 1 : lastPage - 1)
    }
  }, [list])

  const handleRefresh = () => {
    dispatch(actions.getPositionsList())
  }

  useEffect(() => {
    dispatch(actionsStats.getCurrentStats())
  }, [])

  const handleLockPosition = (index: number) => {
    dispatch(lockerActions.lockPosition({ index, network: currentNetwork }))
  }

  const handleClosePosition = (index: number) => {
    dispatch(
      actions.closePosition({
        positionIndex: index,
        onSuccess: () => {
          navigate(ROUTES.PORTFOLIO)
        }
      })
    )
  }

  const handleClaimFee = (index: number, isLocked: boolean) => {
    dispatch(actions.claimFee({ index, isLocked }))
  }

  const data: IPositionItem[] = useMemo(
    () =>
      list.map(position => {
        const lowerPrice = calcYPerXPriceBySqrtPrice(
          calculatePriceSqrt(position.lowerTickIndex),
          position.tokenX.decimals,
          position.tokenY.decimals
        )
        const upperPrice = calcYPerXPriceBySqrtPrice(
          calculatePriceSqrt(position.upperTickIndex),
          position.tokenX.decimals,
          position.tokenY.decimals
        )

        const minTick = getMinTick(position.poolData.tickSpacing)
        const maxTick = getMaxTick(position.poolData.tickSpacing)

        const min = Math.min(lowerPrice, upperPrice)
        const max = Math.max(lowerPrice, upperPrice)

        let tokenXLiq, tokenYLiq

        try {
          tokenXLiq = +printBN(
            getX(
              position.liquidity,
              calculatePriceSqrt(position.upperTickIndex),
              position.poolData.sqrtPrice,
              calculatePriceSqrt(position.lowerTickIndex)
            ),
            position.tokenX.decimals
          )
        } catch {
          tokenXLiq = 0
        }

        try {
          tokenYLiq = +printBN(
            getY(
              position.liquidity,
              calculatePriceSqrt(position.upperTickIndex),
              position.poolData.sqrtPrice,
              calculatePriceSqrt(position.lowerTickIndex)
            ),
            position.tokenY.decimals
          )
        } catch {
          tokenYLiq = 0
        }

        const currentPrice = calcYPerXPriceBySqrtPrice(
          position.poolData.sqrtPrice,
          position.tokenX.decimals,
          position.tokenY.decimals
        )

        const valueX = tokenXLiq + tokenYLiq / currentPrice
        const valueY = tokenYLiq + tokenXLiq * currentPrice

        return {
          tokenXName: position.tokenX.symbol,
          tokenYName: position.tokenY.symbol,
          tokenXIcon: position.tokenX.logoURI,
          tokenYIcon: position.tokenY.logoURI,
          poolAddress: position.poolData.address,
          liquidity: position.liquidity,
          poolData: position.poolData,
          fee: +printBN(position.poolData.fee, DECIMAL - 2),
          min,
          max,
          position,
          valueX,
          valueY,
          address: walletAddress.toString(),
          id: position.id.toString() + '_' + position.pool.toString(),
          isActive: currentPrice >= min && currentPrice <= max,
          currentPrice,
          tokenXLiq,
          tokenYLiq,
          network: currentNetwork,
          isFullRange: position.lowerTickIndex === minTick && position.upperTickIndex === maxTick,
          isLocked: position.isLocked
        }
      }),
    [list]
  )

  const lockedData: IPositionItem[] = useMemo(
    () =>
      lockedList.map(position => {
        const lowerPrice = calcYPerXPriceBySqrtPrice(
          calculatePriceSqrt(position.lowerTickIndex),
          position.tokenX.decimals,
          position.tokenY.decimals
        )
        const upperPrice = calcYPerXPriceBySqrtPrice(
          calculatePriceSqrt(position.upperTickIndex),
          position.tokenX.decimals,
          position.tokenY.decimals
        )

        const minTick = getMinTick(position.poolData.tickSpacing)
        const maxTick = getMaxTick(position.poolData.tickSpacing)

        const min = Math.min(lowerPrice, upperPrice)
        const max = Math.max(lowerPrice, upperPrice)

        let tokenXLiq, tokenYLiq

        try {
          tokenXLiq = +printBN(
            getX(
              position.liquidity,
              calculatePriceSqrt(position.upperTickIndex),
              position.poolData.sqrtPrice,
              calculatePriceSqrt(position.lowerTickIndex)
            ),
            position.tokenX.decimals
          )
        } catch {
          tokenXLiq = 0
        }

        try {
          tokenYLiq = +printBN(
            getY(
              position.liquidity,
              calculatePriceSqrt(position.upperTickIndex),
              position.poolData.sqrtPrice,
              calculatePriceSqrt(position.lowerTickIndex)
            ),
            position.tokenY.decimals
          )
        } catch {
          tokenYLiq = 0
        }

        const currentPrice = calcYPerXPriceBySqrtPrice(
          position.poolData.sqrtPrice,
          position.tokenX.decimals,
          position.tokenY.decimals
        )

        const valueX = tokenXLiq + tokenYLiq / currentPrice
        const valueY = tokenYLiq + tokenXLiq * currentPrice

        return {
          tokenXName: position.tokenX.symbol,
          tokenYName: position.tokenY.symbol,
          tokenXIcon: position.tokenX.logoURI,
          tokenYIcon: position.tokenY.logoURI,
          fee: +printBN(position.poolData.fee, DECIMAL - 2),
          min,
          max,
          valueX,
          position,
          valueY,
          poolAddress: position.poolData.address,
          liquidity: position.liquidity,
          poolData: position.poolData,
          address: walletAddress.toString(),
          id: position.id.toString() + '_' + position.pool.toString(),
          isActive: currentPrice >= min && currentPrice <= max,
          currentPrice,
          tokenXLiq,
          tokenYLiq,
          network: currentNetwork,
          isFullRange: position.lowerTickIndex === minTick && position.upperTickIndex === maxTick,
          isLocked: position.isLocked
        }
      }),
    [lockedList]
  )

  return (
    <PositionsList
      initialPage={lastPage}
      setLastPage={setLastPage}
      handleRefresh={handleRefresh}
      onAddPositionClick={() => {
        navigate(ROUTES.NEW_POSITION)
      }}
      currentNetwork={currentNetwork}
      data={data}
      lockedData={lockedData}
      loading={isLoading}
      showNoConnected={walletStatus !== Status.Initialized}
      itemsPerPage={POSITIONS_PER_PAGE}
      noConnectedBlockerProps={{
        onConnect: () => {
          dispatch(walletActions.connect(false))
        },
        title: 'Start exploring liquidity pools right now!',
        descCustomText: 'Or, connect your wallet to see existing positions, and create a new one!'
      }}
      length={list.length}
      lockedLength={lockedList.length}
      noInitialPositions={list.length === 0 && lockedList.length === 0}
      handleLockPosition={handleLockPosition}
      handleClosePosition={handleClosePosition}
      handleClaimFee={handleClaimFee}
    />
  )
}

export default WrappedPositionsList
