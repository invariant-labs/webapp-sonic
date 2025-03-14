import {
  calculatePriceSqrt,
  getTokenProgramAddress,
  MAX_TICK,
  MIN_TICK,
  Pair,
  PRICE_DENOMINATOR
} from '@invariant-labs/sdk-sonic'
import { PoolStructure, Tick } from '@invariant-labs/sdk-sonic/src/market'
import {
  calculateTickDelta,
  DECIMAL,
  parseLiquidityOnTicks,
  simulateSwap,
  SimulationStatus
} from '@invariant-labs/sdk-sonic/src/utils'
import { BN } from '@coral-xyz/anchor'
import { getMint, Mint } from '@solana/spl-token'
import { Connection, PublicKey } from '@solana/web3.js'
import {
  Market,
  Tickmap,
  TICK_CROSSES_PER_IX,
  TICK_VIRTUAL_CROSSES_PER_IX,
  parsePool,
  RawPoolStructure,
  parsePosition,
  parseTick,
  RawTick
} from '@invariant-labs/sdk-sonic/lib/market'
import axios from 'axios'
import {
  CONCENTRATION_FACTOR,
  getMaxTick,
  getMinTick,
  PRICE_SCALE,
  Range,
  simulateSwapAndCreatePosition,
  simulateSwapAndCreatePositionOnTheSamePool,
  toDecimal
} from '@invariant-labs/sdk-sonic/lib/utils'
import { PlotTickData, PositionWithAddress } from '@store/reducers/positions'
import {
  ADDRESSES_TO_REVERT_TOKEN_PAIRS,
  BTC_TEST,
  PRICE_QUERY_COOLDOWN,
  FormatConfig,
  getAddressTickerMap,
  getReversedAddressTickerMap,
  MAX_U64,
  NetworkType,
  PRICE_DECIMAL,
  subNumbers,
  tokensPrices,
  USDC_TEST,
  WSOL_TEST,
  WRAPPED_SOL_ADDRESS,
  MAX_CROSSES_IN_SINGLE_TX,
  WSOL_MAIN,
  POSITIONS_PER_PAGE,
  ETH_TEST
} from '@store/consts/static'
import { PoolWithAddress } from '@store/reducers/pools'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import {
  FormatNumberThreshold,
  FullSnap,
  IncentiveRewardData,
  IPriceData,
  PoolSnapshot,
  PrefixConfig,
  Token,
  TokenPriceData
} from '@store/consts/types'
import { sqrt } from '@invariant-labs/sdk-sonic/lib/math'
import { Metaplex } from '@metaplex-foundation/js'
import { apyToApr } from './uiUtils'

export const transformBN = (amount: BN): string => {
  return (amount.div(new BN(1e2)).toNumber() / 1e4).toString()
}
export const printBN = (amount: BN, decimals: number): string => {
  const amountString = amount.toString()
  const isNegative = amountString.length > 0 && amountString[0] === '-'

  const balanceString = isNegative ? amountString.slice(1) : amountString

  if (balanceString.length <= decimals) {
    return (
      (isNegative ? '-' : '') + '0.' + '0'.repeat(decimals - balanceString.length) + balanceString
    )
  } else {
    return (
      (isNegative ? '-' : '') +
      trimZeros(
        balanceString.substring(0, balanceString.length - decimals) +
          '.' +
          balanceString.substring(balanceString.length - decimals)
      )
    )
  }
}

export const formatNumberWithCommas = (number: string) => {
  const trimmedNumber = number.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '')

  return trimmedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export const removeAdditionalDecimals = (value: string, desiredDecimals: number): string => {
  const dotIndex = value.indexOf('.')
  if (dotIndex === -1) {
    return value
  }
  const decimals = value.length - dotIndex - 1
  if (decimals > desiredDecimals) {
    const sliced = value.slice(0, dotIndex + desiredDecimals + 1)
    const lastCommaIndex = sliced.lastIndexOf(',')

    if (lastCommaIndex === -1 || lastCommaIndex < dotIndex) {
      return sliced
    }

    return value.slice(0, lastCommaIndex) + value.slice(lastCommaIndex + 1, lastCommaIndex + 2)
  } else {
    return value
  }
}

export const trimZeros = (numStr: string): string => {
  if (!numStr) {
    return ''
  }
  return numStr
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/^0+(\d)|(\d)0+$/gm, '$1$2')
    .replace(/\.$/, '')
}
export const convertBalanceToBN = (amount: string, decimals: number): BN => {
  const balanceString = amount.split('.')
  if (balanceString.length !== 2) {
    return new BN(balanceString[0] + '0'.repeat(decimals))
  }
  if (balanceString[1].length <= decimals) {
    return new BN(
      balanceString[0] + balanceString[1] + '0'.repeat(decimals - balanceString[1].length)
    )
  }
  return new BN(0)
}
export interface ParsedBN {
  BN: BN
  decimal: number
}
export const stringToMinDecimalBN = (value: string): ParsedBN => {
  if (value.includes('.')) {
    const [before, after] = value.split('.')
    return {
      BN: new BN(`${before}${after}`),
      decimal: after.length || 0
    }
  }
  return {
    BN: new BN(value),
    decimal: 0
  }
}
export const capitalizeString = (str: string) => {
  if (!str) {
    return str
  }
  return str[0].toUpperCase() + str.substr(1).toLowerCase()
}

export const divUp = (a: BN, b: BN): BN => {
  return a.add(b.subn(1)).div(b)
}
export const divUpNumber = (a: number, b: number): number => {
  return Math.ceil(a / b)
}
export const removeTickerPrefix = (ticker: string, prefix: string[] = ['x', '$']): string => {
  const index = prefix.findIndex(p => ticker.startsWith(p))
  if (index && prefix[index]) {
    return ticker.substring(prefix[index].length)
  }
  return ticker
}

const defaultPrefixConfig: PrefixConfig = {
  B: 1000000000,
  M: 1000000,
  K: 10000
}

export const showPrefix = (nr: number, config: PrefixConfig = defaultPrefixConfig): string => {
  const abs = Math.abs(nr)

  if (typeof config.B !== 'undefined' && abs >= config.B) {
    return 'B'
  }

  if (typeof config.M !== 'undefined' && abs >= config.M) {
    return 'M'
  }

  if (typeof config.K !== 'undefined' && abs >= config.K) {
    return 'K'
  }

  return ''
}

export const defaultThresholds: FormatNumberThreshold[] = [
  {
    value: 10,
    decimals: 4
  },
  {
    value: 1000,
    decimals: 2
  },
  {
    value: 10000,
    decimals: 1
  },
  {
    value: 1000000,
    decimals: 2,
    divider: 1000
  },
  {
    value: 1000000000,
    decimals: 2,
    divider: 1000000
  },
  {
    value: Infinity,
    decimals: 2,
    divider: 1000000000
  }
]

export const formatNumbers =
  (thresholds: FormatNumberThreshold[] = defaultThresholds) =>
  (value: string) => {
    const num = Number(value)
    const abs = Math.abs(num)
    const threshold = thresholds.sort((a, b) => a.value - b.value).find(thr => abs < thr.value)

    const formatted = threshold
      ? (abs / (threshold.divider ?? 1)).toFixed(threshold.decimals)
      : value

    return num < 0 && threshold ? '-' + formatted : formatted
  }

export const sqrtPriceToPrice = (sqrtPrice: BN) => {
  const price = sqrtPrice.mul(sqrtPrice)

  return price.div(PRICE_DENOMINATOR)
}

export const priceToSqrtPrice = (price: BN) => {
  return sqrt(price.mul(PRICE_DENOMINATOR))
}

export const calculateSqrtPriceFromBalance = (
  price: number,
  spacing: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
) => {
  const minTick = getMinTick(spacing)
  const maxTick = getMaxTick(spacing)

  const basePrice = Math.min(
    Math.max(
      price,
      Number(calcPriceByTickIndex(isXtoY ? minTick : maxTick, isXtoY, xDecimal, yDecimal))
    ),
    Number(calcPriceByTickIndex(isXtoY ? maxTick : minTick, isXtoY, xDecimal, yDecimal))
  )

  const primaryUnitsPrice = getPrimaryUnitsPrice(
    basePrice,
    isXtoY,
    Number(xDecimal),
    Number(yDecimal)
  )

  const parsedPrimaryUnits =
    primaryUnitsPrice > 1 && Number.isInteger(primaryUnitsPrice)
      ? primaryUnitsPrice.toString()
      : primaryUnitsPrice.toFixed(24)

  const priceBN = convertBalanceToBN(parsedPrimaryUnits, PRICE_SCALE)
  const sqrtPrice = priceToSqrtPrice(priceBN)

  const minSqrtPrice = calculatePriceSqrt(minTick)
  const maxSqrtPrice = calculatePriceSqrt(maxTick)

  let validatedSqrtPrice = sqrtPrice

  if (sqrtPrice.lt(minSqrtPrice)) {
    validatedSqrtPrice = minSqrtPrice
  } else if (sqrtPrice.gt(maxSqrtPrice)) {
    validatedSqrtPrice = maxSqrtPrice
  }

  return validatedSqrtPrice
}

export const findClosestIndexByValue = (arr: number[], value: number): number => {
  const high = arr.length - 1

  if (value < arr[0]) {
    return 0
  }

  if (value > arr[high]) {
    return high
  }

  for (let i = arr.length - 1; i >= 0; i--) {
    if (Number(arr[i].toFixed(0)) <= Number(value.toFixed(0))) {
      return i
    }
  }
  return high
}

export const calculateTickFromBalance = (
  price: number,
  spacing: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
) => {
  const minTick = getMinTick(spacing)
  const maxTick = getMaxTick(spacing)

  const basePrice = Math.max(
    price,
    calcPriceByTickIndex(isXtoY ? minTick : maxTick, isXtoY, xDecimal, yDecimal)
  )
  const primaryUnitsPrice = getPrimaryUnitsPrice(basePrice, isXtoY, xDecimal, yDecimal)
  const tick = Math.round(logBase(primaryUnitsPrice, 1.0001))

  return Math.max(Math.min(tick, getMaxTick(spacing)), getMinTick(spacing))
}

export const validConcentrationMidPriceTick = (
  midPriceTick: number,
  isXtoY: boolean,
  tickSpacing: number
) => {
  const minTick = getMinTick(tickSpacing)
  const maxTick = getMaxTick(tickSpacing)

  const parsedTickSpacing = Number(tickSpacing)
  const tickDelta = calculateTickDelta(parsedTickSpacing, 2, 2)

  const minTickLimit = minTick + (2 + tickDelta) * tickSpacing
  const maxTickLimit = maxTick - (2 + tickDelta) * tickSpacing

  if (isXtoY) {
    if (midPriceTick < minTickLimit) {
      return minTickLimit
    } else if (midPriceTick > maxTickLimit) {
      return maxTickLimit
    }
  } else {
    if (midPriceTick > maxTickLimit) {
      return maxTickLimit
    } else if (midPriceTick < minTickLimit) {
      return minTickLimit
    }
  }

  return midPriceTick
}

export const nearestPriceIndex = (price: number, data: Array<{ x: number; y: number }>) => {
  let nearest = 0

  for (let i = 1; i < data.length; i++) {
    if (Math.abs(data[i].x - price) < Math.abs(data[nearest].x - price)) {
      nearest = i
    }
  }

  return nearest
}

export const getScaleFromString = (value: string): number => {
  const parts = value.split('.')

  if ((parts?.length ?? 0) < 2) {
    return 0
  }

  return parts[1]?.length ?? 0
}

export const logBase = (x: number, b: number): number => Math.log(x) / Math.log(b)

export const calcYPerXPriceBySqrtPrice = (
  sqrtPrice: BN,
  xDecimal: number,
  yDecimal: number
): number => {
  const sqrt = +printBN(sqrtPrice, PRICE_DECIMAL)
  const proportion = sqrt * sqrt

  return proportion / 10 ** (yDecimal - xDecimal)
}

export const calcPriceBySqrtPrice = (
  sqrtPrice: BN,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
): number => {
  const price = calcYPerXPriceBySqrtPrice(sqrtPrice, xDecimal, yDecimal) ** (isXtoY ? 1 : -1)

  return price
}

export const calcYPerXPriceByTickIndex = (
  tickIndex: number,
  xDecimal: number,
  yDecimal: number
): number => {
  return calcYPerXPriceBySqrtPrice(calculatePriceSqrt(tickIndex), xDecimal, yDecimal)
}

export const spacingMultiplicityLte = (arg: number, spacing: number): number => {
  if (Math.abs(arg % spacing) === 0) {
    return arg
  }

  if (arg >= 0) {
    return arg - (arg % spacing)
  }

  return arg - (spacing - (Math.abs(arg) % spacing))
}

export const spacingMultiplicityGte = (arg: number, spacing: number): number => {
  if (Math.abs(arg % spacing) === 0) {
    return arg
  }

  if (arg >= 0) {
    return arg + (spacing - (arg % spacing))
  }

  return arg + (Math.abs(arg) % spacing)
}

export const createLiquidityPlot = (
  rawTicks: Tick[],
  pool: PoolStructure,
  isXtoY: boolean,
  tokenXDecimal: number,
  tokenYDecimal: number
) => {
  const sortedTicks = rawTicks.sort((a, b) => a.index - b.index)
  const parsedTicks = rawTicks.length ? parseLiquidityOnTicks(sortedTicks) : []

  const ticks = rawTicks.map((raw, index) => ({
    ...raw,
    liqudity: parsedTicks[index].liquidity
  }))

  const ticksData: PlotTickData[] = []

  const min = getMinTick(pool.tickSpacing)
  const max = getMaxTick(pool.tickSpacing)

  if (!ticks.length || ticks[0].index > min) {
    const minPrice = calcPriceByTickIndex(min, isXtoY, tokenXDecimal, tokenYDecimal)

    ticksData.push({
      x: minPrice,
      y: 0,
      index: min
    })
  }

  ticks.forEach((tick, i) => {
    if (i === 0 && tick.index - pool.tickSpacing > min) {
      const price = calcPriceByTickIndex(
        tick.index - pool.tickSpacing,
        isXtoY,
        tokenXDecimal,
        tokenYDecimal
      )
      ticksData.push({
        x: price,
        y: 0,
        index: tick.index - pool.tickSpacing
      })
    } else if (i > 0 && tick.index - pool.tickSpacing > ticks[i - 1].index) {
      const price = calcPriceByTickIndex(
        tick.index - pool.tickSpacing,
        isXtoY,
        tokenXDecimal,
        tokenYDecimal
      )
      ticksData.push({
        x: price,
        y: +printBN(ticks[i - 1].liqudity, DECIMAL),
        index: tick.index - pool.tickSpacing
      })
    }

    const price = calcPriceByTickIndex(tick.index, isXtoY, tokenXDecimal, tokenYDecimal)
    ticksData.push({
      x: price,
      y: +printBN(ticks[i].liqudity, DECIMAL),
      index: tick.index
    })
  })

  if (!ticks.length) {
    const maxPrice = calcPriceByTickIndex(max, isXtoY, tokenXDecimal, tokenYDecimal)

    ticksData.push({
      x: maxPrice,
      y: 0,
      index: max
    })
  } else if (ticks[ticks.length - 1].index < max) {
    if (max - ticks[ticks.length - 1].index > pool.tickSpacing) {
      const price = calcPriceByTickIndex(
        ticks[ticks.length - 1].index + pool.tickSpacing,
        isXtoY,
        tokenXDecimal,
        tokenYDecimal
      )
      ticksData.push({
        x: price,
        y: 0,
        index: ticks[ticks.length - 1].index + pool.tickSpacing
      })
    }

    const maxPrice = calcPriceByTickIndex(max, isXtoY, tokenXDecimal, tokenYDecimal)

    ticksData.push({
      x: maxPrice,
      y: 0,
      index: max
    })
  }

  return isXtoY ? ticksData : ticksData.reverse()
}
export const parseLiquidityOnUserTicks = (
  ticks: { index: number; liquidityChange: BN; sign: boolean }[]
) => {
  let currentLiquidity = new BN(0)

  return ticks.map(tick => {
    currentLiquidity = currentLiquidity.add(tick.liquidityChange.muln(tick.sign ? 1 : -1))
    return {
      liquidity: currentLiquidity,
      index: tick.index
    }
  })
}

export const getLiquidityTicksByPositionsList = (
  pool: PoolWithAddress,
  positions: PositionWithAddress[],
  isXtoY: boolean,
  tokenXDecimal: number,
  tokenYDecimal: number
): PlotTickData[] => {
  const minTick = getMinTick(pool.tickSpacing)
  const maxTick = getMaxTick(pool.tickSpacing)

  const userTickIndexes: { index: number; liquidity: BN }[] = []

  positions.forEach(position => {
    if (position.pool.equals(pool.address)) {
      const lowerTickIndex = position.lowerTickIndex
      const upperTickIndex = position.upperTickIndex
      userTickIndexes.push({ index: lowerTickIndex, liquidity: position.liquidity })
      userTickIndexes.push({ index: upperTickIndex, liquidity: position.liquidity })
    }
  })

  const newTicks: { index: number; liquidityChange: BN; sign: boolean }[] = []

  userTickIndexes.forEach(userTick => {
    const [liquidityChange, sign] = userTick.liquidity.gt(new BN(0))
      ? [userTick.liquidity, true]
      : [userTick.liquidity.neg(), false]

    if (!liquidityChange.eq(new BN(0))) {
      newTicks.push({ index: userTick.index, liquidityChange, sign })
    }
  })
  const parsedTicks = parseLiquidityOnUserTicks(newTicks)

  const ticksData: PlotTickData[] = []

  parsedTicks.forEach((tick, i) => {
    if (i === 0 && tick.index - pool.tickSpacing > minTick) {
      const price = calcPriceByTickIndex(
        tick.index - pool.tickSpacing,
        isXtoY,
        tokenXDecimal,
        tokenYDecimal
      )
      ticksData.push({
        x: price,
        y: 0,
        index: tick.index - pool.tickSpacing
      })
    } else if (i > 0 && tick.index - pool.tickSpacing > parsedTicks[i - 1].index) {
      const price = calcPriceByTickIndex(
        tick.index - pool.tickSpacing,
        isXtoY,
        tokenXDecimal,
        tokenYDecimal
      )

      ticksData.push({
        x: price,
        y: +printBN(parsedTicks[i - 1].liquidity, DECIMAL),
        index: tick.index - pool.tickSpacing
      })
    }

    const price = calcPriceByTickIndex(tick.index, isXtoY, tokenXDecimal, tokenYDecimal)

    ticksData.push({
      x: price,
      y: +printBN(parsedTicks[i].liquidity, DECIMAL),
      index: tick.index
    })
  })

  const sortedTicks = ticksData.sort((a, b) => a.index - b.index)

  if (sortedTicks.length !== 0 && sortedTicks[0].index > minTick) {
    const minPrice = calcPriceByTickIndex(minTick, isXtoY, tokenXDecimal, tokenYDecimal)

    sortedTicks.unshift({
      x: minPrice,
      y: 0,
      index: minTick
    })
  }
  if (sortedTicks.length !== 0 && sortedTicks[sortedTicks.length - 1].index < maxTick) {
    const maxPrice = calcPriceByTickIndex(maxTick, isXtoY, tokenXDecimal, tokenYDecimal)

    sortedTicks.push({
      x: maxPrice,
      y: 0,
      index: maxTick
    })
  }

  return sortedTicks
}

export const numberToString = (number: number | bigint | string): string => {
  if (typeof number === 'bigint') {
    return number.toString()
  }

  const numStr = String(number)

  if (numStr.includes('e')) {
    const [base, exp] = numStr.split('e')
    const exponent = parseInt(exp, 10)

    if (exponent < 0) {
      const decimalPlaces = Math.abs(exponent) + base.replace('.', '').length - 1
      return Number(number).toFixed(decimalPlaces)
    }

    return Number(number).toString()
  }

  return numStr
}

export const containsOnlyZeroes = (string: string): boolean => {
  return /^(?!.*[1-9]).*$/.test(string)
}

export const printSubNumber = (amount: number): string => {
  return Array.from(String(amount))
    .map(char => subNumbers[+char])
    .join('')
}

export const formatNumberWithSuffix = (
  number: number | bigint | string,
  noDecimals?: boolean,
  decimalsAfterDot: number = 3
): string => {
  const numberAsNumber = Number(number)
  const isNegative = numberAsNumber < 0
  const absNumberAsNumber = Math.abs(numberAsNumber)

  const absNumberAsString = numberToString(absNumberAsNumber)

  if (containsOnlyZeroes(absNumberAsString)) {
    return '0'
  }

  const [beforeDot, afterDot] = absNumberAsString.split('.')

  let formattedNumber

  if (Math.abs(numberAsNumber) >= FormatConfig.B) {
    const formattedDecimals = noDecimals
      ? ''
      : (FormatConfig.DecimalsAfterDot ? '.' : '') +
        (beforeDot.slice(-FormatConfig.BDecimals) + (afterDot ? afterDot : '')).slice(
          0,
          FormatConfig.DecimalsAfterDot
        )

    formattedNumber =
      beforeDot.slice(0, -FormatConfig.BDecimals) + (noDecimals ? '' : formattedDecimals) + 'B'
  } else if (Math.abs(numberAsNumber) >= FormatConfig.M) {
    const formattedDecimals = noDecimals
      ? ''
      : (FormatConfig.DecimalsAfterDot ? '.' : '') +
        (beforeDot.slice(-FormatConfig.MDecimals) + (afterDot ? afterDot : '')).slice(
          0,
          FormatConfig.DecimalsAfterDot
        )
    formattedNumber =
      beforeDot.slice(0, -FormatConfig.MDecimals) + (noDecimals ? '' : formattedDecimals) + 'M'
  } else if (Math.abs(numberAsNumber) >= FormatConfig.K) {
    const formattedDecimals = noDecimals
      ? ''
      : (FormatConfig.DecimalsAfterDot ? '.' : '') +
        (beforeDot.slice(-FormatConfig.KDecimals) + (afterDot ? afterDot : '')).slice(
          0,
          FormatConfig.DecimalsAfterDot
        )
    formattedNumber =
      beforeDot.slice(0, -FormatConfig.KDecimals) + (noDecimals ? '' : formattedDecimals) + 'K'
  } else if (afterDot && countLeadingZeros(afterDot) <= decimalsAfterDot) {
    const roundedNumber = numberAsNumber
      .toFixed(countLeadingZeros(afterDot) + decimalsAfterDot + 1)
      .slice(0, -1)

    formattedNumber = trimZeros(roundedNumber)
  } else {
    const leadingZeros = afterDot ? countLeadingZeros(afterDot) : 0

    const parsedAfterDot =
      String(parseInt(afterDot)).length > decimalsAfterDot
        ? String(parseInt(afterDot)).slice(0, decimalsAfterDot)
        : afterDot

    if (parsedAfterDot) {
      formattedNumber =
        beforeDot +
        '.' +
        (parsedAfterDot
          ? leadingZeros > decimalsAfterDot
            ? '0' + printSubNumber(leadingZeros) + trimZeros(parsedAfterDot)
            : trimZeros(parsedAfterDot)
          : '')
    } else {
      formattedNumber = beforeDot
    }
  }

  return isNegative ? '-' + formattedNumber : formattedNumber
}

function trimEndingZeros(num) {
  return num.toString().replace(/0+$/, '')
}

export const formatNumberWithoutSuffix = (
  number: number | bigint | string,
  options?: { twoDecimals?: boolean }
): string => {
  const numberAsNumber = Number(number)
  const isNegative = numberAsNumber < 0
  const absNumberAsNumber = Math.abs(numberAsNumber)

  if (options?.twoDecimals) {
    if (absNumberAsNumber === 0) {
      return '0'
    }
    if (absNumberAsNumber > 0 && absNumberAsNumber < 0.01) {
      return isNegative ? '-<0.01' : '<0.01'
    }
    return isNegative
      ? '-' + absNumberAsNumber.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      : absNumberAsNumber.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const absNumberAsString = numberToString(absNumberAsNumber)
  const [beforeDot, afterDot] = absNumberAsString.split('.')

  const leadingZeros = afterDot ? countLeadingZeros(afterDot) : 0

  const parsedBeforeDot = beforeDot.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const parsedAfterDot =
    leadingZeros >= 4 && absNumberAsNumber < 1
      ? '0' + printSubNumber(leadingZeros) + trimEndingZeros(String(parseInt(afterDot)).slice(0, 3))
      : trimEndingZeros(String(afterDot).slice(0, absNumberAsNumber >= 1 ? 2 : leadingZeros + 3))

  const formattedNumber = parsedBeforeDot + (afterDot && parsedAfterDot ? '.' + parsedAfterDot : '')

  return isNegative ? '-' + formattedNumber : formattedNumber
}
export const formatBalance = (number: number | bigint | string): string => {
  const numberAsString = numberToString(number)

  const [beforeDot, afterDot] = numberAsString.split('.')

  return beforeDot.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (afterDot ? '.' + afterDot : '')
}

export const countLeadingZeros = (str: string): number => {
  return (str.match(/^0+/) || [''])[0].length
}

export const createPlaceholderLiquidityPlot = (
  isXtoY: boolean,
  yValueToFill: number,
  tickSpacing: number,
  tokenXDecimal: number,
  tokenYDecimal: number
) => {
  const ticksData: PlotTickData[] = []

  const min = getMinTick(tickSpacing)
  const max = getMaxTick(tickSpacing)

  const minPrice = calcPriceByTickIndex(min, isXtoY, tokenXDecimal, tokenYDecimal)

  ticksData.push({
    x: minPrice,
    y: yValueToFill,
    index: min
  })

  const maxPrice = calcPriceByTickIndex(max, isXtoY, tokenXDecimal, tokenYDecimal)

  ticksData.push({
    x: maxPrice,
    y: yValueToFill,
    index: max
  })

  return isXtoY ? ticksData : ticksData.reverse()
}

export const getNetworkTokensList = (networkType: NetworkType): Record<string, Token> => {
  switch (networkType) {
    case NetworkType.Mainnet:
      return {
        [WSOL_MAIN.address.toString()]: WSOL_MAIN
      }
    case NetworkType.Devnet:
      return {}
    case NetworkType.Testnet:
      return {
        [USDC_TEST.address.toString()]: USDC_TEST,
        [BTC_TEST.address.toString()]: BTC_TEST,
        [WSOL_TEST.address.toString()]: WSOL_TEST,
        [ETH_TEST.address.toString()]: ETH_TEST
      }
    default:
      return {}
  }
}

export const getPrimaryUnitsPrice = (
  price: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
) => {
  const xToYPrice = isXtoY ? price : 1 / price

  return xToYPrice * 10 ** (yDecimal - xDecimal)
}

export const nearestSpacingMultiplicity = (arg: number, spacing: number) => {
  const greater = spacingMultiplicityGte(arg, spacing)
  const lower = spacingMultiplicityLte(arg, spacing)

  const nearest = Math.abs(greater - arg) < Math.abs(lower - arg) ? greater : lower

  return Math.max(Math.min(nearest, getMaxTick(spacing)), getMinTick(spacing))
}

export const nearestTickIndex = (
  price: number,
  spacing: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
) => {
  const base = Math.max(
    price,
    calcPriceByTickIndex(isXtoY ? MIN_TICK : MAX_TICK, isXtoY, xDecimal, yDecimal)
  )
  const primaryUnitsPrice = getPrimaryUnitsPrice(base, isXtoY, xDecimal, yDecimal)
  const log = Math.round(logBase(primaryUnitsPrice, 1.0001))
  return nearestSpacingMultiplicity(log, spacing)
}
export const nearestTicksBySpacing = (midPriceTick: number, spacing: number, isXtoY: boolean) => {
  const base =
    midPriceTick % spacing === 0
      ? midPriceTick
      : isXtoY
        ? midPriceTick - (midPriceTick % spacing)
        : midPriceTick + (spacing - (midPriceTick % spacing))

  return { lowerTick: isXtoY ? base : base + spacing, upperTick: isXtoY ? base + spacing : base }
}

export const calcTicksAmountInRange = (
  min: number,
  max: number,
  tickSpacing: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
): number => {
  const primaryUnitsMin = getPrimaryUnitsPrice(min, isXtoY, xDecimal, yDecimal)
  const primaryUnitsMax = getPrimaryUnitsPrice(max, isXtoY, xDecimal, yDecimal)
  const minIndex = logBase(primaryUnitsMin, 1.0001)
  const maxIndex = logBase(primaryUnitsMax, 1.0001)

  return Math.ceil(Math.abs(maxIndex - minIndex) / tickSpacing)
}

export const calcPriceByTickIndex = (
  index: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
) => {
  const price = calcYPerXPriceBySqrtPrice(calculatePriceSqrt(index), xDecimal, yDecimal)

  return isXtoY ? price : price !== 0 ? 1 / price : Number.MAX_SAFE_INTEGER
}

export const findPoolIndex = (address: PublicKey, pools: PoolWithAddress[]) => {
  return pools.findIndex(pool => pool.address.equals(address))
}

export const findPairIndex = (
  fromToken: PublicKey,
  toToken: PublicKey,
  pools: PoolWithAddress[]
) => {
  return pools.findIndex(
    pool =>
      (fromToken.equals(pool.tokenX) && toToken.equals(pool.tokenY)) ||
      (fromToken.equals(pool.tokenY) && toToken.equals(pool.tokenX))
  )
}

export const findPairs = (tokenFrom: PublicKey, tokenTo: PublicKey, pairs: PoolWithAddress[]) => {
  return pairs.filter(
    pool =>
      (tokenFrom.equals(pool.tokenX) && tokenTo.equals(pool.tokenY)) ||
      (tokenFrom.equals(pool.tokenY) && tokenTo.equals(pool.tokenX))
  )
}

export const calcCurrentPriceOfPool = (
  pool: PoolWithAddress,
  xDecimal: number,
  yDecimal: number
) => {
  const decimalDiff = PRICE_DECIMAL + (xDecimal - yDecimal)
  const sqrtPricePow: number =
    +printBN(pool.sqrtPrice, PRICE_DECIMAL) * +printBN(pool.sqrtPrice, PRICE_DECIMAL)

  const knownPrice: BN = new BN(sqrtPricePow * 10 ** decimalDiff)

  return convertBalanceToBN(knownPrice.toString(), 0)
}

export const handleSimulate = async (
  pools: PoolWithAddress[],
  poolTicks: { [key in string]: Tick[] },
  tickmaps: { [key in string]: Tickmap },
  slippage: BN,
  fromToken: PublicKey,
  toToken: PublicKey,
  amount: BN,
  byAmountIn: boolean
): Promise<{
  amountOut: BN
  poolIndex: number
  AmountOutWithFee: BN
  estimatedPriceAfterSwap: BN
  minimumReceived: BN
  priceImpact: BN
  error: string[]
}> => {
  const filteredPools = findPairs(fromToken, toToken, pools)
  const errorMessage: string[] = []
  let isXtoY = false
  let result
  let okChanges = 0
  let failChanges = 0
  const initAmountOut = byAmountIn ? new BN(-1) : MAX_U64

  let successData = {
    amountOut: initAmountOut,
    poolIndex: 0,
    AmountOutWithFee: new BN(0),
    estimatedPriceAfterSwap: new BN(0),
    minimumReceived: new BN(0),
    priceImpact: new BN(0)
  }

  let allFailedData = {
    amountOut: initAmountOut,
    poolIndex: 0,
    AmountOutWithFee: new BN(0),
    estimatedPriceAfterSwap: new BN(0),
    minimumReceived: new BN(0),
    priceImpact: new BN(0)
  }

  if (amount.eq(new BN(0))) {
    return {
      amountOut: new BN(0),
      poolIndex: 0,
      AmountOutWithFee: new BN(0),
      estimatedPriceAfterSwap: new BN(0),
      minimumReceived: new BN(0),
      priceImpact: new BN(0),
      error: errorMessage
    }
  }

  for (const pool of filteredPools) {
    isXtoY = fromToken.equals(pool.tokenX)

    const ticks: Map<number, Tick> = new Map<number, Tick>()
    const poolTicksForAddress = poolTicks[pool.address.toString()]
    if (Array.isArray(poolTicksForAddress)) {
      for (const tick of poolTicksForAddress) {
        ticks.set(tick.index, tick)
      }
    } else {
      errorMessage.push(`Ticks not available for pool ${pool.address.toString()}`)
      continue
    }
    const maxCrosses =
      pool.tokenX.toString() === WRAPPED_SOL_ADDRESS ||
      pool.tokenY.toString() === WRAPPED_SOL_ADDRESS
        ? MAX_CROSSES_IN_SINGLE_TX
        : TICK_CROSSES_PER_IX

    try {
      const swapSimulateResult = simulateSwap({
        xToY: isXtoY,
        byAmountIn: byAmountIn,
        swapAmount: amount,
        slippage: slippage,
        pool: pool,
        ticks: ticks,
        tickmap: tickmaps[pool.tickmap.toString()],
        maxCrosses,
        maxVirtualCrosses: TICK_VIRTUAL_CROSSES_PER_IX
      })

      if (!byAmountIn) {
        result = swapSimulateResult.accumulatedAmountIn.add(swapSimulateResult.accumulatedFee)
      } else {
        result = swapSimulateResult.accumulatedAmountOut
      }
      if (
        (byAmountIn ? successData.amountOut.lt(result) : successData.amountOut.gt(result)) &&
        swapSimulateResult.status === SimulationStatus.Ok &&
        swapSimulateResult.amountPerTick.length <= TICK_CROSSES_PER_IX
      ) {
        successData = {
          amountOut: result,
          poolIndex: findPoolIndex(pool.address, pools),
          AmountOutWithFee: result.add(swapSimulateResult.accumulatedFee),
          estimatedPriceAfterSwap: swapSimulateResult.priceAfterSwap,
          minimumReceived: swapSimulateResult.minReceived,
          priceImpact: swapSimulateResult.priceImpact
        }

        okChanges += 1
      } else if (
        byAmountIn
          ? allFailedData.amountOut.lt(result)
          : allFailedData.amountOut.eq(MAX_U64)
            ? result
            : allFailedData.amountOut.lt(result)
      ) {
        allFailedData = {
          amountOut: result,
          poolIndex: findPoolIndex(pool.address, pools),
          AmountOutWithFee: result.add(swapSimulateResult.accumulatedFee),
          estimatedPriceAfterSwap: swapSimulateResult.priceAfterSwap,
          minimumReceived: swapSimulateResult.minReceived,
          priceImpact: swapSimulateResult.priceImpact
        }

        failChanges += 1
      }

      if (swapSimulateResult.status !== SimulationStatus.Ok) {
        errorMessage.push(swapSimulateResult.status)
      }
    } catch (e: unknown) {
      const error = ensureError(e)
      console.log(error)

      errorMessage.push(error.message.toString())
    }
  }
  if (okChanges === 0 && failChanges === 0) {
    return {
      amountOut: new BN(0),
      poolIndex: 0,
      AmountOutWithFee: new BN(0),
      estimatedPriceAfterSwap: new BN(0),
      minimumReceived: new BN(0),
      priceImpact: new BN(0),
      error: errorMessage
    }
  }

  if (okChanges === 0) {
    return {
      ...allFailedData,
      error: errorMessage
    }
  }

  return {
    ...successData,
    error: []
  }
}

export const toMaxNumericPlaces = (num: number, places: number): string => {
  const log = Math.floor(Math.log10(num))

  if (log >= places) {
    return num.toFixed(0)
  }

  if (log >= 0) {
    return num.toFixed(places - log - 1)
  }

  return num.toFixed(places + Math.abs(log) - 1)
}

export const getNetworkStats = async (name: string): Promise<Record<string, PoolSnapshot[]>> => {
  const { data } = await axios.get<Record<string, PoolSnapshot[]>>(
    `https://stats.invariant.app/full/sonic-${name}`
  )

  return data
}

export const getPoolsFromAddresses = async (
  addresses: PublicKey[],
  marketProgram: Market
): Promise<PoolWithAddress[]> => {
  try {
    const pools = (await marketProgram.program.account.pool.fetchMultiple(
      addresses
    )) as Array<RawPoolStructure | null>

    return pools
      .filter(pool => !!pool)
      .map((pool, index) => {
        return {
          ...parsePool(pool),
          address: addresses[index]
        }
      }) as PoolWithAddress[]
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    return []
  }
}

export const getTickmapsFromPools = async (
  pools: PoolWithAddress[],
  marketProgram: Market
): Promise<Record<string, Tickmap>> => {
  {
    try {
      const addresses = pools.map(pool => pool.tickmap)
      const tickmaps = (await marketProgram.program.account.tickmap.fetchMultiple(
        addresses
      )) as Array<Tickmap | null>

      return tickmaps.reduce((acc, cur, idx) => {
        if (cur) {
          acc[addresses[idx].toBase58()] = cur
        }
        return acc
      }, {})
    } catch (e: unknown) {
      const error = ensureError(e)
      console.log(error)

      return {}
    }
  }
}

export const getTicksFromAddresses = async (market: Market, addresses: PublicKey[]) => {
  try {
    return (await market.program.account.tick.fetchMultiple(addresses)) as Array<RawTick | null>
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    return []
  }
}

export const getPools = async (
  pairs: Pair[],
  marketProgram: Market
): Promise<PoolWithAddress[]> => {
  try {
    const addresses: PublicKey[] = await Promise.all(
      pairs.map(pair => pair.getAddress(marketProgram.program.programId))
    )

    return await getPoolsFromAddresses(addresses, marketProgram)
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)
    return []
  }
}

export const trimLeadingZeros = (amount: string): string => {
  const amountParts = amount.split('.')

  if (!amountParts.length) {
    return '0'
  }

  if (amountParts.length === 1) {
    return amountParts[0]
  }

  const reversedDec = Array.from(amountParts[1]).reverse()
  const firstNonZero = reversedDec.findIndex(char => char !== '0')

  if (firstNonZero === -1) {
    return amountParts[0]
  }

  const trimmed = reversedDec.slice(firstNonZero, reversedDec.length).reverse().join('')

  return `${amountParts[0]}.${trimmed}`
}

export const calculateConcentrationRange = (
  tickSpacing: number,
  concentration: number,
  minimumRange: number,
  currentTick: number,
  isXToY: boolean
) => {
  const tickDelta = calculateTickDelta(tickSpacing, minimumRange, concentration)

  const parsedTickDelta = Math.abs(tickDelta) === 0 ? 0 : Math.abs(tickDelta) - 1

  const lowerTick = currentTick - (minimumRange / 2 + parsedTickDelta) * tickSpacing
  const upperTick = currentTick + (minimumRange / 2 + parsedTickDelta) * tickSpacing

  return {
    leftRange: isXToY ? lowerTick : upperTick,
    rightRange: isXToY ? upperTick : lowerTick
  }
}

export const calculateConcentration = (lowerTick: number, upperTick: number) => {
  const deltaPrice = Math.pow(1.0001, -Math.abs(lowerTick - upperTick))

  const denominator = 1 - Math.pow(deltaPrice, 1 / 4)
  const result = 1 / denominator

  return Math.abs(result / CONCENTRATION_FACTOR)
}

export enum PositionTokenBlock {
  None,
  A,
  B
}

export const determinePositionTokenBlock = (
  currentSqrtPrice: BN,
  lowerTick: number,
  upperTick: number,
  isXtoY: boolean
) => {
  const lowerPrice = calculatePriceSqrt(lowerTick)
  const upperPrice = calculatePriceSqrt(upperTick)

  if (lowerPrice.gte(currentSqrtPrice)) {
    return isXtoY ? PositionTokenBlock.B : PositionTokenBlock.A
  }

  if (upperPrice.lte(currentSqrtPrice)) {
    return isXtoY ? PositionTokenBlock.A : PositionTokenBlock.B
  }

  return PositionTokenBlock.None
}

export const generateUnknownTokenDataObject = (
  address: PublicKey,
  decimals: number,
  tokenProgram?: PublicKey
): Token => ({
  tokenProgram,
  address,
  decimals,
  symbol: `${address.toString().slice(0, 2)}...${address.toString().slice(-4)}`,
  name: address.toString(),
  logoURI: '/unknownToken.svg',
  isUnknown: true
})

export const getTokenProgramId = async (
  connection: Connection,
  address: PublicKey
): Promise<PublicKey> => {
  return await getTokenProgramAddress(connection, address)
}

export const getFullNewTokensData = async (
  addresses: PublicKey[],
  connection: Connection
): Promise<Record<string, Token>> => {
  const promises: Promise<[PublicKey, Mint]>[] = addresses.map(async address => {
    const programId = await getTokenProgramId(connection, address)

    return [programId, await getMint(connection, address, undefined, programId)] as [
      PublicKey,
      Mint
    ]
  })

  const tokens: Record<string, Token> = {}

  const results = await Promise.allSettled(promises)

  for (const [index, result] of results.entries()) {
    const [programId, decimals] =
      result.status === 'fulfilled' ? [result.value[0], result.value[1].decimals] : [undefined, 6]

    tokens[addresses[index].toString()] = await getTokenMetadata(
      connection,
      addresses[index].toString(),
      decimals,
      programId
    )
  }

  return tokens
}

export const addNewTokenToLocalStorage = (address: string, network: NetworkType) => {
  const currentListStr = localStorage.getItem(`CUSTOM_TOKENS_${network}`)

  const currentList = currentListStr !== null ? JSON.parse(currentListStr) : []

  currentList.push(address)

  localStorage.setItem(`CUSTOM_TOKENS_${network}`, JSON.stringify([...new Set(currentList)]))
}

export async function getTokenMetadata(
  connection: Connection,
  address: string,
  decimals: number,
  tokenProgram?: PublicKey
): Promise<Token> {
  const mintAddress = new PublicKey(address)

  try {
    const metaplex = new Metaplex(connection)

    const nft = await metaplex.nfts().findByMint({ mintAddress })

    const irisTokenData = await axios.get<any>(nft.uri).then(res => res.data)

    return {
      tokenProgram,
      address: mintAddress,
      decimals,
      symbol:
        nft?.symbol || irisTokenData?.symbol || `${address.slice(0, 2)}...${address.slice(-4)}`,
      name: nft?.name || irisTokenData?.name || address,
      logoURI: nft?.json?.image || irisTokenData?.image || '/unknownToken.svg',
      isUnknown: true
    }
  } catch (e: unknown) {
    ensureError(e)

    return {
      tokenProgram,
      address: mintAddress,
      decimals,
      symbol: `${address.slice(0, 2)}...${address.slice(-4)}`,
      name: address,
      logoURI: '/unknownToken.svg',
      isUnknown: true
    }
  }
}

export const getNewTokenOrThrow = async (
  address: string,
  connection: Connection
): Promise<Record<string, Token>> => {
  const key = new PublicKey(address)
  const programId = await getTokenProgramId(connection, key)

  const info = await getMint(connection, key, undefined, programId)

  console.log(info)

  const tokenData = await getTokenMetadata(connection, address, info.decimals, programId)

  return {
    [address.toString()]: tokenData
  }
}

export const stringToFixed = (
  string: string,
  numbersAfterDot: number,
  trimZeros?: boolean
): string => {
  const toFixedString = string.includes('.')
    ? string.slice(0, string.indexOf('.') + 1 + numbersAfterDot)
    : string

  if (trimZeros) {
    return trimDecimalZeros(toFixedString)
  } else {
    return toFixedString
  }
}

export const tickerToAddress = (network: NetworkType, ticker: string): string | null => {
  try {
    return getAddressTickerMap(network)[ticker].toString()
  } catch (e: unknown) {
    ensureError(e)

    return ticker
  }
}

export const addressToTicker = (network: NetworkType, address: string): string => {
  return getReversedAddressTickerMap(network)[address] || address
}

export const initialXtoY = (tokenXAddress?: string | null, tokenYAddress?: string | null) => {
  if (!tokenXAddress || !tokenYAddress) {
    return true
  }

  const tokenXIndex = ADDRESSES_TO_REVERT_TOKEN_PAIRS.findIndex(token => token === tokenXAddress)
  const tokenYIndex = ADDRESSES_TO_REVERT_TOKEN_PAIRS.findIndex(token => token === tokenYAddress)

  return !(tokenXIndex < tokenYIndex)
}

export const parseFeeToPathFee = (fee: BN): string => {
  const parsedFee = (fee / Math.pow(10, 8)).toString().padStart(3, '0')
  return parsedFee.slice(0, parsedFee.length - 2) + '_' + parsedFee.slice(parsedFee.length - 2)
}

export const parsePathFeeToFeeString = (pathFee: string): string => {
  return (+pathFee.replace('_', '') * Math.pow(10, 8)).toString()
}

export const randomNumberFromRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const getPositionsForPool = async (marketProgram: Market, pool: PublicKey) => {
  return (
    await marketProgram.program.account.position.all([
      {
        memcmp: { bytes: bs58.encode(pool.toBuffer()), offset: 40 }
      }
    ])
  ).map(({ account, publicKey }) => ({
    ...parsePosition(account),
    address: publicKey
  })) as PositionWithAddress[]
}

export const getPositionsAddressesFromRange = async (
  marketProgram: Market,
  owner: PublicKey,
  lowerIndex: number,
  upperIndex: number
) => {
  const promises: Array<{
    positionAddress: PublicKey
    positionBump: number
  }> = []

  for (let i = lowerIndex; i <= upperIndex; i++) {
    promises.push(marketProgram.getPositionAddress(owner, i))
  }

  return await Promise.all(promises).then(data =>
    data.map(({ positionAddress }) => positionAddress)
  )
}

export const thresholdsWithTokenDecimal = (decimals: number): FormatNumberThreshold[] => [
  {
    value: 10,
    decimals
  },
  {
    value: 100,
    decimals: 4
  },
  {
    value: 1000,
    decimals: 2
  },
  {
    value: 10000,
    decimals: 1
  },
  {
    value: 1000000,
    decimals: 2,
    divider: 1000
  },
  {
    value: 1000000000,
    decimals: 2,
    divider: 1000000
  },
  {
    value: Infinity,
    decimals: 2,
    divider: 1000000000
  }
]

export const getMockedTokenPrice = (symbol: string, network: NetworkType): TokenPriceData => {
  const sufix = network === NetworkType.Devnet ? '_DEV' : '_TEST'
  const prices = tokensPrices[network]
  switch (symbol) {
    case 'BTC':
      return prices[symbol + sufix]
    case 'ETH':
      return prices['W' + symbol + sufix]
    case 'USDC':
      return prices[symbol + sufix]
    default:
      return { price: 0 }
  }
}

export const getTokenPrice = async (
  addr: string,
  network: NetworkType
): Promise<number | undefined> => {
  const cachedLastQueryTimestamp = localStorage.getItem('TOKEN_PRICE_LAST_QUERY_TIMESTAMP')
  let lastQueryTimestamp = 0
  if (cachedLastQueryTimestamp) {
    lastQueryTimestamp = Number(cachedLastQueryTimestamp)
  }

  const cachedPriceData =
    network === NetworkType.Mainnet
      ? localStorage.getItem('TOKEN_PRICE_DATA')
      : localStorage.getItem('TOKEN_PRICE_DATA_TESTNET')

  let priceData: Record<string, { price: number }> | null = null

  if (!cachedPriceData || Number(lastQueryTimestamp) + PRICE_QUERY_COOLDOWN <= Date.now()) {
    try {
      const { data } = await axios.get<IPriceData>(
        `https://price.invariant.app/${network === NetworkType.Mainnet ? 'sonic-mainnet' : 'sonic-testnet'}`
      )
      priceData = data.data

      localStorage.setItem(
        network === NetworkType.Mainnet ? 'TOKEN_PRICE_DATA' : 'TOKEN_PRICE_DATA_TESTNET',
        JSON.stringify(priceData)
      )
      localStorage.setItem(
        network === NetworkType.Mainnet
          ? 'TOKEN_PRICE_LAST_QUERY_TIMESTAMP'
          : 'TOKEN_PRICE_LAST_QUERY_TIMESTAMP_TESTNET',
        String(Date.now())
      )
    } catch (e: unknown) {
      const error = ensureError(e)
      console.log(error)

      localStorage.removeItem(
        network === NetworkType.Mainnet
          ? 'TOKEN_PRICE_LAST_QUERY_TIMESTAMP'
          : 'TOKEN_PRICE_LAST_QUERY_TIMESTAMP_TESTNET'
      )
      localStorage.removeItem(
        network === NetworkType.Mainnet ? 'TOKEN_PRICE_DATA' : 'TOKEN_PRICE_DATA_TESTNET'
      )
      priceData = null
    }
  } else {
    priceData = JSON.parse(cachedPriceData)
  }

  return priceData && priceData[addr] ? priceData[addr].price : undefined
}

export const getTicksList = async (
  marketProgram: Market,
  data: Array<{ pair: Pair; index: number }>
): Promise<Array<Tick | null>> => {
  const ticksAddresses = await Promise.all(
    data.map(async ({ pair, index }) => {
      const { tickAddress } = await marketProgram.getTickAddress(pair, index)

      return tickAddress
    })
  )

  const ticks = await marketProgram.program.account.tick.fetchMultiple(ticksAddresses)

  return ticks.map(tick => (tick === null ? null : parseTick(tick)))
}

export const getPoolsAPY = async (name: string): Promise<Record<string, number>> => {
  try {
    const { data } = await axios.get<Record<string, number>>(
      `https://stats.invariant.app/pool_apy/sonic-${name}`
    )

    return data
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)
    return {}
  }
}

export const getIncentivesRewardData = async (
  name: string
): Promise<Record<string, IncentiveRewardData>> => {
  try {
    const { data } = await axios.get<Record<string, IncentiveRewardData>>(
      `https://stats.invariant.app/incentive_rewards/sonic-${name}`
    )

    return data
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)
    return {}
  }
}

export const getPoolsVolumeRanges = async (name: string): Promise<Record<string, Range[]>> => {
  try {
    const { data } = await axios.get<Record<string, Range[]>>(
      `https://stats.invariant.app/pool_volume_range/sonic-${name}`
    )

    return data
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)
    return {}
  }
}

export const createLoaderKey = () => (new Date().getMilliseconds() + Math.random()).toString()

export const getFullSnap = async (name: string): Promise<FullSnap> => {
  const { data } = await axios.get<FullSnap>(
    `https://stats.invariant.app/svm/full_snap/sonic-${name}`
  )

  return data
}
export const isValidPublicKey = (keyString?: string | null) => {
  try {
    if (!keyString) {
      return false
    }
    new PublicKey(keyString)
    return true
  } catch {
    return false
  }
}

export const trimDecimalZeros = (numStr: string): string => {
  if (/^[0.]+$/.test(numStr)) {
    return '0'
  }

  const withoutTrailingDot = numStr.replace(/\.$/, '')

  if (!withoutTrailingDot.includes('.')) {
    return withoutTrailingDot.replace(/^0+/, '') || '0'
  }

  const [integerPart, decimalPart] = withoutTrailingDot.split('.')

  const trimmedDecimal = decimalPart.replace(/0+$/, '')

  const trimmedInteger = integerPart.replace(/^0+/, '')

  return trimmedDecimal ? `${trimmedInteger || '0'}.${trimmedDecimal}` : trimmedInteger || '0'
}

const poolsToRecalculateAPY: string[] = []

export const calculateAPYAndAPR = (
  apy: number,
  poolAddress?: string,
  volume?: number,
  fee?: number,
  tvl?: number
) => {
  if (volume === undefined || fee === undefined || tvl === undefined) {
    return { convertedApy: Math.abs(apy), convertedApr: Math.abs(apyToApr(apy)) }
  }

  if (poolsToRecalculateAPY.includes(poolAddress ?? '')) {
    const parsedApr = ((volume * fee) / tvl) * 365

    const parsedApy = (Math.pow((volume * fee * 0.01) / tvl + 1, 365) - 1) * 100

    return { convertedApy: Math.abs(parsedApy), convertedApr: Math.abs(parsedApr) }
  } else {
    return { convertedApy: Math.abs(apy), convertedApr: Math.abs(apyToApr(apy)) }
  }
}

export const hexToDate = (hexTimestamp: string) => {
  const timestamp = parseInt(hexTimestamp, 16)

  const date = new Date(timestamp * 1000)

  return date
}

export const checkDataDelay = (date: string | Date, timeInMinutes: number): boolean => {
  const inputDate = new Date(date)

  if (isNaN(inputDate.getTime())) {
    throw new Error('Invalid date provided')
  }

  const currentDate = new Date()

  const differenceInMinutes = (currentDate.getTime() - inputDate.getTime()) / (1000 * 60)

  return differenceInMinutes > timeInMinutes
}

export const generateHash = (str: string): string => {
  let hash = 0

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  return Math.abs(hash).toString(16).padStart(8, '0')
}

export const getConcentrationIndex = (concentrationArray: number[], neededValue: number = 34) => {
  if (neededValue > concentrationArray[concentrationArray.length - 1]) {
    return concentrationArray.length - 1
  }

  let concentrationIndex = 0

  for (let index = 0; index < concentrationArray.length; index++) {
    const value = +concentrationArray[index].toFixed(0)

    if (value === neededValue) {
      break
    } else if (value > neededValue) {
      concentrationIndex = index - 1
      break
    } else {
      concentrationIndex = index + 1
    }
  }

  return concentrationIndex
}
export const formatDate = timestamp => {
  const date = new Date(timestamp * 1000)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

export const formatNumberWithSpaces = (number: string) => {
  const trimmedNumber = number.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '')

  return trimmedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export const generatePositionTableLoadingData = () => {
  const getRandomNumber = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  return Array(POSITIONS_PER_PAGE)
    .fill(null)
    .map((_, index) => {
      const currentPrice = Math.random() * 10000

      return {
        id: `loading-${index}`,
        poolAddress: `pool-${index}`,
        tokenXName: 'FOO',
        tokenYName: 'BAR',
        tokenXIcon: undefined,
        tokenYIcon: undefined,
        currentPrice,
        fee: getRandomNumber(1, 10) / 10,
        min: currentPrice * 0.8,
        max: currentPrice * 1.2,
        position: getRandomNumber(1000, 10000),
        valueX: getRandomNumber(1000, 10000),
        valueY: getRandomNumber(1000, 10000),
        poolData: {},
        isActive: Math.random() > 0.5,
        tokenXLiq: getRandomNumber(100, 1000),
        tokenYLiq: getRandomNumber(10000, 100000),
        network: 'mainnet'
      }
    })
}
export const sciToString = (sciStr: string | number) => {
  const number = Number(sciStr)
  if (!Number.isFinite(number)) throw new Error('Invalid number')

  const fullStr = number.toLocaleString('fullwide', { useGrouping: false })
  return BigInt(fullStr).toString()
}

export const ensureError = (value: unknown): Error => {
  if (value instanceof Error) return value

  let stringified = '[Unable to stringify the thrown value]'

  stringified = JSON.stringify(value)

  const error = new Error(stringified)
  return error
}

export const ROUTES = {
  ROOT: '/',
  EXCHANGE: '/exchange',
  EXCHANGE_WITH_PARAMS: '/exchange/:item1?/:item2?',
  LIQUIDITY: '/liquidity',
  STATISTICS: '/statistics',
  NEW_POSITION: '/newPosition',
  NEW_POSITION_WITH_PARAMS: '/newPosition/:item1?/:item2?/:item3?',
  POSITION: '/position',
  POSITION_WITH_ID: '/position/:id',
  PORTFOLIO: '/portfolio',
  CREATOR: '/creator',

  getExchangeRoute: (item1?: string, item2?: string): string => {
    const parts = [item1, item2].filter(Boolean)
    return `${ROUTES.EXCHANGE}${parts.length ? '/' + parts.join('/') : ''}`
  },

  getNewPositionRoute: (item1?: string, item2?: string, item3?: string): string => {
    const parts = [item1, item2, item3].filter(Boolean)
    return `${ROUTES.NEW_POSITION}${parts.length ? '/' + parts.join('/') : ''}`
  },

  getPositionRoute: (id: string): string => `${ROUTES.POSITION}/${id}`
}

export const simulateAutoSwapOnTheSamePool = async (
  amountX: BN,
  amountY: BN,
  pool: PoolWithAddress,
  poolTicks: Tick[],
  tickmap: Tickmap,
  swapSlippage: BN,
  lowerTick: number,
  upperTick: number
) => {
  const ticks: Map<number, Tick> = new Map<number, Tick>()
  for (const tick of poolTicks) {
    ticks.set(tick.index, tick)
  }

  const maxCrosses =
    pool.tokenX.toString() === WRAPPED_SOL_ADDRESS || pool.tokenY.toString() === WRAPPED_SOL_ADDRESS
      ? MAX_CROSSES_IN_SINGLE_TX
      : TICK_CROSSES_PER_IX

  try {
    const simulateResult = simulateSwapAndCreatePositionOnTheSamePool(
      amountX,
      amountY,
      swapSlippage,
      {
        ticks,
        tickmap,
        pool,
        maxVirtualCrosses: TICK_VIRTUAL_CROSSES_PER_IX,
        maxCrosses
      },
      { lowerTick, upperTick }
    )
    return simulateResult
  } catch (e) {
    console.log(e)
    return null
  }
}

export const simulateAutoSwap = async (
  amountX: BN,
  amountY: BN,
  pool: PoolWithAddress,
  poolTicks: Tick[],
  tickmap: Tickmap,
  swapSlippage: BN,
  positionSlippage: BN,
  lowerTick: number,
  upperTick: number,
  knownPrice: BN
) => {
  const ticks: Map<number, Tick> = new Map<number, Tick>()
  for (const tick of poolTicks) {
    ticks.set(tick.index, tick)
  }

  const maxCrosses =
    pool.tokenX.toString() === WRAPPED_SOL_ADDRESS || pool.tokenY.toString() === WRAPPED_SOL_ADDRESS
      ? MAX_CROSSES_IN_SINGLE_TX
      : TICK_CROSSES_PER_IX

  try {
    const simulateResult = simulateSwapAndCreatePosition(
      amountX,
      amountY,
      {
        ticks,
        tickmap,
        pool,
        maxVirtualCrosses: TICK_VIRTUAL_CROSSES_PER_IX,
        maxCrosses,
        slippage: swapSlippage
      },
      { lowerTick, knownPrice, slippage: positionSlippage, upperTick },
      toDecimal(1, 3)
    )
    return simulateResult
  } catch (e) {
    console.log(e)
    return null
  }
}
