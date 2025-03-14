import type { Meta, StoryObj } from '@storybook/react'
import FaucetButton from './FaucetButton'
import { fn } from '@storybook/test'
import { store } from '@store/index'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { BN } from '@coral-xyz/anchor'
import { NetworkType } from '@store/consts/static'

const meta = {
  title: 'Buttons/FaucetButton',
  component: FaucetButton,
  decorators: [
    Story => (
      <Provider store={store}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </Provider>
    )
  ]
} satisfies Meta<typeof FaucetButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    onFaucet: fn(),
    children: 'Faucet',
    network: NetworkType.Mainnet,
    walletBalance: new BN(0)
  }
}
