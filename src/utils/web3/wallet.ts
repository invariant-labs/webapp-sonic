import { WalletAdapter } from './adapters/types'
import { NightlyWalletAdapter } from './adapters/nightly'
import { BackpackWalletAdapter } from './adapters/backpack'
import { WalletType } from '@store/consts/types'
import { sleep } from '@invariant-labs/sdk-sonic'
import { NightlyAdapter } from './adapters/nightly-wallet'
import { OkxWalletAdapter } from './adapters/okx'

let _wallet: WalletAdapter

const getSolanaWallet = (): WalletAdapter => {
  return _wallet
}

const disconnectWallet = async () => {
  await _wallet.disconnect()
}

const connectStaticWallet = async (wallet: WalletType) => {
  switch (wallet) {
    case WalletType.BACKPACK:
      _wallet = new BackpackWalletAdapter()
      break
    case WalletType.NIGHTLY_WALLET:
      _wallet = new NightlyAdapter()
      break
    case WalletType.OKX:
      _wallet = new OkxWalletAdapter()
      break
    default:
      _wallet = new BackpackWalletAdapter()
      break
  }

  await sleep(300)
  await _wallet.connect()

  return _wallet.connected ? (localStorage.setItem('WALLET_TYPE', wallet.toString()), true) : false
}

const changeToNightlyAdapter = () => {
  _wallet = new NightlyWalletAdapter()
}

export { getSolanaWallet, disconnectWallet, connectStaticWallet, changeToNightlyAdapter }
