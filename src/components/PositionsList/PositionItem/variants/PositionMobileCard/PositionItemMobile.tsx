import { Box, Button, Grid, Skeleton, Typography } from '@mui/material'
import SwapList from '@static/svg/swap-list.svg'
import { formatNumberWithSuffix } from '@utils/utils'
import classNames from 'classnames'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMobileStyles } from './style/mobile'
import { TooltipHover } from '@components/TooltipHover/TooltipHover'
import { initialXtoY, tickerToAddress } from '@utils/utils'
import { IPositionItem } from '@components/PositionsList/types'
import { useSharedStyles } from './style/shared'
import { useSelector } from 'react-redux'
import { useUnclaimedFee } from '@store/hooks/positionList/useUnclaimedFee'
import { singlePositionData } from '@store/selectors/positions'
import { MinMaxChart } from '../../components/MinMaxChart/MinMaxChart'
import { blurContent, unblurContent } from '@utils/uiUtils'
import PositionViewActionPopover from '@components/Modals/PositionViewActionPopover/PositionViewActionPopover'
import LockLiquidityModal from '@components/Modals/LockLiquidityModal/LockLiquidityModal'
import { ILiquidityToken } from '@components/PositionDetails/SinglePositionInfo/consts'
import { lockerState } from '@store/selectors/locker'
import { ISinglePositionData } from '@components/OverviewYourPositions/components/Overview/Overview'
import { TooltipGradient } from '@components/TooltipHover/TooltipGradient'

interface IPositionItemMobile extends IPositionItem {
  setAllowPropagation: React.Dispatch<React.SetStateAction<boolean>>
  handleLockPosition: (index: number) => void
  handleClosePosition: (index: number) => void
  handleClaimFee: (index: number, isLocked: boolean) => void
}

export const PositionItemMobile: React.FC<IPositionItemMobile> = ({
  tokenXName,
  tokenYName,
  tokenXIcon,
  tokenYIcon,
  fee,
  min,
  max,
  position,
  id,
  setAllowPropagation,
  isActive = false,
  currentPrice,
  tokenXLiq,
  tokenYLiq,
  network,
  handleLockPosition,
  handleClosePosition,
  handleClaimFee
}) => {
  const { classes } = useMobileStyles()
  const { classes: sharedClasses } = useSharedStyles()
  const airdropIconRef = useRef<any>(null)
  const positionSingleData: ISinglePositionData | undefined = useSelector(
    singlePositionData(id ?? '')
  )

  const [isLockPositionModalOpen, setIsLockPositionModalOpen] = useState(false)

  useEffect(() => {
    if (isLockPositionModalOpen) {
      blurContent()
    } else {
      unblurContent()
    }
  }, [isLockPositionModalOpen])

  useEffect(() => {
    const PROPAGATION_ALLOW_TIME = 500

    const handleClickOutside = (event: MouseEvent) => {
      const isClickInAirdropIcon =
        airdropIconRef.current &&
        (airdropIconRef.current as HTMLElement).contains(event.target as Node)

      if (!isClickInAirdropIcon) {
        setTimeout(() => {
          setAllowPropagation(true)
        }, PROPAGATION_ALLOW_TIME)
      }
    }

    if (isLockPositionModalOpen) {
      document.addEventListener('click', handleClickOutside)
    } else {
      document.removeEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isLockPositionModalOpen])

  useEffect(() => {
    setAllowPropagation(!isLockPositionModalOpen)
  }, [isLockPositionModalOpen])

  const [xToY, setXToY] = useState<boolean>(
    initialXtoY(tickerToAddress(network, tokenXName), tickerToAddress(network, tokenYName))
  )

  const [isActionPopoverOpen, setActionPopoverOpen] = useState<boolean>(false)

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setActionPopoverOpen(true)
  }

  const handleClose = () => {
    unblurContent()
    setActionPopoverOpen(false)
  }

  const { tokenValueInUsd, tokenXPercentage, tokenYPercentage, unclaimedFeesInUSD } =
    useUnclaimedFee({
      currentPrice,
      id,
      position,
      tokenXLiq,
      tokenYLiq,
      positionSingleData,
      xToY
    })

  const topSection = useMemo(
    () => (
      <Grid container sx={{ width: '100%', marginBottom: 2 }}>
        <Grid item xs={5}>
          <TooltipGradient
            title={
              isActive ? (
                <>
                  The position is <b>active</b> and currently <b>earning a fee</b>
                </>
              ) : (
                <>
                  The position is <b>inactive</b> and <b>not earning a fee</b>
                </>
              )
            }
            placement='top'
            top={1}
            noGradient>
            <Grid
              container
              className={classNames(
                sharedClasses.fee,
                isActive ? sharedClasses.activeFee : undefined
              )}
              justifyContent='center'
              alignItems='center'
              onClick={e => e.stopPropagation()}>
              <Typography
                className={classNames(
                  sharedClasses.infoText,
                  isActive ? sharedClasses.activeInfoText : undefined
                )}>
                {fee}% fee
              </Typography>
            </Grid>
          </TooltipGradient>
        </Grid>

        <Grid item xs={7} paddingLeft={'16px'}>
          {unclaimedFeesInUSD.loading ? (
            <Skeleton
              variant='rectangular'
              width='100%'
              height={36}
              sx={{ borderRadius: '10px' }}
            />
          ) : (
            <Grid
              container
              justifyContent='center'
              alignItems='center'
              className={sharedClasses.fee}
              sx={{ width: '100%' }}>
              <Box className={sharedClasses.unclaimedFeeContainer}>
                <Typography className={sharedClasses.infoText}>Unclaimed Fee</Typography>
                <Typography className={sharedClasses.greenText}>
                  ${formatNumberWithSuffix(unclaimedFeesInUSD.value.toFixed(2))}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Grid>
    ),
    [fee, isActive, unclaimedFeesInUSD]
  )

  const middleSection = useMemo(
    () => (
      <Grid container spacing={2} sx={{ marginBottom: 2 }}>
        <Grid item xs={6}>
          {tokenValueInUsd.loading ? (
            <Skeleton
              variant='rectangular'
              width='100%'
              height={36}
              sx={{ borderRadius: '10px' }}
            />
          ) : (
            <Grid
              container
              className={sharedClasses.value}
              alignItems='center'
              justifyContent='center'>
              <Box gap={'8px'} display={'flex'} alignItems={'center'}>
                <Typography className={sharedClasses.infoText}>Value</Typography>
                <Typography className={sharedClasses.greenText}>
                  ${formatNumberWithSuffix(tokenValueInUsd.value)}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Grid item xs={6}>
          <Grid
            container
            alignItems='center'
            className={sharedClasses.value}
            justifyContent='center'>
            <Typography className={sharedClasses.infoText}>
              {tokenXPercentage === 100 && (
                <span>
                  {tokenXPercentage}% {xToY ? tokenXName : tokenYName}
                </span>
              )}
              {tokenYPercentage === 100 && (
                <span>
                  {tokenYPercentage}% {xToY ? tokenYName : tokenXName}
                </span>
              )}
              {tokenYPercentage !== 100 && tokenXPercentage !== 100 && (
                <span>
                  {tokenXPercentage}% {xToY ? tokenXName : tokenYName} - {tokenYPercentage}%{' '}
                  {xToY ? tokenYName : tokenXName}
                </span>
              )}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    ),
    [tokenValueInUsd, tokenXPercentage, tokenYPercentage, xToY]
  )

  const chartSection = useMemo(
    () => (
      <Grid container justifyContent='center' margin={'0 auto'} width={'80%'}>
        <MinMaxChart
          min={Number(xToY ? min : 1 / max)}
          max={Number(xToY ? max : 1 / min)}
          current={
            xToY ? currentPrice : currentPrice !== 0 ? 1 / currentPrice : Number.MAX_SAFE_INTEGER
          }
        />
      </Grid>
    ),
    [min, max, currentPrice, xToY]
  )

  const { value, tokenXLabel, tokenYLabel } = useMemo<{
    value: string
    tokenXLabel: string
    tokenYLabel: string
  }>(() => {
    const valueX = tokenXLiq + tokenYLiq / currentPrice
    const valueY = tokenYLiq + tokenXLiq * currentPrice
    return {
      value: `${formatNumberWithSuffix(xToY ? valueX : valueY)} ${xToY ? tokenXName : tokenYName}`,
      tokenXLabel: xToY ? tokenXName : tokenYName,
      tokenYLabel: xToY ? tokenYName : tokenXName
    }
  }, [min, max, currentPrice, tokenXName, tokenYName, tokenXLiq, tokenYLiq, xToY])

  const { success, inProgress } = useSelector(lockerState)

  return (
    <Grid className={classes.root} container direction='column'>
      <LockLiquidityModal
        open={isLockPositionModalOpen}
        onClose={() => setIsLockPositionModalOpen(false)}
        xToY={xToY}
        tokenX={{ name: tokenXName, icon: tokenXIcon, liqValue: tokenXLiq } as ILiquidityToken}
        tokenY={{ name: tokenYName, icon: tokenYIcon, liqValue: tokenYLiq } as ILiquidityToken}
        onLock={() => handleLockPosition(positionSingleData?.positionIndex ?? 0)}
        fee={`${fee}% fee`}
        minMax={`${formatNumberWithSuffix(xToY ? min : 1 / max)}-${formatNumberWithSuffix(xToY ? max : 1 / min)} ${tokenYLabel} per ${tokenXLabel}`}
        value={value}
        isActive={isActive}
        swapHandler={() => setXToY(!xToY)}
        success={success}
        inProgress={inProgress}
      />
      <PositionViewActionPopover
        anchorEl={anchorEl}
        handleClose={handleClose}
        open={isActionPopoverOpen}
        isLocked={positionSingleData?.isLocked ?? false}
        unclaimedFeesInUSD={unclaimedFeesInUSD.value}
        claimFee={() =>
          handleClaimFee(
            positionSingleData?.positionIndex ?? 0,
            positionSingleData?.isLocked ?? false
          )
        }
        closePosition={() => handleClosePosition(positionSingleData?.positionIndex ?? 0)}
        onLockPosition={() => setIsLockPositionModalOpen(true)}
      />
      <Grid
        container
        item
        className={classes.mdTop}
        direction='row'
        wrap='nowrap'
        sx={{ marginBottom: 2 }}>
        <Grid
          container
          item
          className={classes.iconsAndNames}
          alignItems='center'
          justifyContent={'space-between'}
          wrap='nowrap'>
          <Box display='flex' alignItems={'center'}>
            <Grid container item className={sharedClasses.icons} alignItems='center' wrap='nowrap'>
              <img
                className={sharedClasses.tokenIcon}
                src={xToY ? tokenXIcon : tokenYIcon}
                alt={xToY ? tokenXName : tokenYName}
              />
              <TooltipHover title='Reverse tokens'>
                <img
                  className={sharedClasses.arrows}
                  src={SwapList}
                  alt='Arrow'
                  onClick={e => {
                    e.stopPropagation()
                    setXToY(!xToY)
                  }}
                />
              </TooltipHover>
              <img
                className={sharedClasses.tokenIcon}
                src={xToY ? tokenYIcon : tokenXIcon}
                alt={xToY ? tokenYName : tokenXName}
              />
            </Grid>
            <Typography className={sharedClasses.names}>
              {xToY ? tokenXName : tokenYName} - {xToY ? tokenYName : tokenXName}
            </Typography>
          </Box>

          <Box ref={airdropIconRef} className={sharedClasses.actionButtonContainer}>
            <Button
              className={classes.button}
              onClick={e => {
                e.stopPropagation()
                handleClick(e)
              }}>
              ...
            </Button>
          </Box>
        </Grid>
      </Grid>

      {topSection}
      {middleSection}
      {chartSection}
    </Grid>
  )
}
