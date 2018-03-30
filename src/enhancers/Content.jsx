import React from 'react'
import styles from './Content.scss'
import { TransitionMotion, spring } from 'react-motion'

export const ContentPanelHOC = (Logo, Nav, Content) => {
  class ContentPanel extends React.Component{
    render() {
      let renderLogo = false
      const pathname = this.props.location.pathname
      const regex = /\/index\/course\/.*$/
      const result = regex.exec(pathname)
      if (!result) {
        renderLogo = true
      }
      return (
        <div className={styles.container}>
          <div className={styles.header}>
            {renderLogo &&
              <div className={styles.logo} >
                <Logo {...this.props} />
              </div>
            }
            <div className={styles.nav}>
              <Nav {...this.props} />
            </div>
          </div>
          <div className={styles.content}>
            <Content {...this.props} />
          </div>
        </div>
      )
    }
  }
  return ContentPanel
}
