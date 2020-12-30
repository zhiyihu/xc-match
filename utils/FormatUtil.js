const gb2312 = require('gb2312.js');
const RepObj = require('replaceStrs.js');
const nulStr = "[\\s\\n<>]";
const FormatUtil = function () {}

FormatUtil.getFormatStr = function (text) {
	text = text.replace(new RegExp(nulStr, "g"), "");
	for (var key in RepObj) {
		text = text.replace(new RegExp(key, "g"), RepObj[key]);
	}
	text = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9，。！？、…—：；‘“”’·《》（）\.\%\*\+-=~\/\\]/g, "");
	text = FormatUtil.replacePoint(text);
	return text;
}

FormatUtil.getEnChCount = function (text) {
	return (text.match(/[0-9a-zA-Z\.]/g) || []).length;
}



FormatUtil.getOUT3500 = function (fmtStr) {
	var res = "";
	var gbkStr = "";
	var out3500 = "";
	for (var i = 0; i < fmtStr.length; i++) {
		var ch = fmtStr.charAt(i);
		if (FormatUtil.isGbk(ch) && gbkStr.indexOf(ch) < 0) {
			gbkStr += ch;
		} else if (gb2312.indexOf(ch) > 3500 && out3500.indexOf(ch) < 0) {
			out3500 += ch;
		}
	}

	res = (gbkStr ? "【" + gbkStr + "】" : "") + out3500;

	if (res.length > 30) {
		res = res.substr(0, 30) + "……";
	}
	return (res ? res : "0");
}

FormatUtil.isGbk = function (ch) {
	return !!(ch.match(/[\u4e00-\u9fa5]/g) && gb2312.indexOf(ch) < 0);
}

FormatUtil.getStatusHTML = function (text) {
	let statusStr = FormatUtil.checkQuote(text);
	return statusStr || "Normal";
}

FormatUtil.getCutStr = function (fmtStr, cutNum) {
	let pureStr = fmtStr;
	let punc = '。？！…';
	let quote = '”';
	let cutArr = new Array();
	while (true) {
		if (fmtStr.length <= cutNum) {
			cutArr.push(fmtStr);
			break;
		}
		let puncArr = new Array();
		let startIndex = Math.max(0, cutNum - 250);
		for (let i = startIndex; i < fmtStr.length && i < cutNum; i++) {
			let ch = fmtStr[i];
			if (punc.includes(ch)) {
				puncArr.push(i);
			}
			if (quote == ch && punc.includes(fmtStr[i - 1])) {
				puncArr.push(i);
			}
		}

		let subIndex = cutNum;
		if(puncArr.length > 0){
			let cutArrLen = cutArr.length;
			for(let i = puncArr.length - 1; i >= 0; i--){
				subIndex = puncArr[i] + 1;
				let cutStr = fmtStr.substr(0, subIndex);
				let matchArr = cutStr.match(/[“”]/g) || [];
				if(matchArr.length % 2 == 0){
					cutArr.push(cutStr);
					fmtStr = fmtStr.substr(subIndex);
					break;
				}
			}
			if(cutArrLen == cutArr.length){
				wx.showToast({
					title: '引号切断错误',
					icon: 'none'
				});
				return pureStr;
			}
		}else{
			return pureStr;
		}
		
	}
	
	return cutArr.join("\r\n\r\n\r\n");
}

/**
 * 替换英文点号，点号前是非数字则替换，点号在结尾也进行替换
 */
FormatUtil.replacePoint = function (str) {
	var result = "";
	var len = str.length;
	for (var i = 0; i < len; i++) {
		if (i > 0 && str.charAt(i) == '.' && (!str.charAt(i - 1).match(/[0-9]/g) || i == len - 1)) {
			result += '。';
		} else {
			result += str.charAt(i);
		}
	}
	return result;
}

FormatUtil.getDisorderSingleWord = function (type, num) {
	var typeArr = [
		[0, 500],
		[500, 1000],
		[1000, 1500],
		[0, 1500]
	];
	var words = gb2312.substring(typeArr[type][0], typeArr[type][1]);
	return FormatUtil.shuffle(words.split("")).join("").substr(0, num);
}

/**
 * 洗牌算法，将数组内元素乱序
 * @param {Object} arr
 */
FormatUtil.shuffle = function (arr) {
	var j, x, i;
	for (i = arr.length; i; i--) {
		j = Math.floor(Math.random() * i);
		x = arr[i - 1];
		arr[i - 1] = arr[j];
		arr[j] = x;
	}
	return arr;
}

FormatUtil.checkQuote = function (text) {
	var checkChArr = ["“”", "‘’", "《》", "（）"];
	var res = "";
	for (var i = 0; i < checkChArr.length; i++) {
		var quoteStr = checkChArr[i];
		res = FormatUtil.checkChDouble(quoteStr, text);
		if (res) {
			return res;
		}
	}
	res = res || FormatUtil.checkSingleQuote("—", text, "破折号") || FormatUtil.checkSingleQuote("…", text, "省略号");
	return res;
}

FormatUtil.checkSingleQuote = function (quoteStr, text, quoteName) {
	let pz = text.match(new RegExp(quoteStr, "g")) || [];
	let pz2 = text.match(new RegExp(quoteStr + quoteStr, "g")) || [];
	if (pz.length / 2 != pz2.length) {
		return "单" + quoteName;
	}
	return "";
}

/**
 * 校验符号是否配对，如双引号，括号等
 * @param {Object} quoteStr 要检测配对的符号字数串，如"()"
 * @param {Object} content 要检测的内容
 */
FormatUtil.checkChDouble = function (quoteStr, content) {
	var leftCh = quoteStr.charAt(0);
	var rightCh = quoteStr.charAt(1);
	var arr = content.match(new RegExp("[" + quoteStr + "]", "g"));
	if (!arr) {
		return "";
	}
	var leftCount = 0;
	var rightCount = 0;
	for (var i = 0; i < arr.length; i++) {
		var ch = arr[i];
		if (i % 2 == 0 && ch != leftCh || i % 2 == 1 && ch != rightCh) {
			return quoteStr + "配对错误";
		}
		leftCount += (i + 1) % 2;
		rightCount += i % 2;
	}
	if (leftCount != rightCount) {
		return "缺少" + (leftCount < rightCount ? leftCh : rightCh) + "*" + Math.abs(
			rightCount - leftCount);
	}
	return "";

}


module.exports = FormatUtil;