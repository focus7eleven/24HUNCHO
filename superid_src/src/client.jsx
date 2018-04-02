import React from 'react' // eslint-disable-line no-unused-vars
import 'babel-polyfill'
import 'general-polyfill'
import 'fetch'
import 'session'
import reducer from './reducer'
import { createMyStore } from './store'
import routes from './routes'
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom'
import 'common.scss'
export const store = createMyStore(reducer)
ReactDOM.render(
  <Provider store={store}>
    {routes(store)}
  </Provider>,
  document.getElementById('react-root')
)
