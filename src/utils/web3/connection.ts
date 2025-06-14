import { Connection } from '@solana/web3.js'
import { Network } from '@invariant-labs/sdk-sonic'
import { NetworkType, RPC } from '@store/consts/static'

let _connection: Connection | null = null
let _network: string

const getSolanaConnection = (url: string): Connection => {
  if (_connection && _network === url) {
    return _connection
  }
  _connection = new Connection(url, 'confirmed')
  _network = url

  return _connection
}

const networkTypetoProgramNetwork = (type: NetworkType): Network => {
  switch (type) {
    case NetworkType.Devnet:
      return Network.DEV
    case NetworkType.Local:
      return Network.LOCAL
    case NetworkType.Testnet:
      return Network.TEST
    case NetworkType.Mainnet:
      return Network.MAIN
    default:
      return Network.DEV
  }
}

const getCurrentSolanaConnection = (): Connection | null => {
  return _connection
}

export { getSolanaConnection, RPC, getCurrentSolanaConnection, networkTypetoProgramNetwork }
