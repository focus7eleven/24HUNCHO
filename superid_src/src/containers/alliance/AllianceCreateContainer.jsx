import React from 'react'
import { Modal, Button, Input, Checkbox, Row, Col, Icon, Tooltip, Form } from 'antd'
import styles from './AllianceCreateContainer.scss'
import classNames from 'classnames'
import { List } from 'immutable'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createAlliance } from '../../actions/alliance'
import { fetchUserRoleList } from '../../actions/user'
import { fetchAffairList, fetchAffairTree } from '../../actions/affair'
import { pushURL } from 'actions/route'
import menkorCreate from 'images/menkor-create.png'
import config from '../../config'

const TICK_NUMBER = 10

const FormItem = Form.Item

const AllianceCreateContainer = React.createClass({


  getInitialState() {
    return {
      step: 0,
      loading: false,
      checkedList: List(['人事部', '物质部', '财务部', '项目部']),
      name: '',
      code: '', // 创建完成的盟的盟代码
      newAllianceId: null, // 创建完成的盟的ID
      superId: 0, // 创建完成的盟的superId
      rootAffairId: 0, // 创建完成的盟的根事务id
      enterTime: TICK_NUMBER,
    }
  },

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },

  handleNext() {
    if (this.state.step == 0) {
      // 盟名称
      let { getFieldValue, validateFields } = this.props.form
      validateFields((errors) => {
        if (errors) {
          return
        }

        this.props.createAlliance({
          name: getFieldValue('name'),
          code: getFieldValue('code'),
          affairs: '',
        }, (loading) => {
          this.setState({
            loading: loading,
          })
        }).then((res) => {
          if (res.response.code == 0) {
            this.setState({
              step: 2,
              name: res.response.data.name,
              code: res.response.data.code,
              newAllianceId: res.response.data.affairTree.superid,
              rootAffairId: res.response.data.affairTree.id
            })
            this.props.fetchUserRoleList()
            this.props.fetchAffairList()
            this.props.fetchAffairTree()
            this.timer = setInterval(this.tick, 1000)
          }
        })
      })
    } else if (this.state.step == 1) {
            //创建盟,请求服务器,回调函数更改step
        //     this.props.createAlliance({
        //         name: this.state.name,
        //         code: this.state.code,
        //         affairs: this.state.checkedList.join(",")
        //     }, (loading) => {
        //         this.setState({
        //             loading: loading,
        //         });
        //     }).then((res) => {
        //         if (res.response.code == "-1") {
        //             console.error("盟名称不能为空");
        //             return;
        //         }
        //         this.setState({
        //             step: 2,
        //             code: res.response.data.code,
        //             newAllianceId: res.response.data.id,
        //             rootAffairId: res.response.data.affairTree.id
        //         })
        //         this.props.fetchUserRoleList()
        //         this.timer = setInterval(this.tick, 1000)
        //     });
    }
  },

  handleCancel() {
    if (this.timer) {
      clearInterval(this.timer)
    }
    this.setState(this.getInitialState())
    this.props.cancel()
  },

  tick() {
    if (this.timer) {
      this.setState({
        enterTime: this.state.enterTime - 1
      })
      if (this.state.enterTime === 0) {
        clearInterval(this.timer)
        this.timer = null
        this.enterAlliance(this.state.rootAffairId)
      }
    }
  },

  handlePrevious() {
    this.setState({
      step: Math.max(this.state.step - 1, 0),
    })
  },

  handleCheckbox(value, event) {
    let {
      checkedList
    } = this.state
    this.setState({
      checkedList: event.target.checked ? checkedList.push(value) : checkedList.splice(checkedList.indexOf(value), 1)
    })
  },

  isChecked(value) {
    return this.state.checkedList.indexOf(value) + 1
  },

  allianceExists(rule, value, callback) {
    if (!value) {
      callback('请输入盟代码')
    } else {
      fetch(config.api.alliance.code.validation(value), {
        method: 'get',
        credentials: 'include'
      }).then((res) => {
        return res.json()
      }).then((res) => {
        if (res.code != 0) {
          callback('抱歉，该盟代码已被占用。')
        } else {
          callback()
        }
      })
    }
  },

  enterAlliance(affairId) {
    this.handleCancel()
    this.props.pushURL(`/workspace/affair/${affairId}`)

    this.setState(this.getInitialState())
  },

  validateAlliance() {
    this.handleCancel()
    this.props.pushURL(`/workspace/alliance/${this.state.newAllianceId}/verification`)

    this.setState(this.getInitialState())
  },

  renderCheckGroup() {
    let options = ['人事部', '物质部', '财务部', '项目部', '公关部', '市场部', '销售部', '产品部', '技术部']

    return options.map((item) => (
      <Checkbox
        key={item}
        checked={this.isChecked(item)}
        className={classNames(styles.checkbox, this.isChecked(item) ? 'active' : '')}
        onChange={(event) => this.handleCheckbox(item, event)}
      >
        {item}
      </Checkbox>
      )
    )
  },

  renderModalContent(){
    const { getFieldDecorator } = this.props.form

    const nameDecorator = getFieldDecorator('name', {
      initialValue: this.state.name,
      rules: [
        { required: true, pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9_]{2,15}$/, message: '盟名称需要为2-15个汉字、字母或数字' },
      ],
    })
    const codeDecorator = getFieldDecorator('code', {
      initialValue: this.state.code,
      rules: [
        // { validator: this.allianceExists },
        { required: true, pattern: /^[A-Z]{2,15}$/, message: '盟代码需要为2-15位大写字母' },
      ],
    })
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 15 },
    }
    let { name, code, newAllianceId, enterTime } = this.state

    switch (this.state.step) {
      case 0:
        // 第一步,盟名称和盟代码
        return (
          <Form layout="horizontal">
            <div style={{ margin: '20px 0 20px 0' }}>
              <Row>
                <Col className={styles.menkorCreate} span="24">
                  <img src={menkorCreate} alt="盟"/>
                </Col>
                {/* 盟名称 */}
                <FormItem
                  {...formItemLayout}
                  label="盟名称"
                >
                  {nameDecorator(<Input placeholder="盟名称为2到15个汉字、字母或数字" />)}
                </FormItem>
                {/* 盟代码 */}
                <FormItem
                  {...formItemLayout}
                  label="盟代码"
                >
                  {codeDecorator(<Input placeholder="盟代码为2到15位大写字母" style={{ width: 265 }} />)}
                  <Tooltip className={styles.codeTip} arrowPointAtCenter placement="bottomRight" title={'什么是盟代码？\n• 它会成为盟中每个事务ID的前缀\n• 它可以被改变，而且不是一个琐碎的任务'}>
                    <Icon type="question-circle" style={{ width: 16, height: 16, fontSize: 16, marginLeft: 9, color: '#ccc' }}/>
                  </Tooltip>
                </FormItem>
              </Row>
            </div>
            <div className="ant-modal-footer">
              <Button type="ghost" onClick={this.handleCancel}>取消</Button>
              <Button type="primary" onClick={this.handleNext} loading={this.state.loading}>下一步</Button>
            </div>
          </Form>
        )
      case 1:
        // 第二步,选择盟事务
        return (
          <div>
            <div>
              <div className={styles.selectHeader}>
                <div className={`${styles.selectTitle} u-text-14`}>选择创建事务</div>
                <span className="u-text-l-12">我们为您推荐可能需要创建的事务</span>
              </div>
              {this.renderCheckGroup()}
            </div>
            <div className="ant-modal-footer" style={{ 'marginTop': '20px' }}>
              <Button type="ghost" onClick={this.handlePrevious}>上一步</Button>
              <Button type="primary" loading={this.state.loading} onClick={this.handleNext}>下一步</Button>
            </div>
          </div>
        )
      case 2:
        // 创建成功,进入盟
        return (
          <div>
            <div className={`${styles.createResult} u-text-14`}>
              <div className={styles.info}>创建成功！</div>
              <div>您的盟名称为 {name}</div>
              <div>您的盟SuperID为 {newAllianceId}</div>
              <div>您的盟代码为 {code}</div>
              {/*
            <div className={styles.certify}>
              <div>公司真实信息认证后,可以解除受限功能</div>
              <a onClick={this.validateAlliance}>立即认证</a>
            </div>
            */}
            </div>

            <div className="ant-modal-footer" style={{ paddingRight: '10px' }}>
              <Button type="primary" onClick={() => this.enterAlliance(this.state.rootAffairId)}
                style={{ paddingRight: '10px' }}
              >进入盟（{enterTime}）</Button>
            </div>
          </div>
        )
      default:
        return
    }
  },

  render() {
    return (
      <div>
        <Modal
          visible={this.props.visible}
          title="创建盟"
          width={500}
          wrapClassName={styles.modalContainer}
          onCancel={this.handleCancel}
          maskClosable={false}
          footer=""
        >
          {this.renderModalContent()}
        </Modal>
      </div>
    )
  },
})

function mapStateToProps() {
  return {}
}

function mapDispatchToProps(dispatch) {
  return {
    createAlliance: bindActionCreators(createAlliance, dispatch),
    fetchUserRoleList: bindActionCreators(fetchUserRoleList, dispatch),
    fetchAffairList: bindActionCreators(fetchAffairList, dispatch),
    fetchAffairTree: bindActionCreators(fetchAffairTree, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(AllianceCreateContainer))
