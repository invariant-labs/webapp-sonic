import AnimatedButton, { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import ChangeWalletButton from '@components/Header/HeaderButton/ChangeWalletButton'
import ExchangeAmountInput from '@components/Inputs/ExchangeAmountInput/ExchangeAmountInput'
import Slippage from '@components/Modals/Slippage/Slippage'
import Refresher from '@components/Refresher/Refresher'
import { BN } from '@coral-xyz/anchor'
import { Box, Button, Grid, Typography } from '@mui/material'
import refreshIcon from '@static/svg/refresh.svg'
import settingIcon from '@static/svg/settings.svg'
import SwapArrows from '@static/svg/swap-arrows.svg'
import {
  DEFAULT_TOKEN_DECIMAL,
  NetworkType,
  REFRESHER_INTERVAL,
  WSOL_MIN_DEPOSIT_SWAP_FROM_AMOUNT_MAIN,
  WSOL_MIN_DEPOSIT_SWAP_FROM_AMOUNT_TEST,
  WRAPPED_SOL_ADDRESS
} from '@store/consts/static'
import {
  addressToTicker,
  convertBalanceToBN,
  findPairs,
  handleSimulate,
  printBN,
  ROUTES,
  trimLeadingZeros
} from '@utils/utils'
import { Swap as SwapData } from '@store/reducers/swap'
import { Status } from '@store/reducers/solanaWallet'
import { SwapToken } from '@store/selectors/solanaWallet'
import { blurContent, createButtonActions, unblurContent } from '@utils/uiUtils'
import classNames from 'classnames'
import React, { useEffect, useMemo, useRef } from 'react'
import ExchangeRate from './ExchangeRate/ExchangeRate'
import TransactionDetailsBox from './TransactionDetailsBox/TransactionDetailsBox'
import useStyles from './style'
import { TokenPriceData } from '@store/consts/types'
import TokensInfo from './TokensInfo/TokensInfo'
import { VariantType } from 'notistack'
import { TooltipHover } from '@components/TooltipHover/TooltipHover'
import { DECIMAL, fromFee, SimulationStatus } from '@invariant-labs/sdk-sonic/lib/utils'
import { PoolWithAddress } from '@store/reducers/pools'
import { PublicKey } from '@solana/web3.js'
import { Tick, Tickmap } from '@invariant-labs/sdk-sonic/lib/market'
import icons from '@static/icons'
import { useNavigate } from 'react-router-dom'

export interface Pools {
  tokenX: PublicKey
  tokenY: PublicKey
  tokenXReserve: PublicKey
  tokenYReserve: PublicKey
  tickSpacing: number
  sqrtPrice: {
    v: BN
    scale: number
  }
  fee: {
    val: BN
    scale: number
  }
  exchangeRate: {
    val: BN
    scale: number
  }
}

export interface ISwap {
  isFetchingNewPool: boolean
  onRefresh: (tokenFrom: number | null, tokenTo: number | null) => void
  walletStatus: Status
  swapData: SwapData
  tokens: SwapToken[]
  pools: PoolWithAddress[]
  tickmap: { [x: string]: Tickmap }
  onSwap: (
    slippage: BN,
    knownPrice: BN,
    tokenFrom: PublicKey,
    tokenTo: PublicKey,
    poolIndex: number,
    amountIn: BN,
    amountOut: BN,
    byAmountIn: boolean
  ) => void
  onSetPair: (tokenFrom: PublicKey | null, tokenTo: PublicKey | null) => void
  progress: ProgressState
  poolTicks: { [x: string]: Tick[] }
  isWaitingForNewPool: boolean
  onConnectWallet: () => void
  onDisconnectWallet: () => void
  initialTokenFromIndex: number | null
  initialTokenToIndex: number | null
  handleAddToken: (address: string) => void
  commonTokens: PublicKey[]
  initialHideUnknownTokensValue: boolean
  onHideUnknownTokensChange: (val: boolean) => void
  tokenFromPriceData?: TokenPriceData
  tokenToPriceData?: TokenPriceData
  priceFromLoading?: boolean
  priceToLoading?: boolean
  onSlippageChange: (slippage: string) => void
  initialSlippage: string
  isBalanceLoading: boolean
  copyTokenAddressHandler: (message: string, variant: VariantType) => void
  network: NetworkType
  ethBalance: BN
  unwrapWSOL: () => void
  wrappedETHAccountExist: boolean
  isTimeoutError: boolean
  deleteTimeoutError: () => void
  canNavigate: boolean
}

export const Swap: React.FC<ISwap> = ({
  isFetchingNewPool,
  onRefresh,
  walletStatus,
  tokens,
  pools,
  tickmap,
  onSwap,
  onSetPair,
  progress,
  poolTicks,
  isWaitingForNewPool,
  onConnectWallet,
  onDisconnectWallet,
  initialTokenFromIndex,
  initialTokenToIndex,
  handleAddToken,
  commonTokens,
  initialHideUnknownTokensValue,
  onHideUnknownTokensChange,
  tokenFromPriceData,
  tokenToPriceData,
  priceFromLoading,
  priceToLoading,
  onSlippageChange,
  initialSlippage,
  isBalanceLoading,
  copyTokenAddressHandler,
  network,
  ethBalance,
  unwrapWSOL,
  wrappedETHAccountExist,
  isTimeoutError,
  deleteTimeoutError,
  canNavigate
}) => {
  const { classes } = useStyles()
  enum inputTarget {
    DEFAULT = 'default',
    FROM = 'from',
    TO = 'to'
  }
  const [tokenFromIndex, setTokenFromIndex] = React.useState<number | null>(null)
  const [tokenToIndex, setTokenToIndex] = React.useState<number | null>(null)
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const [lockAnimation, setLockAnimation] = React.useState<boolean>(false)
  const [amountFrom, setAmountFrom] = React.useState<string>('')
  const [amountTo, setAmountTo] = React.useState<string>('')
  const [swap, setSwap] = React.useState<boolean | null>(null)
  const [rotates, setRotates] = React.useState<number>(0)
  const [slippTolerance, setSlippTolerance] = React.useState<string>(initialSlippage)
  const [throttle, setThrottle] = React.useState<boolean>(false)
  const [settings, setSettings] = React.useState<boolean>(false)
  const [detailsOpen, setDetailsOpen] = React.useState<boolean>(false)
  const [inputRef, setInputRef] = React.useState<string>(inputTarget.DEFAULT)
  const [rateReversed, setRateReversed] = React.useState<boolean>(false)
  const [refresherTime, setRefresherTime] = React.useState<number>(REFRESHER_INTERVAL)
  const [hideUnknownTokens, setHideUnknownTokens] = React.useState<boolean>(
    initialHideUnknownTokensValue
  )
  const [simulateResult, setSimulateResult] = React.useState<{
    amountOut: BN
    poolIndex: number
    AmountOutWithFee: BN
    estimatedPriceAfterSwap: BN
    // minimumReceived: BN
    priceImpact: BN
    error: string[]
  }>({
    amountOut: new BN(0),
    poolIndex: 0,
    AmountOutWithFee: new BN(0),
    estimatedPriceAfterSwap: new BN(0),
    // minimumReceived: new BN(0),
    priceImpact: new BN(0),
    error: []
  })

  const WSOL_MIN_DEPOSIT_SWAP_FROM_AMOUNT = useMemo(() => {
    if (network === NetworkType.Testnet) {
      return WSOL_MIN_DEPOSIT_SWAP_FROM_AMOUNT_TEST
    } else {
      return WSOL_MIN_DEPOSIT_SWAP_FROM_AMOUNT_MAIN
    }
  }, [network])

  const timeoutRef = useRef<number>(0)

  const navigate = useNavigate()

  useEffect(() => {
    if (isTimeoutError) {
      onRefresh(tokenFromIndex, tokenToIndex)
      deleteTimeoutError()
    }
  }, [isTimeoutError])

  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!tokens.length) return
    if (tokenFromIndex === null || tokenToIndex === null) return
    if (!tokens[tokenFromIndex] || !tokens[tokenToIndex]) return

    clearTimeout(urlUpdateTimeoutRef.current)
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const fromTicker = addressToTicker(network, tokens[tokenFromIndex].assetAddress.toString())
      const toTicker = addressToTicker(network, tokens[tokenToIndex].assetAddress.toString())
      const newPath = ROUTES.getExchangeRoute(fromTicker, toTicker)

      if (newPath !== window.location.pathname && !newPath.includes('/-/')) {
        navigate(newPath, { replace: true })
      }
    }, 500)

    return () => clearTimeout(urlUpdateTimeoutRef.current)
  }, [tokenFromIndex, tokenToIndex, tokens.length, network])

  useEffect(() => {
    if (!!tokens.length && tokenFromIndex === null && tokenToIndex === null && canNavigate) {
      setTokenFromIndex(initialTokenFromIndex)
      setTokenToIndex(initialTokenToIndex)
    }
  }, [tokens.length, canNavigate, initialTokenFromIndex, initialTokenToIndex])

  useEffect(() => {
    onSetPair(
      tokenFromIndex === null ? null : tokens[tokenFromIndex].assetAddress,
      tokenToIndex === null ? null : tokens[tokenToIndex].assetAddress
    )
  }, [tokenFromIndex, tokenToIndex, pools.length])

  useEffect(() => {
    if (inputRef === inputTarget.FROM && !(amountFrom === '' && amountTo === '')) {
      simulateWithTimeout()
    }
  }, [
    amountFrom,
    tokenToIndex,
    tokenFromIndex,
    slippTolerance,
    Object.keys(poolTicks).length,
    Object.keys(tickmap).length
  ])

  useEffect(() => {
    if (inputRef === inputTarget.TO && !(amountFrom === '' && amountTo === '')) {
      simulateWithTimeout()
    }
  }, [
    amountTo,
    tokenToIndex,
    tokenFromIndex,
    slippTolerance,
    Object.keys(poolTicks).length,
    Object.keys(tickmap).length
  ])

  useEffect(() => {
    if (progress === 'none' && !(amountFrom === '' && amountTo === '')) {
      simulateWithTimeout()
    }
  }, [progress])

  const simulateWithTimeout = () => {
    setThrottle(true)

    clearTimeout(timeoutRef.current)
    const timeout = setTimeout(() => {
      setSimulateAmount().finally(() => {
        setThrottle(false)
      })
    }, 500)
    timeoutRef.current = timeout as unknown as number
  }

  useEffect(() => {
    if (tokenFromIndex !== null && tokenToIndex !== null) {
      if (inputRef === inputTarget.FROM) {
        const amount = getAmountOut(tokens[tokenToIndex])
        setAmountTo(+amount === 0 ? '' : trimLeadingZeros(amount))
      } else if (tokenFromIndex !== null) {
        const amount = getAmountOut(tokens[tokenFromIndex])
        setAmountFrom(+amount === 0 ? '' : trimLeadingZeros(amount))
      } else if (!tokens[tokenToIndex]) {
        setAmountTo('')
      } else if (!tokens[tokenFromIndex]) {
        setAmountFrom('')
      }
    }
  }, [simulateResult])

  useEffect(() => {
    updateEstimatedAmount()
  }, [tokenToIndex, tokenFromIndex, pools.length])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (refresherTime > 0 && tokenFromIndex !== null && tokenToIndex !== null) {
        setRefresherTime(refresherTime - 1)
      } else {
        handleRefresh()
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [refresherTime, tokenFromIndex, tokenToIndex])

  useEffect(() => {
    if (inputRef !== inputTarget.DEFAULT) {
      const temp: string = amountFrom
      setAmountFrom(amountTo)
      setAmountTo(temp)
      setInputRef(inputRef === inputTarget.FROM ? inputTarget.TO : inputTarget.FROM)
    }
  }, [swap])

  useEffect(() => {
    setRateReversed(false)
  }, [tokenFromIndex, tokenToIndex])

  const getAmountOut = (assetFor: SwapToken) => {
    const amountOut: number = Number(printBN(simulateResult.amountOut, assetFor.decimals))

    return amountOut.toFixed(assetFor.decimals)
  }

  const setSimulateAmount = async () => {
    if (tokenFromIndex !== null && tokenToIndex !== null) {
      const pair = findPairs(
        tokens[tokenFromIndex].assetAddress,
        tokens[tokenToIndex].assetAddress,
        pools
      )[0]
      if (typeof pair === 'undefined') {
        setAmountTo('')
        return
      }
      const indexPool = Object.keys(poolTicks).filter(key => {
        return key === pair.address.toString()
      })

      if (indexPool.length === 0) {
        setAmountTo('')
        return
      }

      if (inputRef === inputTarget.FROM) {
        await handleSimulate(
          pools,
          poolTicks,
          tickmap,
          fromFee(new BN(Number(+slippTolerance * 1000))),
          tokens[tokenFromIndex].assetAddress,
          tokens[tokenToIndex].assetAddress,
          convertBalanceToBN(amountFrom, tokens[tokenFromIndex].decimals),
          true
        ).then(value => setSimulateResult(value))
      } else if (inputRef === inputTarget.TO) {
        await handleSimulate(
          pools,
          poolTicks,
          tickmap,
          fromFee(new BN(Number(+slippTolerance * 1000))),
          tokens[tokenFromIndex].assetAddress,
          tokens[tokenToIndex].assetAddress,
          convertBalanceToBN(amountTo, tokens[tokenToIndex].decimals),
          false
        ).then(value => setSimulateResult(value))
      }
    }
  }

  const getIsXToY = (fromToken: PublicKey, toToken: PublicKey) => {
    const swapPool = pools.find(
      pool =>
        (fromToken.equals(pool.tokenX) && toToken.equals(pool.tokenY)) ||
        (fromToken.equals(pool.tokenY) && toToken.equals(pool.tokenX))
    )
    return !!swapPool
  }

  const updateEstimatedAmount = () => {
    if (tokenFromIndex !== null && tokenToIndex !== null) {
      const amount = getAmountOut(tokens[tokenToIndex])
      setAmountTo(+amount === 0 ? '' : trimLeadingZeros(amount))
    }
  }

  const isError = (error: string) => {
    return simulateResult.error.some(err => err === error)
  }

  const isEveryPoolEmpty = useMemo(() => {
    if (tokenFromIndex !== null && tokenToIndex !== null) {
      const pairs = findPairs(
        tokens[tokenFromIndex].assetAddress,
        tokens[tokenToIndex].assetAddress,
        pools
      )

      let poolEmptyCount = 0
      for (const pair of pairs) {
        if (
          poolTicks[pair.address.toString()] === undefined ||
          (poolTicks[pair.address.toString()] && !poolTicks[pair.address.toString()].length)
        ) {
          poolEmptyCount++
        }
      }
      return poolEmptyCount === pairs.length
    }

    return true
  }, [tokenFromIndex, tokenToIndex, poolTicks])

  const getStateMessage = () => {
    if (
      (tokenFromIndex !== null && tokenToIndex !== null && throttle) ||
      isWaitingForNewPool ||
      isError("TypeError: Cannot read properties of undefined (reading 'bitmap')")
    ) {
      return 'Loading'
    }

    if (walletStatus !== Status.Initialized) {
      return 'Connect a wallet'
    }

    if (tokenFromIndex === null || tokenToIndex === null) {
      return 'Select a token'
    }

    if (tokenFromIndex === tokenToIndex) {
      return 'Select different tokens'
    }

    if (!getIsXToY(tokens[tokenFromIndex].assetAddress, tokens[tokenToIndex].assetAddress)) {
      return "Pool doesn't exist."
    }

    if (
      isError(SimulationStatus.SwapStepLimitReached) ||
      isError(SimulationStatus.PriceLimitReached)
    ) {
      return 'Insufficient liquidity'
    }

    if (
      convertBalanceToBN(amountFrom, tokens[tokenFromIndex].decimals).gt(
        convertBalanceToBN(
          printBN(tokens[tokenFromIndex].balance, tokens[tokenFromIndex].decimals),
          tokens[tokenFromIndex].decimals
        )
      )
    ) {
      return 'Insufficient balance'
    }

    if (
      tokens[tokenFromIndex].assetAddress.toString() === WRAPPED_SOL_ADDRESS
        ? ethBalance.lt(
            convertBalanceToBN(amountFrom, tokens[tokenFromIndex].decimals).add(
              WSOL_MIN_DEPOSIT_SWAP_FROM_AMOUNT
            )
          )
        : ethBalance.lt(WSOL_MIN_DEPOSIT_SWAP_FROM_AMOUNT)
    ) {
      return `Insufficient Wrapped ETH`
    }

    if (
      convertBalanceToBN(amountFrom, tokens[tokenFromIndex].decimals).eqn(0) ||
      isError(SimulationStatus.NoGainSwap)
    ) {
      return 'Insufficient amount'
    }

    if (!isEveryPoolEmpty && amountTo === '') {
      return 'Amount out is zero'
    }

    if (isEveryPoolEmpty) {
      return 'RPC connection error'
    }

    // Fallback error message
    if (simulateResult.error.length !== 0) {
      console.warn('Errors not handled explictly', simulateResult.error)
      return 'Not enough liquidity'
    }

    return 'Exchange'
  }
  const hasShowRateMessage = () => {
    return (
      getStateMessage() === 'Insufficient balance' ||
      getStateMessage() === 'Exchange' ||
      getStateMessage() === 'Loading' ||
      getStateMessage() === 'Connect a wallet' ||
      getStateMessage() === 'Insufficient liquidity' ||
      getStateMessage() === 'Not enough liquidity' ||
      getStateMessage() === 'Insufficient Wrapped ETH'
    )
  }
  const setSlippage = (slippage: string): void => {
    setSlippTolerance(slippage)
    onSlippageChange(slippage)
  }

  const handleClickSettings = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setSettings(true)
  }

  const handleCloseSettings = () => {
    unblurContent()
    setSettings(false)
  }

  const handleOpenTransactionDetails = () => {
    setDetailsOpen(!detailsOpen)
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (lockAnimation) {
      timeoutId = setTimeout(() => setLockAnimation(false), 300)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [lockAnimation])

  const swapRate =
    tokenFromIndex === null || tokenToIndex === null || amountFrom === '' || amountTo === ''
      ? 0
      : +amountTo / +amountFrom

  const canShowDetails =
    tokenFromIndex !== null &&
    tokenToIndex !== null &&
    hasShowRateMessage() &&
    (getStateMessage() === 'Loading' ||
      (swapRate !== 0 && swapRate !== Infinity && !isNaN(swapRate))) &&
    amountFrom !== '' &&
    amountTo !== ''

  const handleRefresh = async () => {
    onRefresh(tokenFromIndex, tokenToIndex)
    setRefresherTime(REFRESHER_INTERVAL)
  }

  useEffect(() => {
    void setSimulateAmount()
  }, [isFetchingNewPool])

  useEffect(() => {
    setRefresherTime(REFRESHER_INTERVAL)

    if (tokenFromIndex === tokenToIndex) {
      setAmountFrom('')
      setAmountTo('')
    }
  }, [tokenFromIndex, tokenToIndex])

  const actions = createButtonActions({
    tokens,
    wrappedTokenAddress: WRAPPED_SOL_ADDRESS,
    minAmount: WSOL_MIN_DEPOSIT_SWAP_FROM_AMOUNT,
    onAmountSet: setAmountFrom,
    onSelectInput: () => setInputRef(inputTarget.FROM)
  })

  return (
    <Grid container className={classes.swapWrapper} alignItems='center'>
      {wrappedETHAccountExist && (
        <Box className={classes.unwrapContainer}>
          You have wrapped SOL.{' '}
          <u className={classes.unwrapNowButton} onClick={unwrapWSOL}>
            Unwrap now.
          </u>
        </Box>
      )}

      <Grid container className={classes.header}>
        <Box className={classes.leftSection}>
          <Typography component='h1' style={{ height: '27px' }}>
            Swap tokens
          </Typography>
        </Box>

        <Box className={classes.rightSection}>
          <Button className={classes.slippageButton} onClick={e => handleClickSettings(e)}>
            <p>
              Slippage: <span className={classes.slippageAmount}>{slippTolerance}%</span>
            </p>
          </Button>

          <Box className={classes.swapControls}>
            <TooltipHover title='Refresh'>
              <Grid display='flex' alignItems='center'>
                <Button
                  onClick={handleRefresh}
                  className={classes.refreshIconBtn}
                  disabled={
                    priceFromLoading ||
                    priceToLoading ||
                    isBalanceLoading ||
                    getStateMessage() === 'Loading' ||
                    tokenFromIndex === null ||
                    tokenToIndex === null ||
                    tokenFromIndex === tokenToIndex
                  }>
                  <img src={refreshIcon} className={classes.refreshIcon} alt='Refresh' />
                </Button>
              </Grid>
            </TooltipHover>
            <TooltipHover title='Settings'>
              <Button onClick={handleClickSettings} className={classes.settingsIconBtn}>
                <img src={settingIcon} className={classes.settingsIcon} alt='Settings' />
              </Button>
            </TooltipHover>
          </Box>
        </Box>

        <Grid className={classes.slippage}>
          <Slippage
            open={settings}
            setSlippage={setSlippage}
            handleClose={handleCloseSettings}
            anchorEl={anchorEl}
            initialSlippage={initialSlippage}
          />
        </Grid>
      </Grid>

      <Box className={classes.borderContainer}>
        <Grid container className={classes.root} direction='column'>
          <Typography className={classNames(classes.swapLabel)}>Pay</Typography>
          <Box
            className={classNames(
              classes.exchangeRoot,
              lockAnimation ? classes.amountInputDown : undefined
            )}>
            <ExchangeAmountInput
              value={amountFrom}
              balance={
                tokenFromIndex !== null && !!tokens[tokenFromIndex]
                  ? printBN(tokens[tokenFromIndex].balance, tokens[tokenFromIndex].decimals)
                  : '- -'
              }
              decimal={
                tokenFromIndex !== null ? tokens[tokenFromIndex].decimals : DEFAULT_TOKEN_DECIMAL
              }
              className={classes.amountInput}
              setValue={value => {
                if (value.match(/^\d*\.?\d*$/)) {
                  setAmountFrom(value)
                  setInputRef(inputTarget.FROM)
                }
              }}
              placeholder={`0.${'0'.repeat(6)}`}
              actionButtons={[
                {
                  label: 'Max',
                  variant: 'max',
                  onClick: () => {
                    actions.max(tokenFromIndex)
                  }
                },
                {
                  label: '50%',
                  variant: 'half',
                  onClick: () => {
                    actions.half(tokenFromIndex)
                  }
                }
              ]}
              tokens={tokens}
              current={tokenFromIndex !== null ? tokens[tokenFromIndex] : null}
              onSelect={setTokenFromIndex}
              disabled={tokenFromIndex === tokenToIndex || tokenFromIndex === null}
              hideBalances={walletStatus !== Status.Initialized}
              handleAddToken={handleAddToken}
              commonTokens={commonTokens}
              limit={1e14}
              initialHideUnknownTokensValue={initialHideUnknownTokensValue}
              onHideUnknownTokensChange={e => {
                onHideUnknownTokensChange(e)
                setHideUnknownTokens(e)
              }}
              tokenPrice={tokenFromPriceData?.price}
              priceLoading={priceFromLoading}
              isBalanceLoading={isBalanceLoading}
              showMaxButton={true}
              showBlur={
                lockAnimation ||
                (getStateMessage() === 'Loading' &&
                  (inputRef === inputTarget.TO || inputRef === inputTarget.DEFAULT))
              }
              hiddenUnknownTokens={hideUnknownTokens}
              network={network}
            />
          </Box>

          <Box className={classes.tokenComponentTextContainer}>
            <Box
              className={classes.swapArrowBox}
              onClick={() => {
                if (lockAnimation) return
                setLockAnimation(!lockAnimation)
                setRotates(rotates + 1)
                swap !== null ? setSwap(!swap) : setSwap(true)
                setTimeout(() => {
                  const tmpAmount = amountTo

                  const tmp = tokenFromIndex
                  setTokenFromIndex(tokenToIndex)
                  setTokenToIndex(tmp)

                  setInputRef(inputTarget.FROM)
                  setAmountFrom(tmpAmount)
                }, 50)
              }}>
              <Box className={classes.swapImgRoot}>
                <img
                  src={SwapArrows}
                  style={{
                    transform: `rotate(${-rotates * 180}deg)`
                  }}
                  className={classes.swapArrows}
                  alt='Invert tokens'
                />
              </Box>
            </Box>
          </Box>
          <Typography className={classes.swapLabel} mt={1.5}>
            Receive
          </Typography>
          <Box
            className={classNames(
              classes.exchangeRoot,
              classes.transactionBottom,
              lockAnimation ? classes.amountInputUp : undefined
            )}>
            <ExchangeAmountInput
              value={amountTo}
              balance={
                tokenToIndex !== null
                  ? printBN(tokens[tokenToIndex].balance, tokens[tokenToIndex].decimals)
                  : '- -'
              }
              className={classes.amountInput}
              decimal={
                tokenToIndex !== null ? tokens[tokenToIndex].decimals : DEFAULT_TOKEN_DECIMAL
              }
              setValue={value => {
                if (value.match(/^\d*\.?\d*$/)) {
                  setAmountTo(value)
                  setInputRef(inputTarget.TO)
                }
              }}
              placeholder={`0.${'0'.repeat(6)}`}
              actionButtons={[
                {
                  label: 'Max',
                  variant: 'max',
                  onClick: () => {
                    actions.max(tokenFromIndex)
                  }
                },
                {
                  label: '50%',
                  variant: 'half',
                  onClick: () => {
                    actions.half(tokenFromIndex)
                  }
                }
              ]}
              tokens={tokens}
              current={tokenToIndex !== null ? tokens[tokenToIndex] : null}
              onSelect={setTokenToIndex}
              disabled={tokenFromIndex === tokenToIndex || tokenToIndex === null}
              hideBalances={walletStatus !== Status.Initialized}
              handleAddToken={handleAddToken}
              commonTokens={commonTokens}
              limit={1e14}
              initialHideUnknownTokensValue={initialHideUnknownTokensValue}
              onHideUnknownTokensChange={e => {
                onHideUnknownTokensChange(e)
                setHideUnknownTokens(e)
              }}
              tokenPrice={tokenToPriceData?.price}
              priceLoading={priceToLoading}
              isBalanceLoading={isBalanceLoading}
              showMaxButton={false}
              showBlur={
                lockAnimation ||
                (getStateMessage() === 'Loading' &&
                  (inputRef === inputTarget.FROM || inputRef === inputTarget.DEFAULT))
              }
              hiddenUnknownTokens={hideUnknownTokens}
              network={network}
            />
          </Box>
          <Box className={classes.unknownWarningContainer}>
            {+printBN(simulateResult.priceImpact, DECIMAL - 2) > 5 && (
              <TooltipHover title='Your trade size might be too large'>
                <Box className={classes.unknownWarning}>
                  High price impact:{' '}
                  {(+printBN(simulateResult.priceImpact, DECIMAL - 2)).toFixed(2)}%! This swap will
                  cause a significant price movement.
                </Box>
              </TooltipHover>
            )}
            {tokens[tokenFromIndex ?? '']?.isUnknown && (
              <TooltipHover
                title={`${tokens[tokenFromIndex ?? ''].symbol} is unknown, make sure address is correct before trading`}>
                <Box className={classes.unknownWarning}>
                  {tokens[tokenFromIndex ?? ''].symbol} is not verified
                </Box>
              </TooltipHover>
            )}
            {tokens[tokenToIndex ?? '']?.isUnknown && (
              <TooltipHover
                title={`${tokens[tokenToIndex ?? ''].symbol} is unknown, make sure address is correct before trading`}>
                <Box className={classes.unknownWarning}>
                  {tokens[tokenToIndex ?? ''].symbol} is not verified
                </Box>
              </TooltipHover>
            )}
          </Box>
          <Box className={classes.transactionDetails}>
            <Box className={classes.transactionDetailsInner}>
              <button
                onClick={
                  tokenFromIndex !== null &&
                  tokenToIndex !== null &&
                  hasShowRateMessage() &&
                  amountFrom !== '' &&
                  amountTo !== ''
                    ? handleOpenTransactionDetails
                    : undefined
                }
                className={classNames(
                  tokenFromIndex !== null &&
                    tokenToIndex !== null &&
                    hasShowRateMessage() &&
                    amountFrom !== '' &&
                    amountTo !== ''
                    ? classes.HiddenTransactionButton
                    : classes.transactionDetailDisabled,
                  classes.transactionDetailsButton
                )}>
                <Grid className={classes.transactionDetailsWrapper}>
                  <Typography className={classes.transactionDetailsHeader}>
                    {detailsOpen && canShowDetails ? 'Hide' : 'Show'} transaction details
                  </Typography>
                </Grid>
              </button>
              {tokenFromIndex !== null &&
                tokenToIndex !== null &&
                tokenFromIndex !== tokenToIndex && (
                  <TooltipHover title='Refresh'>
                    <Grid
                      container
                      alignItems='center'
                      justifyContent='center'
                      width={20}
                      height={34}
                      minWidth='fit-content'
                      ml={1}>
                      <Refresher
                        currentIndex={refresherTime}
                        maxIndex={REFRESHER_INTERVAL}
                        onClick={handleRefresh}
                      />
                    </Grid>
                  </TooltipHover>
                )}
            </Box>
            {canShowDetails ? (
              <Box className={classes.exchangeRateWrapper}>
                <ExchangeRate
                  onClick={() => setRateReversed(!rateReversed)}
                  tokenFromSymbol={tokens[rateReversed ? tokenToIndex : tokenFromIndex].symbol}
                  tokenToSymbol={tokens[rateReversed ? tokenFromIndex : tokenToIndex].symbol}
                  amount={rateReversed ? 1 / swapRate : swapRate}
                  tokenToDecimals={tokens[rateReversed ? tokenFromIndex : tokenToIndex].decimals}
                  loading={getStateMessage() === 'Loading'}
                />
              </Box>
            ) : null}
          </Box>
          <TransactionDetailsBox
            open={detailsOpen && canShowDetails}
            fee={canShowDetails ? pools[simulateResult.poolIndex].fee : new BN(0)}
            exchangeRate={{
              val: rateReversed ? 1 / swapRate : swapRate,
              symbol: canShowDetails
                ? tokens[rateReversed ? tokenFromIndex : tokenToIndex].symbol
                : '',
              decimal: canShowDetails
                ? tokens[rateReversed ? tokenFromIndex : tokenToIndex].decimals
                : 0
            }}
            priceImpact={simulateResult.priceImpact}
            slippage={+slippTolerance}
            isLoadingRate={getStateMessage() === 'Loading'}
          />
          <TokensInfo
            tokenFrom={tokenFromIndex !== null ? tokens[tokenFromIndex] : null}
            tokenTo={tokenToIndex !== null ? tokens[tokenToIndex] : null}
            tokenToPrice={tokenToPriceData?.price}
            tokenFromPrice={tokenFromPriceData?.price}
            copyTokenAddressHandler={copyTokenAddressHandler}
            network={network}
          />
          {walletStatus !== Status.Initialized && getStateMessage() !== 'Loading' ? (
            <ChangeWalletButton
              name='Connect wallet'
              onConnect={onConnectWallet}
              connected={false}
              onDisconnect={onDisconnectWallet}
              className={classes.connectWalletButton}
              isSwap={true}
            />
          ) : getStateMessage() === 'Insufficient Wrapped ETH' ? (
            <TooltipHover
              title='More ETH is required to cover the transaction fee. Obtain more ETH to complete this transaction.'
              top={-45}>
              <div>
                <AnimatedButton
                  content={getStateMessage()}
                  className={
                    getStateMessage() === 'Connect a wallet'
                      ? `${classes.swapButton}`
                      : getStateMessage() === 'Exchange' && progress === 'none'
                        ? `${classes.swapButton} ${classes.ButtonSwapActive}`
                        : classes.swapButton
                  }
                  disabled={getStateMessage() !== 'Exchange' || progress !== 'none'}
                  onClick={() => {
                    if (tokenFromIndex === null || tokenToIndex === null) return

                    onSwap(
                      fromFee(new BN(Number(+slippTolerance * 1000))),
                      simulateResult.estimatedPriceAfterSwap,
                      tokens[tokenFromIndex].assetAddress,
                      tokens[tokenToIndex].assetAddress,
                      simulateResult.poolIndex,
                      convertBalanceToBN(amountFrom, tokens[tokenFromIndex].decimals),
                      convertBalanceToBN(amountTo, tokens[tokenToIndex].decimals),
                      inputRef === inputTarget.FROM
                    )
                  }}
                  progress={progress}
                />
              </div>
            </TooltipHover>
          ) : (
            <AnimatedButton
              content={getStateMessage()}
              className={
                getStateMessage() === 'Connect a wallet'
                  ? `${classes.swapButton}`
                  : getStateMessage() === 'Exchange' && progress === 'none'
                    ? `${classes.swapButton} ${classes.ButtonSwapActive}`
                    : classes.swapButton
              }
              disabled={getStateMessage() !== 'Exchange' || progress !== 'none'}
              onClick={() => {
                if (tokenFromIndex === null || tokenToIndex === null) return

                onSwap(
                  fromFee(new BN(Number(+slippTolerance * 1000))),
                  simulateResult.estimatedPriceAfterSwap,
                  tokens[tokenFromIndex].assetAddress,
                  tokens[tokenToIndex].assetAddress,
                  simulateResult.poolIndex,
                  convertBalanceToBN(amountFrom, tokens[tokenFromIndex].decimals),
                  convertBalanceToBN(amountTo, tokens[tokenToIndex].decimals),
                  inputRef === inputTarget.FROM
                )
              }}
              progress={progress}
            />
          )}
        </Grid>
      </Box>
      <img src={icons.audit} alt='Audit' style={{ marginTop: '24px' }} width={180} />
    </Grid>
  )
}

export default Swap
