import React from 'react'

import {
  CashIcon, AliPayIcon, WechatIcon, NongYeIcon, GongShangIcon, JiaoTongIcon, TransferIcon,
  ChinaIcon, USAIcon, JapanIcon, EuroIcon, EnglandIcon, HongkongIcon
} from '../public/svg'

const ACCOUNT_TYPE = {
  CASH: 0,
  ICBC: 10, //中国工商银行
  BOCOM: 11, //中国交通银行
  ABC: 12, //中国农业银行
  ALIPAY: 200, // 支付宝
  WECHAT: 201, // 微信钱包
}

const FUND_ICON = {
  'CNY': {
    svg: <ChinaIcon/>,
    text: 'CNY人民币'
  },
  'USD': {
    svg: <USAIcon/>,
    text: 'USD美元'
  },
  'JPY': {
    svg: <JapanIcon/>,
    text: 'JPY日元'
  },
  'EUR': {
    svg: <EuroIcon/>,
    text: 'EUR欧元'
  },
  'GBP': {
    svg: <EnglandIcon />,
    text: 'GBP英镑'
  },
  'HKD': {
    svg: <HongkongIcon/>,
    text: 'HKD港币'
  }
}

/* code means subtype */
const getAccountIcon = function (code) {
  switch (code) {
    case ACCOUNT_TYPE.CASH:
      return <CashIcon style={{ width: 24, height: 24, fill: '#ffa64d' }}/>
    case ACCOUNT_TYPE.ICBC:
      return <GongShangIcon style={{ width: 16, height: 16 }}/>
    case ACCOUNT_TYPE.BOCOM:
      return <JiaoTongIcon style={{ width: 16, height: 16 }}/>
    case ACCOUNT_TYPE.ABC:
      return <NongYeIcon style={{ width: 16, height: 16 }}/>
    case ACCOUNT_TYPE.ALIPAY:
      return <AliPayIcon style={{ width: 16, height: 16 }}/>
    case ACCOUNT_TYPE.WECHAT:
      return <WechatIcon style={{ width: 16, height: 16 }}/>
  }
}

const getAccountTypeName = function (code) {
  switch (code) {
    case ACCOUNT_TYPE.CASH:
      return '现金'
    case ACCOUNT_TYPE.ICBC:
      return '工商银行'
    case ACCOUNT_TYPE.BOCOM:
      return '交通银行'
    case ACCOUNT_TYPE.ABC:
      return '农业银行'
    case ACCOUNT_TYPE.ALIPAY:
      return '支付宝'
    case ACCOUNT_TYPE.WECHAT:
      return '微信钱包'
  }
}

/* code such as 'CNY' */
const getFundIconText = function (code) {
  return FUND_ICON[code]
}

export {
  getAccountIcon,
  getAccountTypeName,
  getFundIconText,
}


export default getAccountIcon
