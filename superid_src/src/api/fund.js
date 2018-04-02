import {
  baseURL
} from './URLConfig'

const fund = {
  add: () => `${baseURL}/fund/add_real_account`,
  list: (currencyType, poolId, onlyValid) => `${baseURL}/fund/real_account_list?currencyType=${currencyType}&poolId=${poolId}&onlyValid=${onlyValid}`,
  pool: () => `${baseURL}/fund/affair_fund_pool/`,
  account: {
    all: (isContainChild) => `${baseURL}/fund/affair_fund_pool_tree?isContainChild=${isContainChild}`
  },
  add_currency: () => `${baseURL}/fund/add_currency_type`,
  role_account: (currencyType) => `${baseURL}/fund/fund_receive_accounts?currencyType=${currencyType}`,
  init_cash_account: (accountId, amount) => `${baseURL}/fund/init_cash_account?accountId=${accountId}&amount=${amount}`,
  transfer: (currency, ownerId, poolId) => `${baseURL}/fund/transfer?currency=${currency}&ownerId=${ownerId}&poolId=${poolId}`,
  invalid: (accountId) => `${baseURL}/fund/invalid_real_account?accountId=${accountId}`,
  public: () => `${baseURL}/fund/public_funds`,
  usable_funds: (poolId) => `${baseURL}/fund/usable_funds?poolId=${poolId}`,
  obtainment: () => `${baseURL}/fund/obtainment`,
  homepage: () => `${baseURL}/fund/show_homepage`,
  add_fund: () => `${baseURL}/fund/add_fund_pool`,
  modify_name: (poolId, roleId, name) => `${baseURL}/fund/modify_name?roleId=${roleId}&poolId=${poolId}&name=${name}`,
  public_type: (poolId, publicType) => `${baseURL}/fund/public_type?poolId=${poolId}&publicType=${publicType}`,
  modify_owner: () => `${baseURL}/fund/modify_owner`,
  remove_pool: (poolId) => `${baseURL}/fund/remove_pool?poolId=${poolId}`,
  usable_account_list: () => `${baseURL}/fund/usable_account_list`,
  currency_types: () => `${baseURL}/fund/currency_types`,
  accept_account: (currencyType) => `${baseURL}/fund/accept_receive_accounts?currencyType=${currencyType}`,
  show_locked: (currency, poolId) => `${baseURL}/fund/show_locked?currency=${currency}&poolId=${poolId}`,
  fundApplicationInfo: () => `${baseURL}/fund/show_fund_application`,
  fundAcquireInfo: () => `${baseURL}/fund/show_fund_obtain`,
  realAccountList: () => `${baseURL}/fund/real_account_list`,
  remind: (orderId) => `${baseURL}/order/remind_order?orderId=${orderId}`,
  cancel: (orderId) => `${baseURL}/order/cancel_order?orderId=${orderId}`,
}

export default fund
