import React from 'react'
import styles from './AssetCard.scss'
import { AssetIcon } from 'svg'
import { Modal, Icon } from 'antd'
import classnames from 'classnames'
import ReceiveAssetModal, { RECEIVE_ASSET_TYPE } from '../../containers/repo/ReceiveAssetModal'
import FeedbackModal, { FEEDBACK_TYPE } from '../../containers/repo/FeedbackModal'
import config from '../../config'

const PropTypes = React.PropTypes

export const ASSET_CARD_POSITION = {
  LEFT: 'left',
  RIGHT: 'right'
}

const AssetCard = React.createClass({
  propTypes: {
    message: PropTypes.object.isRequired,
    roleId: PropTypes.number.isRequired,
    position: PropTypes.string.isRequired,
    affair: PropTypes.object.isRequired
  },

  getDefaultProps() {
    return {
      position: ASSET_CARD_POSITION.LEFT,
    }
  },
  getInitialState(){
    return {
      assetFeedbackModalVisible: false, //发送方modal
      assetReceiveModalVisible: false, //接收方modal
      order: null, //交易
      warehouseList: [], //接收方的可接收仓库列表
      isThirdParty: false //是否为第三方，既不是接收方也不是发送方，但是能看到交易详情
    }
  },

  //获取物资详情
  fetchOrder(roleId, orderId) {
    fetch(config.api.order.material_order(orderId), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          order: json.data
        })
      }
    })
  },

  //打开物资详情
  handleOpenAsset(){
    const content = JSON.parse(this.props.message.content)
    const { roleId } = this.props

    fetch(config.api.order.material_order(content.orderId), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 403) {
        //无权限者无法查看交易详情
        Modal.warning({
          className: styles.modalConfirm,
          content: <div className={styles.confirmContent}><Icon type="info-circle"/>您无权限查看该物资！</div>,
          okText: '确定',
          width: 500,
        })
        return
      }

      const order = res.data
      if (order.toRoleId === roleId) {
        //接收方
        fetch(config.api.material.warehouse.role_warehouse(), {
          method: 'GET',
          credentials: 'include',
          roleId: roleId,
          affairId: this.props.affairId,
        }).then((res1) => res1.json()).then((res1) => {
          this.setState({
            assetReceiveModalVisible: true,
            order: order,
            warehouseList: res1.data
          })
        })
      } else if (order.fromRoleId === roleId) {
        //发送方
        this.setState({
          assetFeedbackModalVisible: true,
          order: order,
        })
      } else {
        this.setState({
          assetReceiveModalVisible: true,
          order: order,
          isThirdParty: true
        })
      }

    })
  },

  render() {
    const { position, message, affair, toRole } = this.props
    const { assetReceiveModalVisible, assetFeedbackModalVisible, order, warehouseList, isThirdParty } = this.state
    const content = JSON.parse(message.content)
    const cardClassName = classnames(
      styles.assetCard,
      position === ASSET_CARD_POSITION.LEFT ? styles.bulgeLeft : styles.bulgeRight)
    
    const roleName = toRole ? toRole.roleTitle + '-' + toRole.username : ''


    return (
      <div className={cardClassName} onClick={this.handleOpenAsset}>
        <div className={styles.description}>
          <div style={{ margin: '10px' }}><AssetIcon width={30} height={30} fill={'#ffffff'}/></div>
          <div>
            <div className={styles.remark} title={content.remark}>{content.remark}</div>
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.state}>
            <img src={toRole ? toRole.avatar : ''} alt=""/>
            <span className={styles.roleName} title={roleName}>{roleName}</span>
          </div>
        </div>
        {assetReceiveModalVisible ?
          <ReceiveAssetModal visible={assetReceiveModalVisible}
            type={isThirdParty ? RECEIVE_ASSET_TYPE.THIRD : RECEIVE_ASSET_TYPE.NORMAL}
            chatMsg={message}
            callback={() => this.setState({ assetReceiveModalVisible: false })}
            orderId={content.orderId}
            toRoleId={order.toRoleId}
            order={order}
            warehouseList={warehouseList}
            fetchOrder={this.fetchOrder}
          /> : null
        }
        {assetFeedbackModalVisible ?
          <FeedbackModal visible={assetFeedbackModalVisible}
            type={FEEDBACK_TYPE.CHAT}
            affair={affair}
            chatMsg={message}
            callback={() => this.setState({ assetFeedbackModalVisible: false })}
            orderId={content.orderId}
            toRoleId={order.toRoleId}
            order={order}
            fetchOrderDetail={this.fetchOrder}
          /> : null
        }
      </div>
    )
  }
})

export default AssetCard
