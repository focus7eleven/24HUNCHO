import React from 'react'
import styles from './Content.scss'
import { TransitionMotion, spring } from 'react-motion'

export const ContentPanelHOC = (Logo, Nav, Content, key) => {
  const ContentPanel = React.createClass({
    willLeave() {
      return {
        opacity: spring(0, {
          stiffness: 211,
          damping: 12
        })
      }
    },
    willEnter() {
      return {
        opacity: 1
      }
    },

    render() {
      return (
        <TransitionMotion
          willLeave={this.willLeave}
          willEnter={this.willEnter}
          defaultStyles={[{
            key: key,
            style: { opacity: 0 }
          }]}
          styles={[{
            key: key,
            style: { opacity: spring(1) },
          }]}
        >
          {
            (interpolatedStyles) =>
  (<div className={styles.container}>
    {interpolatedStyles.map((config) => {
      return (
        <div style={{ ...config.style, height: '100%' }} key={config.key}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <Logo {...this.props} />
            </div>
            <div className={styles.nav}>
              <Nav {...this.props} />
            </div>
          </div>
          <div className={styles.content}>
            <Content {...this.props} />
          </div>
        </div>
      )
    })}
  </div>)
          }
        </TransitionMotion>

      )
    }
  })

  return ContentPanel
}
