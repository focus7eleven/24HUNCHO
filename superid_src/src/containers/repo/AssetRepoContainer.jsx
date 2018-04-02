import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pushURL } from 'actions/route'
import { Button } from 'antd'
import styles from './AssetRepoContainer.scss'

const AssetRepoContainer = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired,
  },
  getInitialState(){
    return {
      view: 'asset',
    }
  },
  renderHeader() {
    const path = this.props.location.pathname

    if (path && ~path.indexOf('/asset')) {
      return (
        <div className={styles.header}>
          <div><span>{`${this.props.affair.get('name')}物资总览`}</span></div>
          <div className={styles.navigateBar} onClick={() => {
            this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo`)
          }}
          >&lt;返回仓库列表
          </div>
        </div>
      )
    } else if (path && ~path.indexOf('./index')){
      return (
        <div className={styles.header}>
          <div>
            <span className={styles.link}>
              {`${this.props.affair.get('name')}仓库`}
            </span>
          </div>
        </div>
      )
    }
    else if (path && ~path.indexOf('/public')) {
      return (
        <div className={styles.header}>
          <div>
            <span className={styles.link} onClick={() => {
              this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo`)
            }}
            >{`${this.props.affair.get('name')}仓库`}</span>

            <span style={{ color: '#9b9b9b' }}> > </span>
            {`${this.props.affair.get('name')}公共仓库`}
          </div>
          <Button type="ghost" onClick={() => {
            this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/activity`)
          }}
          >查看仓库动态</Button>
        </div>
      )
    } else if (path && ~path.indexOf('/activity')) {
      return (
        <div className={styles.header}>
          <div>
            <span className={styles.link} onClick={() => {
              this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo`)
            }}
            >{`${this.props.affair.get('name')}仓库`}</span>

            <span style={{ color: '#9b9b9b' }}> > </span>

            <span className={styles.link} onClick={() => {
              this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/public`)
            }}
            >{`${this.props.affair.get('name')}公共仓库`}</span>

            <span style={{ color: '#9b9b9b' }}> > </span>

            仓库动态
          </div>
        </div>
      )
    } else {
      return (
        <div className={styles.header}>
          <div>{`${this.props.affair.get('name')}仓库列表`}</div>
          <div className={styles.navigateBar} onClick={() => {
            this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/asset`)
          }}
          >查看物资总览 >
          </div>
        </div>
      )
    }
  },
  render(){
    const childrenProps = {
      affair: this.props.affair,
    }

    return (
      <div className={styles.container}>
        {/*{this.renderHeader()}*/}
        {React.cloneElement(this.props.children, childrenProps)}
        {/*<WarehouseList affair={this.props.affair}/>*/}
      </div>
    )
  }
})

function mapStateToProps() {
  return {}
}

function mapDispatchToProps(dispatch) {
  return {
    pushURL: bindActionCreators(pushURL, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AssetRepoContainer)
