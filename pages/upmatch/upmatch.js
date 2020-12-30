const util = require("../../utils/util");

// pages/upmatch/upmatch.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    groups: [{
      guid: 0,
      name: '请选择'
    }],
    index: 0,
    startTime: "00:00",
    endTime: "23:50",
    content: "",
    isLogin: false,
    loginCode: "",
    uname: "",
    faceImg: "",
    isLeagueRole: false,
    title: "",
    subtitle: "",
    period: "",
    uploadMatchArr: [],
    week: '',
  },
  bindPickerChange: function (e) {
    const index = e.detail.value;
    this.setData({
      index: index
    });
    this.calPeriod();
  },

  calPeriod: function () {
    const index = this.data.index;
    const guid = this.data.groups[index].guid;
    if (guid != 0) {
      const period = this.calGroupStage(guid, this.data.date);
      this.setData({
        period: period
      });
    }
  },

  bindDateChange: function (e) {
    const date = e.detail.value;
    this.setData({
      date: date,
      week: util.kimWeek(date)
    });
    this.calPeriod();
  },

  bindStartTimeChange: function (e) {
    this.setData({
      startTime: e.detail.value
    })
  },

  bindGetCurrNewDate: function (e) {
    const guid = this.data.groups[this.data.index].guid;
    if (guid == 0) {
      return;
    }
    const page = 1;
    const self = this;
    const token = wx.getStorageSync("chai.token");

    let data = {
      guid: guid,
      status: 3,
    };

    let res = [];
    for (let key in data) {
      res.push(key + "=" + data[key]);
    }
    let url = encodeURI("https://api.xc.cool/api/matches?page=" + page + "&" + res.join("&"));
    wx.showToast({
      title: 'Loading',
      icon: 'loading',
      duration: 6000
    });
    wx.request({
      url: url,
      dataType: "json",
      header: {
        'content-type': 'application/json',
        'authorization': token,
      },
      method: "GET",
      success(r) {
        wx.hideToast();
        const res = r.data;
        let date;
        if (res.code == 0) {
          const articleArr = res.data.data;
          if (articleArr && articleArr.length > 0) {
            const total = res.data.total;
            date = util.formatDay(new Date(util.utcStrToDate(articleArr[0].started_at).getTime() + total * 3600 * 24 * 1000));
          }
        }else{
          wx.showToast({
            title: '没有找到数据',
            icon: 'none'
          });
          date = util.formatDay(new Date());
        }
        self.setData({
          date: date,
          week: util.kimWeek(date)
        });
        self.calPeriod();

      }
    });

  },

  bindUploadMatchMuch: function (e) {
    const index = e.currentTarget.dataset.index;
    const uploadMatchArr = this.data.uploadMatchArr;
    const obj = uploadMatchArr[index];
    const matchObj = new Object();
    matchObj.limited_at = "0";
    matchObj.mode = "0";
    matchObj.type = (obj.guid == 1 ? "1" : "0");
    matchObj.period = obj.period;
    matchObj.started_at = obj.date + " " + obj.startTime + ":00";
    matchObj.ended_at = obj.date + " " + obj.endTime + ":00";
    matchObj.title = obj.title.replace(/\s/g, '');
    matchObj.content = obj.content.replace(/\s/g, '');
    matchObj.subtitle = obj.subtitle || "";
    matchObj.group_list = [Number(obj.guid)];
    const self = this;
    this.reqUploadMatch(matchObj, () => {
      wx.showToast({
        title: '上传成功',
      });
      obj.isUped = true;
      self.setData({
        uploadMatchArr: uploadMatchArr
      });
    });
  },


  bindUploadMatch: function (e) {
    const guid = this.data.groups[this.data.index].guid;
    const date = this.data.date;
    const startTime = this.data.startTime;
    const endTime = this.data.endTime;
    const title = this.data.title;
    const subtitle = this.data.subtitle;
    const period = this.data.period;
    const content = this.data.content;
    if (guid == 0) {
      wx.showToast({
        title: '请选择群组',
        icon: 'none'
      });
      return;
    }

    if (content.includes("#ZYH")) {
      this.createMuchUpload(content);
      return;
    } else if (content.includes("#FMT")) {
      return;
    }


    for (let val of [title, content]) {
      if (!val || !val.trim()) {
        wx.showToast({
          title: '必填项不能为空',
          icon: 'none'
        });
        return;
      }
    }

    const matchObj = new Object();
    matchObj.limited_at = "0";
    matchObj.mode = "0";
    matchObj.type = (guid == 1 ? "1" : "0");
    matchObj.period = period;
    matchObj.started_at = date + " " + startTime + ":00";
    matchObj.ended_at = date + " " + endTime + ":00";
    matchObj.title = title.replace(/\s/g, '');
    matchObj.content = content.replace(/\s/g, '');
    matchObj.subtitle = subtitle || "";
    matchObj.group_list = [Number(guid)];
    const self = this;
    this.reqUploadMatch(matchObj, () => {
      wx.showToast({
        title: '成功，日期+1',
      });
      const nextDate = util.nextDate(date);
      self.setData({
        title: "",
        subtitle: "",
        content: "",
        period: self.calGroupStage(guid, nextDate),
        date: nextDate
      });
    });
  },


  createMuchUpload: function (content) {
    let cArr = content.match(/.+/g) || [];
    if (cArr.length % 2 != 1 || !cArr[0].includes('#ZYH')) {
      wx.showToast({
        title: '格式错误',
        icon: 'none'
      });
      return;
    }
    if (cArr.length < 3) {
      this.setData({
        content: '',
        uploadMatchArr: [],
      });
      return;
    }
    const isNotBrackets = cArr[0].includes('#0');
    this.matchArr = new Array();
    const guid = this.data.groups[this.data.index].guid;
    const currDate = this.data.date;
    const startTime = this.data.startTime;
    const endTime = this.data.endTime;
    const uploadMatchArr = new Array();
    let backUpStr = '';
    for (let i = 0; i < (cArr.length - 1) / 2; i++) {
      const title = cArr[i * 2 + 1];
      const content = cArr[i * 2 + 2].replace(/\s/g, '');
      const obj = new Object();


      const date = util.calDateStrByGap(currDate, i);
      const period = this.calGroupStage(guid, date);

      obj.content = content;
      obj.guid = guid;
      obj.date = date;
      obj.period = period;
      obj.startTime = startTime;
      obj.endTime = endTime;

      if (guid == "1") {
        obj.subtitle = "『" + title + "』";
        obj.title = "小拆联赛";
      } else {
        obj.subtitle = '';
        obj.title = (isNotBrackets ? '': '「') + title + (isNotBrackets ? '': '」');
      }

      uploadMatchArr.push(obj);

      backUpStr += util.fmtDateWeekStr(obj.date) + '\r\n';
      backUpStr += obj.title + '第' + obj.period + '期' + (obj.subtitle || '') + '-ZYH制作\r\n';
      backUpStr += obj.content + '\r\n';
      backUpStr += '-----第' + (obj.guid == 1 ? 998 : 999) + '段-' + obj.content.length + 'Z-type--xc.sw.2.0\r\n\r\n\r\n';
      
    }

    this.setData({
      content: '#FMT\r\n' + backUpStr,
      uploadMatchArr: uploadMatchArr
    });
  },

  copyText: function (e) {
    const loginCode = this.data.loginCode;
    wx.setClipboardData({
      data: loginCode,
      success: function (res) {
        wx.getClipboardData({
          success: function (res) {
            wx.showToast({
              title: loginCode,
              icon: 'none',
            })
          }
        })
      }
    })
  },

  bindEndTimeChange: function (e) {
    this.setData({
      endTime: e.detail.value
    });
  },

  onContentInput: function (e) {
    this.setData({
      content: e.detail.value
    });
  },

  onTitleInput: function (e) {
    this.setData({
      title: e.detail.value
    });
  },

  onSubTitleInput: function (e) {
    this.setData({
      subtitle: e.detail.value
    });
  },

  onPeriodInput: function (e) {
    this.setData({
      period: e.detail.value
    });
  },

  getToday: function () {
    let today = new Date();
    let fmt = function (num) {
      return (num < 10 ? "0" : "") + num
    };
    return today.getFullYear() + "-" + fmt(today.getMonth() + 1) + "-" + fmt(today.getDate());
  },

  //获取登录验证码
  reqLoginCode: function () {
    const self = this;
    wx.request({
      url: 'https://api.xc.cool/api/quicklogin',
      data: "{}",
      dataType: "json",
      header: {
        'content-type': 'application/json'
      },
      method: "GET",
      success(res) {
        let data = res.data;
        if (data.code == 0) {
          self.setData({
            loginCode: data.data.token
          });
          self.reqLoginByToken(data.data.token);
        }
      }
    });
  },

  reqLoginByToken: function (token) {
    const self = this;
    wx.request({
      url: 'https://api.xc.cool/api/quicklogin',
      data: JSON.stringify({
        token: token
      }),
      dataType: "json",
      header: {
        'content-type': 'application/json'
      },
      method: "POST",
      success(r) {
        let res = r.data;
        if (res.code == 2001) {
          self.timer = setTimeout(function () {
            self.reqLoginByToken(token);
          }, 1200);
        } else if (res.code == 0) {
          let data = res.data;
          wx.setStorageSync("chai.token", "Bearer " + data.token);
          wx.setStorageSync("chai.user", JSON.stringify(data.user));
          wx.setStorageSync("chai.role", JSON.stringify(data.role));
          self.setData({
            isLogin: true,
            uname: data.user.name,
            faceImg: data.user.avatar,
          });
          wx.showToast({
            title: '登录成功',
          });
          self.initGroups();
        }
      }
    });
  },


  reqUploadMatch: function (matchObj, callback) {
    const token = wx.getStorageSync("chai.token");
    wx.showToast({
      title: 'Loading',
      icon: 'loading',
      duration: 6000
    });
    wx.request({
      url: 'https://api.xc.cool/api/matches',
      data: JSON.stringify(matchObj),
      dataType: "json",
      header: {
        'content-type': 'application/json',
        'authorization': token,
      },
      method: "POST",
      success(r) {
        wx.hideToast();
        let res = r.data;
        if (res.code == 0) {
          if (callback) {
            callback();
          }
        }
      }
    });
  },

  calGroupStage: function (guid, matchDateStr) {
    if (!guid || !matchDateStr) {
      return '';
    }
    const groupStageObj = {
      "1": {
        name: "小拆联赛",
        date: "2020-09-02",
        stage: 1
      },
      "68947810": {
        name: "帝隆◆拆五笔跟打群",
        date: "2020-10-10",
        stage: 2020
      },
      "41639633": {
        name: "键心阁",
        date: "2020-10-10",
        stage: 1846
      },
      "49269560": {
        name: "指爱",
        date: "2020-10-10",
        stage: 2598
      },
      "26053477": {
        name: "五林风",
        date: "2020-10-10",
        stage: 1618
      },
      "12941287": {
        name: "聚贤阁",
        date: "2020-10-10",
        stage: 765
      },
      "556981260": {
        name: "晴天打字交流群",
        date: "2020-10-10",
        stage: 1647
      },
      "522394334": {
        name: "小鹤双拼练习①",
        date: "2020-10-10",
        stage: 1037
      },
      "7390600": {
        name: "092闲聊",
        date: "2020-10-10",
        stage: 40
      },
      "828213608": {
        name: "匠士雨",
        date: "2020-09-02",
        stage: 1
      },
      "28534214":{
        name: "梦幻",
        date: "2017-03-27",
        stage: 280
      },
      "347321669":{
        name: "五笔基础",
        date: "2020-12-27",
        stage: 1
      }
    };
    var gObj = groupStageObj[guid];
    if (gObj) {
      let toDateByStr = function (dateStr) {
        return new Date(dateStr.substr(0, 4), dateStr.substr(5, 2) - 1, dateStr.substr(8, 2));
      }
      let gDate = toDateByStr(gObj.date);
      let matchDate = toDateByStr(matchDateStr);
      let gapDay = Math.floor((matchDate.getTime() - gDate.getTime()) / 3600 / 24 / 1000);
      return gObj.stage - 0 + gapDay;
    } else {
      return "";
    }
  },

  initGroups: function () {
    const role = JSON.parse(wx.getStorageSync("chai.role"));
    const isLeagueRole = role.includes("G");
    const groups = [{
      guid: 0,
      name: '请选择'
    }];
    const self = this;
    const token = wx.getStorageSync("chai.token");
    const matchOrderObj = {
      "0": 1,
      "1": 2, //联赛
      "68947810": 3,//帝隆
      "41639633": 4, //键心
      "49269560": 5, //五林风
      "26053477": 6, //指爱
      "556981260": 7, //晴天
      "522394334": 8, //鹤一
      "28534214": 9, //梦幻
      "828213608": 10, //匠士雨
      "7390600": 11, //092闲聊
      "347321669": 12, //五笔基础
      "201323122": 15, //仓颉
      "723795668": 16, //鹤二
      "726064238": 20, //键侠英打
      "12941287": 21, //聚闲，已挂

    };
    wx.request({
      url: 'https://api.xc.cool/api/groups?page=0',
      data: JSON.stringify({
        token: token
      }),
      dataType: "json",
      header: {
        'content-type': 'application/json',
        "authorization": token,
      },
      method: "GET",
      success(r) {
        const res = r.data;
        if (res.code == 0) {
          let data = res.data.data;
          for (let group of data) {
            if (isLeagueRole || group.role == 'admin' || group.role == 'owner') {
              groups.push({
                guid: group.guid,
                name: group.name
              });
            }
          }

          if (isLeagueRole) {
            groups.unshift({
              guid: 1,
              name: '小拆联赛',
            });
          }
          groups.sort((a, b) => {
            let orderA = matchOrderObj[a.guid] || 99;
            let orderB = matchOrderObj[b.guid] || 99;
            return orderA - orderB;
          });
          self.setData({
            groups: groups
          });
          if (groups.length > 1) {
            wx.setStorageSync('groups', JSON.stringify(groups));
          }
        }
      }
    });

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const date = this.getToday();
    this.setData({
      date: date,
      week: util.kimWeek(date)
    });
    try {
      let token = wx.getStorageSync('chai.token');
      if (token) {
        let user = JSON.parse(wx.getStorageSync("chai.user"));
        this.setData({
          isLogin: true,
          uname: user.name,
          faceImg: user.avatar,
        });
        this.initGroups();
      }
    } catch (e) {

    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  onShow: function () {
    let token = wx.getStorageSync('chai.token');
    if (!token) {
      if (!this.data.loginCode) {
        this.reqLoginCode();
      } else {
        clearTimeout(this.timer);
        this.reqLoginByToken(this.data.loginCode);
      }
    }
  }


})