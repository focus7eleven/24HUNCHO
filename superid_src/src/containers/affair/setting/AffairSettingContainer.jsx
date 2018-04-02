import React from 'react'
import LadderComponent from '../../../components/ladder/Ladder'
import AffairBasicSettingContainer from './AffairBasicSettingContainer'
import FirmVerificationContainer from './FirmVerificationContainer'
import AuthContainer from './AuthContainer'
import { connect } from 'react-redux'
import AuditIndexContainer from './audit/AuditIndexContainer'
import HomepageSetting from './HomepageSetting'
import PERMISSION from 'utils/permission'

const AffairSettingContainer = React.createClass({

  getInitialState(){
    return {}
  },

  renderContent(value){
    const affair = this.props.affair
    switch (value) {
      case '基本设置':
        return <AffairBasicSettingContainer key={affair.get('affairId')} affair={affair}/>
      case '认证信息':
        return <FirmVerificationContainer key={affair.get('affairId')} affair={affair}/>
      case '权限设置':
        return <AuthContainer affair={affair} />
      case '审批设置':
        return <AuditIndexContainer key={affair.get('affairId') + affair.get('roleId')} affair={affair}/>
      case '首页设置':
        return <HomepageSetting key={affair.get('affairId')} affair={affair}/>
      default:
        return <AffairBasicSettingContainer key={affair.get('affairId')} affair={affair}/>
    }
  },
  getPermittedTabs(){
    const { affair } = this.props
    let tabs = ['基本设置', '认证信息', '权限设置']
    if (affair.validatePermissions(PERMISSION.SET_APPROVAL)) {
      tabs.push('审批设置')
    }
    if (affair.validatePermissions(PERMISSION.SET_AFFAIR_HOME)) {
      tabs.push('首页设置')
    }
    return tabs
  },
  render(){
    if (!this.props.affair) return null
    let tabs = this.getPermittedTabs()
    if (this.props.affair.get('level') != 1) {
      tabs = tabs.filter((v) => v != '权限设置')
    }
    return (
      <LadderComponent tabs={tabs} renderContent={(index) => this.renderContent(tabs[index])} />
    )
  }
})

function mapStateToProps(state, props) {
  return {
    affair: state.getIn(['affair', 'affairMap', props.params.id]),
  }
}

function mapDispatchToProps() {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(AffairSettingContainer)
