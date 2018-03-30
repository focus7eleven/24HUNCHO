import moment from 'moment'

const chnNumChar = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
const chnUnitSection = ["", "万", "亿", "万亿", "亿亿"]
const chnUnitChar = ["", "十", "百", "千"]

function SectionToChinese(section) {
  var strIns = '',
    chnStr = '';
  var unitPos = 0;
  var zero = true;
  while (section > 0) {
    var v = section % 10;
    if (v === 0) {
      if (!zero) {
        zero = true;
        chnStr = chnNumChar[v] + chnStr;
      }
    } else {
      zero = false;
      strIns = chnNumChar[v];
      strIns += chnUnitChar[unitPos];
      chnStr = strIns + chnStr;
    }
    unitPos++;
    section = Math.floor(section / 10);
  }
  return chnStr;
}

function NumberToChinese(num) {
  var unitPos = 0;
  var strIns = '',
    chnStr = '';
  var needZero = false;

  if (num === 0) {
    return chnNumChar[0];
  }

  while (num > 0) {
    var section = num % 10000;
    if (needZero) {
      chnStr = chnNumChar[0] + chnStr;
    }
    strIns = SectionToChinese(section);
    strIns += (section !== 0) ? chnUnitSection[unitPos] : chnUnitSection[0];
    chnStr = strIns + chnStr;
    needZero = (section < 1000) && (section > 0);
    num = Math.floor(num / 10000);
    unitPos++;
  }

  return chnStr;
}

export const relativeTime = (targetTime) => {
  const now = moment();
  const time = moment(Number.parseInt(targetTime))
  const diff = (moment(now.format('YYYY-MM-DD')).unix() - moment(time.format('YYYY-MM-DD')).unix()) / (60 * 60 * 24)
    if (diff == 0) {
      return time.format("HH:mm");
    } else if (diff == 1) {
      return "昨天 " + time.format("HH:mm")
    } else {
      if (diff > 365)
        return time.format("一年前");
      else
        return time.format("MM-DD HH:mm");
  }
}

export const notificationTime = (targetTime) => {
    const now = moment();
    const time = moment(Number.parseInt(targetTime))
    const diff = (moment(now.format('YYYY-MM-DD')).unix() - moment(time.format('YYYY-MM-DD')).unix()) / (60 * 60 * 24)

    if (diff == 0) {
      return "今天 " + time.format("HH:mm")
    } else if (diff == 1) {
      return "昨天 " + time.format("HH:mm")
    } else {
      if(now.year() > time.year())
          return time.format("YYYY-MM-DD HH:mm");
      else
          return time.format("MM-DD HH:mm");
    }
}

export const announcementTime = (targetTime) => {
  const now = moment();
  const time = moment(Number.parseInt(targetTime))
  const diff = (moment(now.format('YYYY-MM-DD')).unix() - moment(time.format('YYYY-MM-DD')).unix()) / (60 * 60 * 24)

  switch (diff) {
    case 0:
      return time.format("HH:mm");
    default:
      if (now.year() > time.year())
        return time.format("YYYY-MM-DD");
      else
        return time.format("MM-DD");
  }
}
