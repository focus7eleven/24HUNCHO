import React from 'react'
import styles from './District.scss'
import { Input, Icon, Tabs } from 'antd'
import { options } from '../../utils/area'
import classNames from 'classnames'

const TabPane = Tabs.TabPane

const District = React.createClass({
  propTypes: {
    width: React.PropTypes.string.isRequired,
  },

  getDefaultProps(){
    return {
      width: '300px',
      onChange: () => {},
      onChangeCounty: () => {},
    }
  },

  getInitialState(){
    const { defaultValue } = this.props
    const addrs = defaultValue ? defaultValue.split(' / ') : []
    const province = addrs.length > 0 ? addrs[0] : null
    const city = addrs.length > 1 ? addrs[1] : null
    const county = addrs.length > 2 ? addrs[2] : null
    return {
      district: this.props.defaultValue || '',
      tabKey: '1',
      provinceArray: [],
      provinceForRender: [],
      cityArray: [],
      countyArray: [],
      province: province || '',
      city: city || '',
      county: county || '',
      showSelector: false,
      flattenOptions: [],
      searchResult: [],
      canInput: addrs.length == 0,
      arrowType: true, //True: down  False: cross-circle-o
    }
  },

  getFlattenOptions(options, ancestor = []){
    let flattenOptions = []
    options.forEach((option) => {
      const path = ancestor.concat(option.label)
      if (!option.children) {
        flattenOptions.push(path)
      }
      if (option.children) {
        flattenOptions.push(path)
        flattenOptions = flattenOptions.concat(this.getFlattenOptions(option.children, path))
      }
    })
    return flattenOptions
  },

  getSortedProvince(provinceArray){
    const provinceAG = { title: 'A-G', data: provinceArray.slice(0, 8) }
    const provinceHK = { title: 'H-K', data: provinceArray.slice(8, 17) }
    const provinceLS = { title: 'L-S', data: provinceArray.slice(17, 26) }
    const provinceTZ = { title: 'T-Z', data: provinceArray.slice(26, 31) }
    const provinceSpe = { title: '', data: provinceArray.slice(31) }
    const provinceForRender = [provinceAG, provinceHK, provinceLS, provinceTZ, provinceSpe]
    this.setState({ provinceForRender })
  },

  componentWillMount(){
    const taiwan = options.find((value) => value.label === '台湾')
    const hongkong = options.find((value) => value.label === '香港')
    const macau = options.find((value) => value.label === '澳门')
    let provinceArray = options.sort((a, b) => a['label'].localeCompare(b['label'], 'zh')).filter((value) => value.label !== '台湾' && value.label !== '香港' && value.label !== '澳门')
    provinceArray = provinceArray.concat([taiwan, hongkong, macau])
    provinceArray = provinceArray.map((p) => {p.isSelected = 0;return p})
    this.getSortedProvince(provinceArray)
    const flattenOptions = this.getFlattenOptions(provinceArray)
    this.setState({ provinceArray, flattenOptions })
  },

  componentDidMount(){
    window.addEventListener('click', this.handleFadeOut)
  },

  componentWillUnmount(){
    window.removeEventListener('click', this.handleFadeOut)
  },

  handleProvSelected(ref){
    const provinceArray = this.state.provinceArray.map((p) => {p.label === ref ? p.isSelected = 1 : p.isSelected = 0;return p})
    const children = this.state.provinceArray.find((value) => value.label === ref).children
    const cityArray = children ? children.map((c) => {c.isSelected = 0;return c}) : []
    const tabKey = cityArray.length ? '2' : '1'
    tabKey === '1' ? this.handleFadeOut() : null
    this.setState({ provinceArray, province: ref, cityArray, tabKey, countyArray: [], district: ref, canInput: false })
    this.props.onChange(ref)
  },

  handleCitySelected(ref){
    const cityArray = this.state.cityArray.map((c) => {c.label === ref ? c.isSelected = 1 : c.isSelected = 0;return c})
    const children = this.state.cityArray.find((value) => value.label === ref).children
    const countyArray = children ? children.map((c) => {c.isSelected = 0;return c}) : []
    const tabKey = countyArray.length ? '3' : '2'
    tabKey === '2' ? this.handleFadeOut() : null
    this.setState({ city: ref, countyArray, tabKey, district: this.state.province + ' / ' + ref, cityArray, canInput: false })
    this.props.onChange(this.state.province + ' / ' + ref)
  },

  handleCountySelected(ref){
    const countyArray = this.state.countyArray.map((c) => {c.label === ref ? c.isSelected = 1 : c.isSelected = 0;return c})
    this.handleFadeOut()
    this.setState({ county: ref, district: this.state.province + ' / ' + this.state.city + ' / ' + ref, countyArray, canInput: false })
    this.props.onChange(this.state.province + ' / ' + this.state.city + ' / ' + ref)
    this.props.onChangeCounty(this.state.province + ' / ' + this.state.city + ' / ' + ref)
  },

  handleTabClicked(tabKey){
    this.setState({ tabKey })
  },

  handleFadeIn(){
    this.refs.districtArrow.style.transform = 'scale(0.8) rotate(180deg)'
    this.refs.districtSelector.style.height = '230px'
    this.refs.districtSelector.style.opacity = '1'
    this.setState({ showSelector: true })
  },

  handleFadeOut(){
    this.refs.districtArrow.style.transform = 'scale(0.8) rotate(0deg)'
    this.refs.districtSelector.style.height = '0'
    this.refs.districtSelector.style.opacity = '0'
    this.setState({ showSelector: false })
  },

  handleInputClicked(e){
    e.preventDefault()
    e.stopPropagation()
    this.handleFadeIn()
  },

  handleInputBlur(e){
    e.preventDefault()
    e.stopPropagation()
    if (this.state.canInput){
      const hasSelected = this.state.searchResult.indexOf(this.state.district)
      if (hasSelected === -1){
        this.props.onChange()
      }
    }
  },

  handleArrowClicked(e){
    e.preventDefault()
    e.stopPropagation()
    if (this.state.canInput) {
      this.state.showSelector ? this.handleFadeOut() : this.handleFadeIn()
    } else {
      const provinceArray = this.state.provinceArray.map((p) => {p.isSelected = 0;return p})
      this.getSortedProvince(provinceArray)
      this.handleFadeIn()
      this.setState({ canInput: true, district: '', tabKey: '1', arrowType: true, provinceArray, cityArray: [], countyArray: [], searchResult: [] })
      this.props.onChange()
    }
  },

  handleArrowChanged(){
    this.state.canInput ? null : this.setState({ arrowType: !this.state.arrowType })
  },

  handleInputChange(e){
    if (this.state.canInput) {
      this.setState({ district: e.target.value })
      if (e.target.value !== '') {
        const searchResult = this.state.flattenOptions.filter((path) => {
          return path.some((option) => option.indexOf(e.target.value) > -1)
        })
        this.setState({ searchResult })
      } else {
        const provinceArray = this.state.provinceArray.map((p) => {p.isSelected = 0;return p})
        this.getSortedProvince(provinceArray)
        this.setState({ canInput: true, district: '', tabKey: '1', arrowType: true, provinceArray, cityArray: [], countyArray: [], searchResult: [] })
      }
    }
    this.props.onChange(e)
  },

  handleResultHighlight(res){
    const highlight = res.join(' / ').split(this.state.district).map((node, index) => index === 0 ? node : [
      <span key="seperator">{this.state.district}</span>,
      node,
    ])
    return highlight
  },

  handleSearchItemClicked(index){
    const result = this.state.searchResult[index]
    const province = result[0]
    let city = ''
    let county = ''
    let cityArray = []
    let countyArray = []
    let children = []
    let tabKey = '1'
    if (result.length >= 2){
      city = result[1]
      children = this.state.provinceArray.find((value) => value.label === province).children
      cityArray = children ? children.map((c) => {c.label === city ? c.isSelected = 1 : c.isSelected = 0;return c}) : []
      children = cityArray.find((value) => value.label === city).children
      countyArray = children ? children.map((c) => {c.isSelected = 0;return c}) : []
      tabKey = '2'
      if (result.length === 3){
        county = result[2]
        countyArray = children ? children.map((c) => {c.label === county ? c.isSelected = 1 : c.isSelected = 0;return c}) : []
        tabKey = '3'
      }
    }
    this.setState({ district: this.state.searchResult[index].join(' / '), province, city, county, tabKey, cityArray, countyArray, canInput: false })
    this.props.onChange(this.state.searchResult[index].join(' / '))
  },

  renderSelectPanel(){
    const { tabKey, provinceForRender, cityArray, countyArray } = this.state

    return (
      <Tabs defaultActiveKey={tabKey} activeKey={tabKey} onTabClick={this.handleTabClicked}>
        <TabPane tab="省份" key="1">
          <div className={styles.provinceContainer}>
            {
              provinceForRender.map((item) => {
                return (
                  <div key={item.title} className={styles.provinceLayout}>
                    <div>{item.title}</div>
                    <div>
                      {
                        item.data.map((data) => {
                          return <span onClick={() => this.handleProvSelected(data.label)} key={data.label} className={classNames({ [styles.normalSpan]: !data.isSelected, [styles.selectedSpan]: data.isSelected })}>{data.label.endsWith('省') ? data.label.slice(0, -1) : data.label}</span>
                        })
                      }
                    </div>
                  </div>
                )
              })
            }
          </div>
        </TabPane>
        <TabPane tab="城市" key="2">
          <div className={styles.cityContainer}>
            {
              cityArray.map((item) => {
                return (
                  <span key={item.label} onClick={() => this.handleCitySelected(item.label)} className={classNames({ [styles.normalSpan]: !item.isSelected, [styles.selectedSpan]: item.isSelected })}>{item.label}</span>
                )
              })
            }
          </div>
        </TabPane>
        <TabPane tab="县区" key="3">
          <div className={styles.cityContainer}>
            {
              countyArray.map((item) => {
                return (
                  <span key={item.label} onClick={() => this.handleCountySelected(item.label)} className={classNames({ [styles.normalSpan]: !item.isSelected, [styles.selectedSpan]: item.isSelected })}>{item.label}</span>
                )
              })
            }
          </div>
        </TabPane>
      </Tabs>
    )
  },

  renderSearchPanel(){
    const { searchResult } = this.state
    return (
      searchResult.length == 0 ? <div className={styles.notFound}>Not Found</div> :
      searchResult.map((res, index) => {
        return (
          <div className={styles.searchItem} key={index} onClick={() => this.handleSearchItemClicked(index)}>{this.handleResultHighlight(res)}</div>
        )
      })
    )
  },

  render(){
    const { district, canInput, arrowType } = this.state

    const { width, ...others } = this.props

    return (
      <div style={{ 'width': width, 'position': 'relative' }}>
        <Input className={styles.input} size="large" {...others} value={district} onChange={this.handleInputChange} onClick={this.handleInputClicked} onBlur={this.handleInputBlur}/>
        <span ref="districtArrow" className={styles.arrow} onClick={this.handleArrowClicked} onMouseOver={this.handleArrowChanged} onMouseOut={this.handleArrowChanged}>
          <Icon type={arrowType ? 'down' : 'cross-circle'} />
        </span>
        <div className={styles.selector} ref="districtSelector" onClick={(e) => {e.preventDefault();e.stopPropagation()}}>
          {
            canInput && district.length > 0 ? this.renderSearchPanel() : this.renderSelectPanel()
          }
        </div>
      </div>
    )
  }
})

export default District
