import './styles/style.css'
import './styles/vehicle.css'
import './styles/menu.css'
import './styles/editor.css'

import { mount } from 'svelte'
import App from './App.svelte'
import { attachMessageBus } from './lib/messageBus.js'
import { IN_NUI } from './lib/nui.js'

attachMessageBus()

if (!IN_NUI && import.meta.env.DEV) {
  await import('./styles/dev.css')
  const { bootDevMock } = await import('./lib/devMock.js')
  bootDevMock()
}

const app = mount(App, { target: document.getElementById('app') })

export default app
