const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatDay = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return [year, month, day].map(formatNumber).join('-');
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const utcStrToDate = (str) => {
  return new Date(Date.UTC(str.substr(0, 4), str.substr(5, 2) - 1, str.substr(8, 2) - 0, str.substr(11, 2) - 0, str.substr(14, 2) - 0, str.substr(17, 2) - 0));
}

const calDateStrByGap = (str, aft) => {
  const date = new Date(str.substr(0, 4), str.substr(5, 2) - 1, str.substr(8, 2) - 0 + aft);
  return formatDay(date);
}

const fmtDateWeekStr = (str) => {
  const date = new Date(str.substr(0, 4), str.substr(5, 2) - 1, str.substr(8, 2) - 0);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const week = date.getDay();
  const weekStr = "星期" + "日一二三四五六".charAt(week);
  const res = year + '年' +
    formatNumber(month) + '月' +
    formatNumber(day) + "日" +
    weekStr
  return res;
}

const nextDate = (str)=>{
  const date = new Date(str.substr(0, 4), str.substr(5, 2) - 1, str.substr(8, 2) - 0 + 1);
  return formatDay(date);
}

//基姆拉尔森计算星期几
const kimWeek = (dateStr) => {
  let y = dateStr.substr(0, 4) - 0;
  let m = dateStr.substr(5, 2) - 0;
  let d = dateStr.substr(8, 2) - 0;
  if (m == 1 || m == 2) {
    m += 12;
    y -= 1;
  }
  const week = Math.floor((d + 2 * m + Math.floor(3 * (m + 1) / 5) + y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1) % 7);
  return "星期" + "日一二三四五六".charAt(week);
}

module.exports = {
  formatTime: formatTime,
  utcStrToDate: utcStrToDate,
  calDateStrByGap: calDateStrByGap,
  fmtDateWeekStr: fmtDateWeekStr,
  formatDay: formatDay,
  kimWeek: kimWeek,
  nextDate: nextDate,
}