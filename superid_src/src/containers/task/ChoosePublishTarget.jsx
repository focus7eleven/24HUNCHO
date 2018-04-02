import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { Tabs, Input, Tag, Checkbox } from 'antd'
import { SearchIcon, ArrowRight } from 'svg'
import { List, Range, Set } from 'immutable'
import _ from 'underscore'
import styles from './ChoosePublishTarget.scss'
import config from '../../config'
import { constructAffairTree, indexAffairTree } from '../../reducer/affair'
import AffairAvatar from '../../components/avatar/AffairAvatar'

const TabPane = Tabs.TabPane
const ROLE = 'ROLE'
const MENKOR = 'MENKOR'
const ALLIANCE_INNER_AFFAIRE = 'ALLIANCE_INNER_AFFAIRE'

const ChoosePublishTarget = React.createClass({
  propTypes: {
    roleId: PropTypes.number.isRequired,
    affairId: PropTypes.number.isRequired,
    allianceId: PropTypes.number.isRequired,
    style: PropTypes.object,
    alreadyGuestList: PropTypes.object,
    selectedOfficialRoleList: PropTypes.object,
  },

  getDefaultProps() {
    return {
      style: {},
      alreadyGuestList: List(),
      selectedOfficialRoleList: List(),
      onChange: () => {},
    }
  },

  getInitialState() {
    return {
      chosenTagList: Set(),
      tagSearchResult: [],
      roleList: [],
      candidateTags: [],
      affairTree: null,
      affairTreeSelectedPath: null,
      chosenList: [],
      currentPath: [],
    }
  },

  componentWillMount() {
    const { affairId, roleId, user } = this.props
    this.handleSearchTagTextChange = _.debounce(() => {
      const keyword = this._tagInput.refs.input.value

      // 搜索标签
      fetch(config.api.affair.tags.get(keyword || ''), {
        headers: {
          'Accept': 'application/json',
        },
        affairId: affairId,
        roleId: roleId,
        userId: user.get('id'),
        method: 'GET',
        credentials: 'include',
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          this.setState({
            candidateTags: res.data,
          })
        }
      })
    }, 300)
  },

  componentDidMount() {
    this.fetchRoleList(this.props)
    this.fetchAffairTree(this.props)
    this.handleSearchTagTextChange()
  },
  getSearchResultAffair() {
    let result = this.state.chosenTagList.reduce((reduction, tag) => {
      const affairs = this.state.tagSearchResult.get(tag)
      if (affairs) {
        reduction = reduction.concat(affairs)
      }

      return reduction
    }, []).reduce((reduction, v) => {
      // 去重
      if (!reduction.find((w) => w.id === v.id)) {
        reduction.push(v)
      }

      return reduction
    }, [])
    return result
  },
  getChosenList() {
    return this.state.chosenList.reduce((reduction, item) => {
      switch (item.type) {
        case ALLIANCE_INNER_AFFAIRE:
          reduction.innerAlliance.push(item.payload.get('id'))
          return reduction
        case ROLE:
          reduction.innerAffair.push(item.payload.roleId)
          return reduction
        case MENKOR:
          reduction.outerAlliance.push(item.payload.affairId)
          return reduction
        default:
          return reduction
      }
    }, {
      innerAffair: [],
      innerAlliance: [],
      outerAlliance: [],
    })
  },

  // 获取事务内的角色列表
  fetchRoleList(props) {
    fetch(config.api.affair.role.announcementGuests(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      roleId: props.roleId,
      affairId: props.affairId,
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          roleList: json.data,
        })
      }
    })
  },
  fetchAffairTree(props) {
    fetch(config.api.alliance.affairTree.outsideTree(props.allianceId), {
      method: 'GET',
      credentials: 'include',
      affairId: props.affairId,
      roleId: props.roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const affairTree = indexAffairTree(List([constructAffairTree(res.data)]))
        this.setState({
          affairTree,
          affairTreeSelectedPath: List([0])
        })
      }
    })
  },
  fetchTagSearchResult(tag) {
    const { affairId, roleId, user } = this.props
    fetch(config.api.affair.tags.search(JSON.stringify(tag.toJS()), 0, 100), {
      headers: {
        'Accept': 'application/json',
      },
      method: 'GET',
      credentials: 'include',
      userId: user.get('id'),
      affairId: affairId,
      roleId: roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          tagSearchResult: res.data.affairs,
        })
      }
    })
  },

  handleTagClick(value) {
    const {
      chosenTagList
    } = this.state

    if (!chosenTagList.has(value)) {
      this.setState({
        chosenTagList: chosenTagList.add(value)
      })
      this.fetchTagSearchResult(chosenTagList.add(value))
    } else {
      this.setState({
        chosenTagList: chosenTagList.remove(value)
      })
      this.fetchTagSearchResult(chosenTagList.remove(value))
    }
  },
  handleCloseTag(value){
    this.setState({
      chosenTagList: this.state.chosenTagList.remove(value)
    }, () => this.fetchTagSearchResult(this.state.chosenTagList))
  },
  handleChooseOutAlliance(affair, e){
    let chosenList = this.state.chosenList

    if (e.target.checked) {
      chosenList.push({
        type: MENKOR,
        payload: affair,
      })

      this.setState({
        chosenList,
      }, () => this.props.onChange(this.state.chosenList))
    } else {
      this.setState({
        chosenList: this.state.chosenList.filter((v) => v.type !== MENKOR || v.payload.affairId != affair.affairId)
      }, () => this.props.onChange(this.state.chosenList))
    }
  },
  handleChooseInAlliance(affair, e){
    let chosenList = this.state.chosenList

    if (e.target.checked) {
      chosenList.push({
        type: ALLIANCE_INNER_AFFAIRE,
        payload: affair,
      })

      this.setState({
        chosenList,
      }, () => this.props.onChange(this.state.chosenList))
    } else {
      this.setState({
        chosenList: this.state.chosenList.filter((v) => v.type !== ALLIANCE_INNER_AFFAIRE || v.payload.get('id') != affair.get('id'))
      }, () => this.props.onChange(this.state.chosenList))
    }
  },
  handleChooseInAffair(e){
    let chosenList = this.state.chosenList

    if (e.target.checked) {
      chosenList.push({
        type: ROLE,
        payload: e.target.value,
      })

      this.setState({
        chosenList,
      }, () => this.props.onChange(this.state.chosenList))
    } else {
      this.setState({
        chosenList: this.state.chosenList.filter((v) => v.payload !== e.target.value)
      }, () => this.props.onChange(this.state.chosenList))
    }
  },
  renderRoleCheckbox(role) {
    const { chosenList } = this.state

    return (
      <Checkbox checked={!!chosenList.find((w) => w.type === ROLE && w.payload === role)} onChange={this.handleChooseInAffair} value={role}>
        <div className={styles.boxContent}>
          {
            role.avatar
              ? <img className={styles.roleAvatar} src={role.avatar}/>
              : <div className={styles.noRoleAvatar} />
          }
          <span className={styles.name}>{`${role.roleTitle}-${role.username}`}</span>
        </div>
      </Checkbox>
    )
  },
  renderMenkorCheckbox(affair) {
    const { chosenList } = this.state

    return (
      <Checkbox checked={!!chosenList.find((w) => w.type === MENKOR && w.payload.affairId === affair.affairId)} onChange={this.handleChooseOutAlliance.bind(this, affair)} value={affair}>
        <div className={styles.boxContent}>
          { affair.affairAvatar ? <AffairAvatar affair={this.props.affair} sideLength={21}/> : <div className={styles.noAvatar} /> }
          <span className={styles.name}>{affair.affairName}</span>
        </div>
      </Checkbox>
    )
  },

  renderOutAlliance(){
    const {
      candidateTags,
      chosenTagList,
    } = this.state

    return (
      <div className={styles.outAllianceContainer}>
        <div className={styles.tag}>
          <div className={styles.search}>
            <Input placeholder="搜索标签" ref={(ref) => this._tagInput = ref} onChange={this.handleSearchTagTextChange} />
            <span className={styles.searchIcon}><SearchIcon height="14" width="14" fill="#cccccc"/></span>
          </div>
          <div className={styles.result}>
            <span className={styles.title}>常用标签:</span>

            <div className={styles.content}>
              {candidateTags.map((v, k) => <Tag key={`tag${k}`} className={chosenTagList.has(v) ? styles.chosen : null} onClick={this.handleTagClick.bind(null, v)}>{v}</Tag>)}
            </div>

          </div>
        </div>
        <div className={styles.affair}>
          <div className={styles.chosenTag}>
            {
            chosenTagList.map((v, k) => {
              return <Tag key={`chosentag${k}`} className={styles.chosen} closable afterClose={this.handleCloseTag.bind(null, v)}>{v}</Tag>
            })
          }
          </div>
          <div className={styles.affairResult}>
            {
            chosenTagList.size == 0 ? null : this.state.tagSearchResult.map((v, k) => {
              return (
                <div className={styles.checkBox} key={`checkbox${k}`}>
                  {this.renderMenkorCheckbox(v)}
                </div>
              )
            })
          }
          </div>
        </div>
      </div>)
  },
  renderInAlliance() {
    let { affairTree, affairTreeSelectedPath } = this.state
    if (!affairTree) return
    affairTreeSelectedPath = affairTreeSelectedPath.push('children')

    return (
      <div className={styles.inAllianceContainer}>
        {
          Range(0, affairTreeSelectedPath.size + 1, 2).map((i, k) => {
            const children = affairTree.getIn(affairTreeSelectedPath.slice(0, i))
            return this.renderColumn(children, k)
          })
        }
      </div>
    )
  },
  renderColumn(children, key) {
    return children.size ? (
      <div className={styles.column} key={key}>
        {
          children.map((affair, k) => (
            <div className={styles.row} key={k} onClick={() => {
              // e.preventDefault()
              this.setState({ affairTreeSelectedPath: affair.get('_path') })
            }}
            >
              {this.renderAffairCheckbox(affair)}
              {!affair.get('children').size ? null : <ArrowRight fill="#9b9b9b" height="8px" width="8px"/>}
            </div>
          ))
        }
      </div>
    ) : null
  },
  renderAffairCheckbox(affair, withAvatar = false) {
    const {
      chosenList
    } = this.state

    return (
      <Checkbox disabled={affair.get('id') === this.props.affairId} value={affair.get('id')} checked={!!chosenList.find((w) => w.type === ALLIANCE_INNER_AFFAIRE && w.payload.get('id') == affair.get('id'))} onChange={this.handleChooseInAlliance.bind(this, affair)} onClick={(e) => e.stopPropagation()}>
        { withAvatar ? (
          <div className={styles.boxContent}>
            <AffairAvatar sideLength={21} affair={affair}/>
            <span className={styles.name}>{affair.get('name')}</span>
          </div>
        ) : affair.get('name')}
      </Checkbox>
    )
  },
  // 事务内选择
  renderInAffair() {
    let { roleList } = this.state
    roleList = roleList.filter((v) => !!v.username)
      .filter((v) => {return !this.props.alreadyGuestList.some((w) => w.get('roleId') === v.roleId)})
      .filter((v) => {return !this.props.selectedOfficialRoleList.some((w) => w.get('roleId') === v.roleId)})

    return (
      <div className={styles.inAffairContainer}>
        <div className={styles.content}>
          {roleList.map((v, k) => {
            return (
              <div className={styles.checkbox} key={`rolelist${k}`}>
                {this.renderRoleCheckbox(v)}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
  render(){
    const {
      chosenList
    } = this.state

    return (
      <div className={styles.targetContainer} style={this.props.style || {}}>
        <div className={styles.left}>
          <Tabs defaultActiveKey="outAlliance">
            <TabPane key="outAlliance" tab="盟客网">{this.renderOutAlliance()}</TabPane>
            <TabPane key="inAlliance" tab="盟内">{this.renderInAlliance()}</TabPane>
            <TabPane key="inAffair" tab="本事务">{this.renderInAffair()}</TabPane>
          </Tabs>
        </div>

        <div className={styles.right}>
          <div className={styles.title}>已选择:</div>
          <div className={styles.content}>
            {
              chosenList.map((v, k) => {
                switch (v.type) {
                  case ROLE:
                    return (
                      <div key={`row${k}`} className={styles.row}>
                        {this.renderRoleCheckbox(v.payload)}
                      </div>
                    )
                  case ALLIANCE_INNER_AFFAIRE:
                    return (
                      <div key={`row${k}`} className={styles.row}>
                        {this.renderAffairCheckbox(v.payload, true)}
                      </div>
                    )
                  case MENKOR:
                    return (
                      <div key={`row${k}`} className={styles.row}>
                        {this.renderMenkorCheckbox(v.payload)}
                      </div>
                    )
                  default:
                    return null
                }
              })
            }
          </div>
        </div>
      </div>
    )
  }
})

export default connect((state) => ({
  affairList: state.getIn(['affair', 'affairList']),
  user: state.get('user')
}), null, null, { withRef: true })(ChoosePublishTarget)
