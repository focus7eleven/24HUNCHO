import 'babel-polyfill'
import 'general-polyfill'
import 'fetch'
import 'react-hot-loader/patch'

import Client from 'eternal-client-web'
import ReactDOM from 'react-dom'
import React from 'react'
import { AppContainer } from 'react-hot-loader'
import MyAppContainer from './client'
import registerServiceWorker from './registerServiceWorker'
import { createMyStore } from './store'
import reducer from './reducer'

// chat client
window.SocketClient = Client

export const store = createMyStore(reducer)

const render = (Component) => {
  ReactDOM.render(
    <AppContainer>
      <Component store={store} />
    </AppContainer>, document.getElementById('root'))
}

render(MyAppContainer)

// Hot Module Replacement API
if (module.hot) {
  const NextAppContainer = require('./client').default
  module.hot.accept('./client', () => {
    render(NextAppContainer)
  })
}

registerServiceWorker()
