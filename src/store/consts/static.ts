import { FEE_TIERS, toDecimal } from '@invariant-labs/sdk-sonic/lib/utils'
import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { ISnackbar } from '@store/reducers/snackbars'
import {
  Chain,
  FormatNumberThreshold,
  PrefixConfig,
  Token,
  TokenPriceData,
  WalletType
} from './types'
import { cat1Icon, cat2Icon, dog1Icon, dog2Icon } from '@static/icons'
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'

export enum NetworkType {
  Local = 'Local',
  Testnet = 'Testnet',
  Devnet = 'Devnet',
  Mainnet = 'Mainnet'
}

export enum DepositOptions {
  Basic = 'Basic',
  Auto = 'Auto'
}

const emptyPublicKey = new PublicKey(new Uint8Array(32))

export enum SwapType {
  Normal,
  WithHop
}

export const WSOL_ADDRESS = {
  [NetworkType.Mainnet]: new PublicKey('So11111111111111111111111111111111111111112'),
  [NetworkType.Testnet]: new PublicKey('So11111111111111111111111111111111111111112'),
  [NetworkType.Devnet]: new PublicKey('So11111111111111111111111111111111111111112'),
  [NetworkType.Local]: emptyPublicKey
}

export const BTC_ADDRESS = {
  [NetworkType.Mainnet]: emptyPublicKey,
  [NetworkType.Testnet]: new PublicKey('87ZPWWeTNS8iCMakTPwbEpkn7zAfVzxRNUmZCgBdjj4H'),
  [NetworkType.Devnet]: emptyPublicKey,
  [NetworkType.Local]: emptyPublicKey
}

export const ETH_ADDRESS = {
  [NetworkType.Mainnet]: emptyPublicKey,
  [NetworkType.Testnet]: new PublicKey('62rMuAVWh2mQYE9wP4cPhaLDsbn8SzQNbHyJqUM6oQCB'),
  [NetworkType.Devnet]: emptyPublicKey,
  [NetworkType.Local]: emptyPublicKey
}

export const USDC_ADDRESS = {
  [NetworkType.Mainnet]: new PublicKey('HbDgpvHVxeNSRCGEUFvapCYmtYfqxexWcCbxtYecruy8'),
  [NetworkType.Testnet]: new PublicKey('6B8zhSGkjZcQxHCE9RFwYMxT8ipifJ4JZLFTskLMcMeL'),
  [NetworkType.Devnet]: emptyPublicKey,
  [NetworkType.Local]: emptyPublicKey
}

export enum RPC {
  MAIN = 'https://api.mainnet-alpha.sonic.game',
  TEST = 'https://api.testnet.sonic.game',
  LOCAL = 'http://192.168.1.88:9900'
}

export const REFRESHER_INTERVAL = 30

export const PRICE_DECIMAL = 24

export const WSOL_MAIN: Token = {
  tokenProgram: TOKEN_PROGRAM_ID,
  symbol: 'SOL',
  address: WSOL_ADDRESS[NetworkType.Mainnet],
  decimals: 9,
  name: 'Solana',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  coingeckoId: ''
}

export const USDC_MAIN: Token = {
  tokenProgram: TOKEN_2022_PROGRAM_ID,
  symbol: 'USDC',
  address: new PublicKey('HbDgpvHVxeNSRCGEUFvapCYmtYfqxexWcCbxtYecruy8'),
  decimals: 6,
  name: 'USD Coin (Hyperlane)',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  coingeckoId: 'usd-coin'
}

export const USDT_MAIN: Token = {
  tokenProgram: TOKEN_2022_PROGRAM_ID,
  symbol: 'USDT',
  address: new PublicKey('qPzdrTCvxK3bxoh2YoTZtDcGVgRUwm37aQcC3abFgBy'),
  decimals: 6,
  name: 'Tether USD (Hyperlane)',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
  coingeckoId: 'tether'
}

export const SONIC_MAIN: Token = {
  tokenProgram: TOKEN_2022_PROGRAM_ID,
  symbol: 'SONIC',
  address: new PublicKey('mrujEYaN1oyQXDHeYNxBYpxWKVkQ2XsGxfznpifu4aL'),
  decimals: 9,
  name: 'Sonic SVM (Hyperlane)',
  logoURI: 'https://arweave.net/599UDQd5YAUfesAJCTNZ-4ELWLHX5pbid-ahpoJ-w1A',
  coingeckoId: ''
}

export const SSOL_MAIN: Token = {
  tokenProgram: TOKEN_2022_PROGRAM_ID,
  symbol: 'sSOL',
  address: new PublicKey('DYzxL1BWKytFiEnP7XKeRLvgheuQttHW643srPG6rNRn'),
  decimals: 9,
  name: 'Solayer SOL (Hyperlane)',
  logoURI: 'https://raw.githubusercontent.com/solayer-labs/token-metadata/main/logo.jpg',
  coingeckoId: ''
}

export const IRTSSOL_MAIN: Token = {
  tokenProgram: TOKEN_2022_PROGRAM_ID,
  symbol: 'lrtsSOL',
  address: new PublicKey('7JPHd4DQMwMnFSrKJQZzqabcrWfuRvsuWsxwuGbbmFfR'),
  decimals: 9,
  name: 'adraLRT SOL (Solayer) (Hyperlane)',
  logoURI: 'https://ipfs.io/ipfs/QmWGrew8pqdHpzw2pXaFgsbicZWcGyRXiGDTy6huDdC1gu',
  coingeckoId: ''
}

export const SONICSOL_MAIN: Token = {
  tokenProgram: TOKEN_2022_PROGRAM_ID,
  symbol: 'sonicSOL',
  address: new PublicKey('CCaj4n3kbuqsGvx4KxiXBfoQPtAgww6fwinHTAPqV5dS'),
  decimals: 9,
  name: 'Sonic Restaked SOL (Hyperlane)',
  logoURI:
    'https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry/refs/heads/main/deployments/warp_routes/sonicSOL/logo.png',
  coingeckoId: ''
}

export const USDC_TEST: Token = {
  tokenProgram: TOKEN_2022_PROGRAM_ID,
  symbol: 'USDC',
  address: USDC_ADDRESS[NetworkType.Testnet],
  decimals: 9,
  name: 'USD Coin',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  coingeckoId: 'usd-coin'
}

export const BTC_TEST: Token = {
  tokenProgram: TOKEN_PROGRAM_ID,
  symbol: 'BTC',
  address: BTC_ADDRESS[NetworkType.Testnet],
  decimals: 9,
  name: 'Bitcoin',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
  coingeckoId: ''
}

export const ETH_TEST: Token = {
  tokenProgram: TOKEN_PROGRAM_ID,
  symbol: 'SOL',
  address: ETH_ADDRESS[NetworkType.Testnet],
  decimals: 9,
  name: 'Etherum',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk/logo.png',
  coingeckoId: ''
}

export const WSOL_TEST: Token = {
  tokenProgram: TOKEN_PROGRAM_ID,
  symbol: 'SOL',
  address: WSOL_ADDRESS[NetworkType.Testnet],
  decimals: 9,
  name: 'Solana',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  coingeckoId: ''
}

const DEFAULT_PUBLICKEY = new PublicKey(0)
const MAX_U64 = new BN('18446744073709551615')

export const tokensPrices: Record<NetworkType, Record<string, TokenPriceData>> = {
  Devnet: { USDC_DEV: { price: 1 }, BTC_DEV: { price: 64572.0 }, WSOL_DEV: { price: 3430.21 } },
  Mainnet: {},
  Testnet: {
    USDC_TEST: { price: 1 },
    BTC_TEST: { price: 64572.0 },
    WSOL_TEST: { price: 3430.21 },
    MOON_TEST: { price: 0.00000005735 },
    S22_TEST: { price: 0.01 }
  },
  Local: {}
}
export const tokens: Record<NetworkType, Token[]> = {
  Devnet: [],
  Mainnet: [],
  Testnet: [USDC_TEST, BTC_TEST],
  Local: []
}

export const commonTokensForNetworks: Record<NetworkType, PublicKey[]> = {
  Devnet: [],
  Mainnet: [WSOL_MAIN.address, SONIC_MAIN.address, USDC_MAIN.address, USDT_MAIN.address],
  Testnet: [USDC_TEST.address, BTC_TEST.address, WSOL_TEST.address, ETH_TEST.address],
  Local: []
}

export const airdropTokens: Record<NetworkType, PublicKey[]> = {
  Devnet: [],
  Mainnet: [],
  Testnet: [USDC_TEST.address, BTC_TEST.address, ETH_TEST.address],
  Local: []
}

export const airdropTokenPrograms: Record<NetworkType, PublicKey[]> = {
  Devnet: [],
  Mainnet: [],
  Testnet: [USDC_TEST.tokenProgram!, BTC_TEST.tokenProgram!, ETH_TEST.tokenProgram!],
  Local: []
}

export const airdropQuantities: Record<NetworkType, number[]> = {
  Devnet: [],
  Mainnet: [],
  Testnet: [
    100 * 10 ** USDC_TEST.decimals,
    0.001 * 10 ** BTC_TEST.decimals,
    0.1 * 10 ** ETH_TEST.decimals
  ],
  Local: []
}

export const WRAPPED_SOL_ADDRESS = 'So11111111111111111111111111111111111111112'

export const autoSwapPools: {
  pair: {
    tokenX: PublicKey
    tokenY: PublicKey
  }
  swapPool: {
    address: PublicKey
    feeIndex: number
  }
}[] = [
  {
    pair: {
      tokenX: new PublicKey('62rMuAVWh2mQYE9wP4cPhaLDsbn8SzQNbHyJqUM6oQCB'),
      tokenY: new PublicKey('6B8zhSGkjZcQxHCE9RFwYMxT8ipifJ4JZLFTskLMcMeL')
    },
    swapPool: {
      address: new PublicKey('H4QcXPqL88TUhgD2U5CgJRQEn1qMcBbxRkdczTPxP71f'),
      feeIndex: 3
    }
  },
  {
    pair: {
      tokenX: new PublicKey('HbDgpvHVxeNSRCGEUFvapCYmtYfqxexWcCbxtYecruy8'),
      tokenY: new PublicKey('qPzdrTCvxK3bxoh2YoTZtDcGVgRUwm37aQcC3abFgBy')
    },
    swapPool: {
      address: new PublicKey('Eenc7whEWoRHsPnjGrHRP61ZNWqgnWXfSU1vXbN3qzxK'),
      feeIndex: 0
    }
  },
  {
    pair: {
      tokenX: new PublicKey('HbDgpvHVxeNSRCGEUFvapCYmtYfqxexWcCbxtYecruy8'),
      tokenY: new PublicKey('So11111111111111111111111111111111111111112')
    },
    swapPool: {
      address: new PublicKey('4UzNwpTSqx28uRSsBdG8kXpo7reTLjLZLwmXyhZy64Xy'),
      feeIndex: 3
    }
  }
]

export const WSOL_MIN_FAUCET_FEE_TEST = new BN(5000)
export const WSOL_MIN_FAUCET_FEE_MAIN = new BN(5000)

export const WSOL_MIN_DEPOSIT_SWAP_FROM_AMOUNT_TEST = new BN(410000)
export const WSOL_MIN_DEPOSIT_SWAP_FROM_AMOUNT_MAIN = new BN(410000)

// export const WSOL_POSITION_INIT_LAMPORTS_MAIN = new BN(150000)
export const WSOL_POSITION_INIT_LAMPORTS_MAIN = new BN(7300000)
export const WSOL_POSITION_INIT_LAMPORTS_TEST = new BN(7300000)

// export const WSOL_POOL_INIT_LAMPORTS_MAIN = new BN(1000000)
export const WSOL_POOL_INIT_LAMPORTS_MAIN = new BN(110000000)
export const WSOL_POOL_INIT_LAMPORTS_TEST = new BN(110000000)

export const WSOL_CREATE_TOKEN_LAMPORTS_MAIN = new BN(22000000)
export const WSOL_CREATE_TOKEN_LAMPORTS_TEST = new BN(22000000)

export const WSOL_CLOSE_POSITION_LAMPORTS_MAIN = new BN(2600000)
export const WSOL_CLOSE_POSITION_LAMPORTS_TEST = new BN(2600000)

export const WSOL_SWAP_AND_POSITION_INIT_LAMPORTS_MAIN = new BN(100000)
export const WSOL_SWAP_AND_POSITION_INIT_LAMPORTS_TEST = new BN(100000)

export const MINIMUM_PRICE_IMPACT = toDecimal(1, 4)

export const getCreateTokenLamports = (network: NetworkType): BN => {
  switch (network) {
    case NetworkType.Testnet:
      return WSOL_CREATE_TOKEN_LAMPORTS_TEST
    case NetworkType.Mainnet:
      return WSOL_CREATE_TOKEN_LAMPORTS_MAIN
    default:
      throw new Error('Invalid network')
  }
}

export const ALL_FEE_TIERS_DATA = FEE_TIERS.map((tier, index) => ({
  tier,
  primaryIndex: index
}))

export { DEFAULT_PUBLICKEY, MAX_U64 }

export const POSITIONS_PER_PAGE = 5

export const SIGNING_SNACKBAR_CONFIG: Omit<ISnackbar, 'open'> = {
  message: 'Signing transactions...',
  variant: 'pending',
  persist: true
}

export const ADDRESSES_TO_REVERT_TOKEN_PAIRS: string[] = [
  USDC_MAIN.address.toString(),
  USDT_MAIN.address.toString(),
  WSOL_MAIN.address.toString(),
  IRTSSOL_MAIN.address.toString(),
  SSOL_MAIN.address.toString(),
  SONICSOL_MAIN.address.toString()
]

export const FormatConfig = {
  B: 1000000000,
  M: 1000000,
  K: 1000,
  BDecimals: 9,
  MDecimals: 6,
  KDecimals: 3,
  DecimalsAfterDot: 2
}
export enum PositionTokenBlock {
  None,
  A,
  B
}

export const subNumbers = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']

export const defaultPrefixConfig: PrefixConfig = {
  B: 1000000000,
  M: 1000000,
  K: 10000
}

export const getAddressTickerMap = (network: NetworkType): { [k: string]: string } => {
  if (network !== NetworkType.Mainnet) {
    return {
      WSOL: WSOL_ADDRESS[network].toString(),
      BTC: BTC_ADDRESS[network].toString(),
      USDC: USDC_ADDRESS[network].toString(),
      SOL: ETH_ADDRESS[network].toString()
    }
  } else {
    return {
      WSOL: WSOL_ADDRESS[network].toString(),
      USDT: USDT_MAIN.address.toString(),
      USDC: USDC_ADDRESS[network].toString(),
      SONIC: SONIC_MAIN.address.toString(),
      SSOL: SSOL_MAIN.address.toString(),
      IRTSSOL: IRTSSOL_MAIN.address.toString(),
      SONICSOL: SONICSOL_MAIN.address.toString()
    }
  }
}

export const getReversedAddressTickerMap = (network: NetworkType) => {
  return Object.fromEntries(
    Object.entries(getAddressTickerMap(network)).map(([key, value]) => [value, key])
  )
}

export const MINIMAL_POOL_INIT_PRICE = 0.00000001

export const DEFAULT_SWAP_SLIPPAGE = '0.50'
export const DEFAULT_NEW_POSITION_SLIPPAGE = '0.50'
export const DEFAULT_AUTOSWAP_MAX_PRICE_IMPACT = '0.50'
export const DEFAULT_AUTOSWAP_MIN_UTILIZATION = '95.00'
export const DEFAULT_AUTOSWAP_MAX_SLIPPAGE_TOLERANCE_CREATE_POSITION = '2.50'
export const DEFAULT_AUTOSWAP_MAX_SLIPPAGE_TOLERANCE_SWAP = '0.50'

export const CHAINS = [
  { name: Chain.Solana, address: 'https://invariant.app/swap', iconGlow: 'solanaGlow' },
  {
    name: Chain.Eclipse,
    address: 'https://eclipse.invariant.app/exchange',
    iconGlow: 'eclipseGlow'
  },
  { name: Chain.Sonic, address: 'https://sonic.invariant.app/swap', iconGlow: 'sonicGlow' }
]

export const enum SortTypePoolList {
  NAME_ASC,
  NAME_DESC,
  FEE_ASC,
  FEE_DESC,
  FEE_24_ASC,
  FEE_24_DESC,
  VOLUME_ASC,
  VOLUME_DESC,
  TVL_ASC,
  TVL_DESC,
  APY_ASC,
  APY_DESC
}

export const enum SortTypeTokenList {
  NAME_ASC,
  NAME_DESC,
  PRICE_ASC,
  PRICE_DESC,
  // CHANGE_ASC,
  // CHANGE_DESC,
  VOLUME_ASC,
  VOLUME_DESC,
  TVL_ASC,
  TVL_DESC
}

export const RECOMMENDED_RPC_ADDRESS = {
  [NetworkType.Testnet]: RPC.TEST,
  [NetworkType.Mainnet]: RPC.MAIN,
  [NetworkType.Devnet]: '',
  [NetworkType.Local]: ''
}

export const ITEMS_PER_PAGE = 10
export const DEFAULT_TOKEN_DECIMAL = 6

export const PRICE_QUERY_COOLDOWN = 60 * 1000

export const TIMEOUT_ERROR_MESSAGE =
  'Transaction has timed out. Check the details to confirm success'

export const MAX_CROSSES_IN_SINGLE_TX = 10
export const MAX_CROSSES_IN_SINGLE_TX_WITH_LUTS = 34

export const walletNames = {
  [WalletType.NIGHTLY_WALLET]: 'Nightly',
  [WalletType.BACKPACK]: 'Backpack',
  [WalletType.OKX]: 'OKX',
  [WalletType.NIGHTLY]: 'Wallet Selector'
}

export const defaultImages: string[] = [dog1Icon, dog2Icon, cat1Icon, cat2Icon]

export const getPopularPools = (
  network: NetworkType
): { tokenX: string; tokenY: string; fee: string }[] => {
  switch (network) {
    case NetworkType.Mainnet:
      return []
    case NetworkType.Testnet:
      return [
        {
          tokenX: '62rMuAVWh2mQYE9wP4cPhaLDsbn8SzQNbHyJqUM6oQCB',
          tokenY: '6B8zhSGkjZcQxHCE9RFwYMxT8ipifJ4JZLFTskLMcMeL',
          fee: '0.1'
        },
        {
          tokenX: '6B8zhSGkjZcQxHCE9RFwYMxT8ipifJ4JZLFTskLMcMeL',
          tokenY: '87ZPWWeTNS8iCMakTPwbEpkn7zAfVzxRNUmZCgBdjj4H',
          fee: '1'
        },
        {
          tokenX: '6B8zhSGkjZcQxHCE9RFwYMxT8ipifJ4JZLFTskLMcMeL',
          tokenY: 'So11111111111111111111111111111111111111112',
          fee: '0.05'
        },
        {
          tokenX: '6B8zhSGkjZcQxHCE9RFwYMxT8ipifJ4JZLFTskLMcMeL',
          tokenY: 'So11111111111111111111111111111111111111112',
          fee: '0.1'
        }
      ]
    default:
      return []
  }
}

export enum OverviewSwitcher {
  Overview = 'Overview',
  Wallet = 'Wallet'
}

export const STATS_CACHE_TIME = 30 * 60 * 1000
export const PRICE_API_URL = 'https://api.invariant.app/price'

export enum AutoswapCustomError {
  FetchError = 0
}

export enum ErrorCodeExtractionKeys {
  ErrorNumber = 'Error Number:',
  Custom = 'Custom":',
  ApprovalDenied = 'Approval Denied',
  UndefinedOnSplit = "Cannot read properties of undefined (reading 'split')",
  RightBracket = '}',
  Dot = '.'
}

const SLIPPAGE_ERROR_MESSAGE = 'Price changed – increase slippage or retry'

export const ERROR_CODE_TO_MESSAGE: Record<number, string> = {
  0x1778: SLIPPAGE_ERROR_MESSAGE,
  0x1773: SLIPPAGE_ERROR_MESSAGE,
  0x1795: SLIPPAGE_ERROR_MESSAGE,
  0x1796: SLIPPAGE_ERROR_MESSAGE,
  0x1775: SLIPPAGE_ERROR_MESSAGE,
  0x1785: SLIPPAGE_ERROR_MESSAGE
}

export const COMMON_ERROR_MESSAGE: string = 'Failed to send. Please try again'
export const APPROVAL_DENIED_MESSAGE: string = 'Transaction approval rejected'

export const ECLIPSE_MAINNET_GENESIS_HASH = 'EAQLJCV2mh23BsK2P9oYpV5CHVLDNHTxYss3URrNmg3s'
export const SOLANA_MAINNET_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d'

export enum Intervals {
  Daily = '24H',
  Weekly = '1W',
  Monthly = '1M'
  // Yearly = 'yearly' Don't show year in UI
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

export const chartPlaceholder = {
  tickmaps: [
    { x: 2.33021324081296e-7, y: 0, index: -221810 },
    { x: 0.9686056247049151, y: 0, index: -69400 },
    { x: 0.9695746662960968, y: 6188.340066945488, index: -69390 },
    { x: 0.9881717681706338, y: 6188.340066945488, index: -69200 },
    { x: 0.9891603846976637, y: 20119.790531945488, index: -69190 },
    { x: 0.9911405860036346, y: 20119.790531945488, index: -69170 },
    { x: 0.9921321727081341, y: 28142.450909473402, index: -69160 },
    { x: 0.9931247514617308, y: 28142.450909473402, index: -69150 },
    { x: 0.9941183232608597, y: 30289.879997489374, index: -69140 },
    { x: 0.9951128890397407, y: 30289.879997489374, index: -69130 },
    { x: 0.9961084498595902, y: 38407.97691696376, index: -69120 },
    { x: 0.9971050066563205, y: 40591.04743422989, index: -69110 },
    { x: 0.9981025604929676, y: 57249.16422040085, index: -69100 },
    { x: 1.0011012140019244, y: 57249.16422040085, index: -69070 },
    { x: 1.002102765825214, y: 55066.09370313472, index: -69060 },
    { x: 1.0031053196378097, y: 46947.99678366034, index: -69050 },
    { x: 1.00410887650822, y: 44800.567695644364, index: -69040 },
    { x: 1.0071255750875803, y: 44800.567695644364, index: -69010 },
    { x: 1.00813315394147, y: 36777.90731811645, index: -69000 },
    { x: 1.0091417408922565, y: 22846.45685311645, index: -68990 },
    { x: 1.011161942873156, y: 22846.45685311645, index: -68970 },
    { x: 1.0121735599903756, y: 6188.340066945488, index: -68960 },
    { x: 1.0254170502871547, y: 6188.340066945488, index: -68830 },
    { x: 1.0264429288718113, y: 0, index: -68820 },
    { x: 1.0274698338137271, y: 0, index: -68810 },
    { x: 4291452183844.2334, y: 0, index: 221810 }
  ],
  midPrice: { x: 1, index: -69090 },
  leftRange: { index: -69160, x: 0.9921321727081341 },
  rightRange: { index: -69000, x: 1.00813315394147 },
  plotMin: 0.988931976461467,
  plotMax: 1.0113333501881372,
  tickSpacing: 10
}

export const AlternativeFormatConfig = {
  B: 1000000000,
  M: 1000000,
  K: 10000,
  BDecimals: 9,
  MDecimals: 6,
  KDecimals: 3,
  DecimalsAfterDot: 2
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
    decimals: 2
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

export const thresholdsWithTokenDecimal = (decimals: number): FormatNumberThreshold[] => [
  {
    value: 10,
    decimals
  },
  {
    value: 10000,
    decimals: 6
  },
  {
    value: 100000,
    decimals: 4
  },
  {
    value: 1000000,
    decimals: 3
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
