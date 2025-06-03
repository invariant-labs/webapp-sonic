import { Box, Typography, useMediaQuery } from '@mui/material'
import { useStyles } from './style'
import { TooltipHover } from '@common/TooltipHover/TooltipHover'
import { backArrowIcon, newTabIcon } from '@static/icons'
import { theme } from '@static/theme'
import MarketIdLabel from '@components/NewPosition/MarketIdLabel/MarketIdLabel'
import { VariantType } from 'notistack'
import Refresher from '@common/Refresher/Refresher'
import { REFRESHER_INTERVAL } from '@store/consts/static'
import { useEffect, useMemo, useState } from 'react'
import { ROUTES, truncateString } from '@utils/utils'
import { LockButton } from './LockButton'
import { Button } from '@common/Button/Button'
import { INavigatePosition } from '@store/consts/types'
import { MobileNavigation } from '../Navigation/MobileNavigation/MobileNavigation'
import { useNavigate } from 'react-router-dom'
import { ReverseTokensIcon } from '@static/componentIcon/ReverseTokensIcon'

type Props = {
  tokenA: {
    icon: string
    ticker: string
  }
  tokenB: {
    icon: string
    ticker: string
  }
  fee: number
  hasEnoughSOL: boolean
  hasFees: boolean
  poolAddress: string
  networkUrl: string
  isLocked: boolean
  isActive: boolean
  onReverseTokensClick: () => void
  onClosePositionClick: () => void
  onAddPositionClick: () => void
  onRefreshClick: () => void
  onGoBackClick: () => void
  onLockClick: () => void
  copyPoolAddressHandler: (message: string, variant: VariantType) => void
  isPreview: boolean
  isClosing: boolean
  previousPosition: INavigatePosition | null
  nextPosition: INavigatePosition | null
}

export const PositionHeader = ({
  tokenA,
  tokenB,
  fee,
  hasEnoughSOL,
  hasFees,
  poolAddress,
  networkUrl,
  isLocked,
  isActive,
  onReverseTokensClick,
  onClosePositionClick,
  onAddPositionClick,
  onRefreshClick,
  onGoBackClick,
  onLockClick,
  copyPoolAddressHandler,
  isPreview,
  isClosing,
  previousPosition,
  nextPosition
}: Props) => {
  const { classes, cx } = useStyles()
  const isSmDown = useMediaQuery(theme.breakpoints.down(688))
  const isMdDown = useMediaQuery(theme.breakpoints.down(1040))
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'))
  const [refresherTime, setRefresherTime] = useState(REFRESHER_INTERVAL)

  const navigate = useNavigate()

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (refresherTime > 0) {
        setRefresherTime(refresherTime - 1)
      } else {
        onRefreshClick()
        setRefresherTime(REFRESHER_INTERVAL)
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [refresherTime])

  const closeButtonTitle = useMemo(() => {
    if (isPreview) {
      return 'Closing positions is disabled in preview'
    }
    if (isLocked) {
      return 'Closing positions is disabled when position is locked'
    }
    if (!hasEnoughSOL) {
      return 'Insufficient SOL to close position'
    }
    if (hasFees) {
      return 'Unclaimed fees will be returned when closing the position'
    }
    return ''
  }, [isPreview, isLocked, hasEnoughSOL, hasFees])

  const closeButton = closeButtonTitle ? (
    <TooltipHover title={closeButtonTitle}>
      <Button
        height={40}
        scheme='green'
        disabled={isLocked || !hasEnoughSOL || isPreview || isClosing}
        variant='contained'
        onClick={() => onClosePositionClick()}>
        Close position
      </Button>
    </TooltipHover>
  ) : (
    <Button
      height={40}
      scheme='green'
      disabled={isLocked || !hasEnoughSOL || isPreview || isClosing}
      variant='contained'
      onClick={() => onClosePositionClick()}>
      Close position
    </Button>
  )

  const addButton = (
    <TooltipHover title='Add more liquidity to this pool' fullSpan={isSmDown}>
      <Button scheme='pink' variant='contained' onClick={() => onAddPositionClick()} width='100%'>
        + Add position
      </Button>
    </TooltipHover>
  )

  const marketIdLabel = (
    <Box className={classes.marketIdLabelContainer}>
      <MarketIdLabel
        marketId={poolAddress}
        displayLength={5}
        copyPoolAddressHandler={copyPoolAddressHandler}
      />
      <TooltipHover title='Open pool in explorer'>
        <a
          href={`https://explorer.sonic.game/address/${poolAddress.toString()}${networkUrl}`}
          target='_blank'
          rel='noopener noreferrer'>
          <img className={classes.explorerLink} src={newTabIcon} alt='Explorer link' />
        </a>
      </TooltipHover>
    </Box>
  )

  const refresher = (
    <TooltipHover title='Refresh'>
      <Box>
        <Refresher
          currentIndex={refresherTime}
          maxIndex={REFRESHER_INTERVAL}
          onClick={() => {
            onRefreshClick()
            setRefresherTime(REFRESHER_INTERVAL)
          }}
        />
      </Box>
    </TooltipHover>
  )

  return (
    <Box className={classes.headerContainer}>
      <Box className={classes.navigation}>
        <Box className={cx(classes.wrapper, classes.backContainer)} onClick={() => onGoBackClick()}>
          <img src={backArrowIcon} alt='Back arrow' />
          <Typography className={classes.backText}>Back to portfolio</Typography>
        </Box>
        {isMdDown && (
          <Box className={classes.navigationSide}>
            {marketIdLabel} {refresher}
          </Box>
        )}
        {!isMdDown && isLgDown && (previousPosition || nextPosition) && (
          <Box className={classes.tabletNavigation}>
            <MobileNavigation
              position={previousPosition}
              direction='left'
              onClick={() => {
                if (previousPosition) {
                  navigate(ROUTES.getPositionRoute(previousPosition.id))
                }
              }}
            />
            <MobileNavigation
              position={nextPosition}
              direction='right'
              onClick={() => {
                if (nextPosition) {
                  navigate(ROUTES.getPositionRoute(nextPosition.id))
                }
              }}
            />
          </Box>
        )}
      </Box>
      {isMdDown && (previousPosition || nextPosition) && (
        <Box display='flex' gap={1}>
          <MobileNavigation
            position={previousPosition}
            direction='left'
            onClick={() => {
              if (previousPosition) {
                navigate(ROUTES.getPositionRoute(previousPosition.id))
              }
            }}
          />
          <MobileNavigation
            position={nextPosition}
            direction='right'
            onClick={() => {
              if (nextPosition) {
                navigate(ROUTES.getPositionRoute(nextPosition.id))
              }
            }}
          />
        </Box>
      )}
      <Box className={classes.container}>
        <Box className={classes.upperContainer}>
          <Box className={classes.wrapper}>
            <Box className={classes.iconContainer}>
              <img className={classes.icon} src={tokenA.icon} alt={tokenA.ticker} />
              <TooltipHover title='Reverse tokens'>
                <ReverseTokensIcon
                  className={classes.reverseTokensIcon}
                  onClick={() => onReverseTokensClick()}
                />
              </TooltipHover>
              <img className={classes.icon} src={tokenB.icon} alt={tokenB.ticker} />
            </Box>
            <TooltipHover
              title={
                tokenA.ticker.length > 4 || tokenB.ticker.length > 4
                  ? tokenA.ticker + ' - ' + tokenB.ticker
                  : ''
              }>
              <Typography className={classes.tickerContainer}>
                {truncateString(tokenA.ticker, 3)} - {truncateString(tokenB.ticker, 3)}
              </Typography>
            </TooltipHover>
          </Box>
          <Box className={classes.wrapper}>
            <TooltipHover
              title={
                isActive ? (
                  <>
                    The position is <b>active</b> and <b>earning a fee</b> as long as the current
                    price is <b>within</b> the position's price range.
                  </>
                ) : (
                  <>
                    The position is <b>inactive</b> and <b>not earning a fee</b> as long as the
                    current price is <b>outside</b> the position's price range.
                  </>
                )
              }
              placement='top'
              increasePadding>
              <Box
                className={cx(classes.feeContainer, {
                  [classes.feeContainerIsActive]: isActive
                })}>
                {fee.toFixed(2)}%
              </Box>
            </TooltipHover>
            {!isSmDown && closeButton}
            {!isSmDown && isMdDown && (
              <>
                {addButton}
                <LockButton
                  isClosing={isClosing}
                  isLocked={isLocked}
                  isPreview={isPreview}
                  onLockClick={onLockClick}
                />
              </>
            )}
          </Box>
        </Box>
        {(isSmDown || !isMdDown) && (
          <Box className={classes.lowerContainer}>
            {!isMdDown ? (
              <>
                {marketIdLabel}
                <Box className={classes.wrapper}>
                  {refresher} {addButton}
                  <LockButton
                    isLocked={isLocked}
                    isClosing={isClosing}
                    isPreview={isPreview}
                    onLockClick={onLockClick}
                  />
                </Box>
              </>
            ) : (
              <>
                {closeButton}
                <Box display={'flex'} flexGrow={1}>
                  {addButton}
                </Box>
                <LockButton
                  isClosing={isClosing}
                  isLocked={isLocked}
                  isPreview={isPreview}
                  onLockClick={onLockClick}
                />
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
