import React from 'react'
import * as svgs from 'svg'
import { Map } from 'immutable'
import styles from './SVGDemoComponent.scss'

class SVGDemoComponent extends React.Component {
  render(){
    return (
      <div className={styles.container}>
        {
          Map(svgs).map((Svg) => {
            const type = typeof Svg
            if (type === 'function') {
              return <Svg />
            }
            if (type === 'object') {
              return Svg
            }
            return null
          }).map((v, k) => <div key={k} className={styles.svgGroup}>{v}<div>{k}</div></div>).toList()
        }
      </div>
    )
  }
}

export default SVGDemoComponent
