import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { fetchAffairTree } from '../../actions/affair'
import config from '../../config'
import { TreeSelect } from 'antd'
import styles from './AffairTreeSelect.scss'

const ALL_AFFAIR = {
  value: '0',
  label: '全部事务',
}
const AffairTreeSelect = React.createClass({
  propTypes: {
    affair: React.PropTypes.object,
    onChange: React.PropTypes.func.isRequired,
  },
  getDefaultProps(){
    return {
      defaultSelectAll: true,
      filterSelf: false,
    }
  },
  getInitialState(){
    return {
      affairDataSource: [],
      allAffairList: [],
      selectedAffairList: [],
      text: '',
    }
  },
  componentWillMount(){
    const { affair, filterSelf } = this.props
    const parseData = (data) => {
      const affairDataSource = [{
        label: ALL_AFFAIR.label,
        value: ALL_AFFAIR.value,
        key: ALL_AFFAIR.value,
        children: [],
      }].concat(data.map((child) => (this.parseAffairToNode(child, ALL_AFFAIR.value))))

      //这里 allAffair会包括 ‘全部事务’
      const allAffairList = affairDataSource.map(this.parseTreeAsPlain).reduce((a, b) => a.concat(b), [])
      this.setState({
        affairDataSource: affairDataSource,
        allAffairList: allAffairList,
        selectedAffairList: this.props.defaultSelectAll ? allAffairList : this.state.selectedAffairList,
        text: this.props.defaultSelectAll ? ALL_AFFAIR.label : '',
      })
      this.props.onChange && this.props.onChange(this.state.allAffairList.map((affair) => affair.id).slice(1))
    }
    if (affair != null) {
      // 如果传入事务，则使用当前盟
      fetch(config.api.alliance.simpleTree(this.props.affair.get('allianceId')), {
        method: 'GET',
        credentials: 'include',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
      }).then((res) => res.json()).then((json) => {
        if (json.code === 0) {
          if (!filterSelf) {
            parseData([json.data])
          } else {
            parseData(json.data.children)
          }
        }
      })
    } else {
      // 否则使用所有盟
      this.props.fetchAffairTree().then((json) => {
        parseData(json)
      })
    }

  },
  parseAffairToNode(affair, prefix){
    const path = `${prefix}-${affair.id}`
    return {
      label: affair.name,
      value: path,
      id: affair.id,
      key: path,
      children: affair.children.map((child) => (this.parseAffairToNode(child, path)))
    }
  },
  parseTreeAsPlain(node){
    return [node].concat(node.children.map(this.parseTreeAsPlain).reduce((a, b) => a.concat(b), []))
  },
  render(){
    const selectable = this.state.affairDataSource.length != 1
    return (
      <div className={styles.select}>
        <TreeSelect
          treeData={this.state.affairDataSource}
          multiple
          treeCheckable
          treeCheckStrictly
          treeDefaultExpandAll
          placeholder={selectable ? '选择事务' : '无可选事务'}
          disabled={!selectable}
          showCheckedStrategy={TreeSelect.SHOW_PARENT}
          dropdownMatchSelectWidth={false}
          dropdownStyle={{
            maxHeight: '500px',
            overflow: 'auto',
          }}
          value={this.state.selectedAffairList}
          onChange={(value, label, extra) => {
            let nextSelectedAffairList = []
            let nextText = ''
            if (extra.triggerValue == ALL_AFFAIR.value) {
              if (extra.checked) {
                nextSelectedAffairList = this.state.allAffairList
                nextText = ALL_AFFAIR.label
              } else {
                nextSelectedAffairList = []
                nextText = ''
              }
            } else {
              // 把所有的value取出来
              const allAffairValueList = this.state.allAffairList.map((affair) => affair.value)
              const selectedAffairValueList = value.map((affair) => affair.value)
              // 如果选中了所有事务，则需要再选中全部事务
              if (extra.checked && allAffairValueList.slice(1).every((val) => selectedAffairValueList.includes(val))) {
                nextSelectedAffairList = [ALL_AFFAIR].concat(value)
                nextText = ALL_AFFAIR.label
              } else {
                  //没有选中所有事务，如果‘全部事务’被选中，需要去掉
                if (selectedAffairValueList.includes(ALL_AFFAIR.value)) {
                  nextSelectedAffairList = value.slice(1)
                  nextText = value.slice(1).map((obj) => (obj.label)).join('、')
                } else {
                  nextSelectedAffairList = value
                  nextText = value.map((obj) => (obj.label)).join('、')
                }
              }
            }
            this.setState({
              selectedAffairList: nextSelectedAffairList,
              text: nextText,
            })
            this.props.onChange && this.props.onChange(nextSelectedAffairList
              .map((affair) => {
                const path = affair.value
                if (path == ALL_AFFAIR.value) {
                  return ALL_AFFAIR.value
                }
                return path.slice(path.lastIndexOf('-') + 1)
              })
              .filter((val) => val != ALL_AFFAIR.value)
            )
          }}
        />
        <div className={styles.selectedAffair}>{this.state.text}</div>
      </div>
    )
  }
})

function mapDispatchToProps(dispatch){
  return {
    fetchAffairTree: bindActionCreators(fetchAffairTree, dispatch),
  }
}
export default connect((state) => ({
  affairList: state.getIn(['affair', 'affairList'])
}), mapDispatchToProps)(AffairTreeSelect)
