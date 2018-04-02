const currencyFormatter=require('currency-formatter')
currencyFormatter.findCurrency('EUR').symbolOnLeft=true
currencyFormatter.findCurrency('EUR').spaceBetweenAmountAndSymbol=false
currencyFormatter.findCurrency('EUR').thousandsSeparator=','
currencyFormatter.findCurrency('EUR').decimalSeparator='.'
currencyFormatter.findCurrency('JPY').decimalDigits=2
currencyFormatter.findCurrency('JPY').symbol='JP¥'


export default currencyFormatter
