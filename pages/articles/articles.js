// pages/articles/articles.js

const util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    groups: [{
      guid: 0,
      name: '请选择'
    }, ],
    index: 0,
    pageBtnArr: [],
    articleArr: [],
    showIndex: -1,
    pageSel: -1,
    total: 0,
    content: '', //当前显示的textarea内容
    title: '', //当前显示的title
    subtitle: '', //当前subtitle
    period: '', //当前period
  },

  bindPickerChange: function (e) {
    let index = e.detail.value;
    this.setData({
      index: index
    });
    let guid = this.data.groups[index].guid;
    if (guid != 0) {
      this.reqQueryMatches(guid);
      this.setData({
        pageSel: 1,
        showIndex: -1,
      });
    }
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


  onSubtitleInput: function (e) {
    this.setData({
      subtitle: e.detail.value
    });
  },


  onPeriodInput: function (e) {
    this.setData({
      period: e.detail.value
    });
  },



  reqDeleteMatch: function(id){
    const url = "https://api.xc.cool/api/matches/" + id;
    const token = wx.getStorageSync("chai.token");
    const self = this;
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
      method: "DELETE",
      success(r) {
        wx.hideToast();
        const res = r.data;
        if(res.code == 0){
          wx.showModal({
            title: '提示',
            content: '操作成功',
            success: function (sm) {
              let index = self.data.index;
              let guid = self.data.groups[index].guid;
              self.reqQueryMatches(guid);
              self.setData({
                pageSel: 1,
                showIndex: -1,
                content: '',
              });
            }
          });
        }
      }
    });
  },

  reqQueryMatches: function (guid, page) {
    const self = this;
    const token = wx.getStorageSync("chai.token");
    if(page == null){
      page = 1;
    }
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
        if (res.code == 0) {
          const articleArr = res.data.data;
          const arr = new Array();
          if (res.data.last_page > 1) {
            for (let i = 1; i <= res.data.last_page; i++) {
              arr.push(i);
            }
          }
          for (let item of articleArr) {
            for(let key of ['started_at', 'ended_at', 'created_at']){
              item[key] = util.formatTime(util.utcStrToDate(item[key]));
            }
          }
          const total = res.data.total;
          self.setData({
            pageBtnArr: arr,
            articleArr: articleArr,
            total: total
          });
        } else {
          self.setData({
            pageBtnArr: [],
            articleArr: [],
            total: 0
          });
        }
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let token = wx.getStorageSync('chai.token');
    const res = wx.getSystemInfoSync();
    this.setData({
      contentHeight: res.windowHeight
    });
    if (token) {
      let groupsStr = wx.getStorageSync('groups');
      if (groupsStr) {
        let groups = JSON.parse(groupsStr);
        this.setData({
          groups: groups
        });
      }
    }
  },

  showDetail: function (e) {
    let index = e.currentTarget.dataset.index;
    let article = this.data.articleArr;
    if (this.data.showIndex == index) {
      index = -1;
    }
    const isShowArticle = (index >= 0 && article.length > 0);
    this.setData({
      showIndex: index,
      content: (isShowArticle ? article[index].content : ''),
      title: (isShowArticle ? article[index].title : ''),
      subtitle: (isShowArticle ? article[index].subtitle || '' : ''),
      period: (isShowArticle ? article[index].period || '' : '')
    });
  },

  bindModifyContent: function(e){
    const index = e.currentTarget.dataset.index;
    const article = this.data.articleArr[index];
    const content = this.data.content;
    const title = this.data.title;
    const subtitle = this.data.subtitle;
    const period = this.data.period;
    const self = this;
    if(article.content == content.trim() && article.title == title.trim() && article.subtitle == subtitle.trim() && article.period == period.trim()){
      wx.showToast({
        title: '没有修改',
        icon: 'none'
      });
      return;
    }
    if(!title.trim() || !content.trim()){
      wx.showToast({
        title: '标题和内容不能为空',
        icon: 'none'
      });
      return;
    }
    wx.showModal({
      title: '提示',
      content: '修改内容不可撤销，确认提交？',
      success: function (sm) {
        if (sm.confirm) {
          self.reqModifyContent(article, content, title, subtitle, period);
        }
      }
    });
  },

  reqModifyContent: function(article, content, title, subtitle, period){
    const self = this;
    const matchObj = new Object();
    const guid = (article.type == "1" ? 1 : Number(article.groups[0].guid));
    
    matchObj.limited_at = '0';
    matchObj.mode = '0';
    matchObj.type = article.type;
    matchObj.period = period || util.calGroupStage(guid, article.started_at);
    matchObj.started_at = article.started_at;
    matchObj.ended_at = article.ended_at;
    matchObj.title = title.replace(/\s/g, '');
    matchObj.content = content.replace(/\s/g, '');
    matchObj.subtitle = subtitle.replace(/\s/g, '');
    matchObj.group_list = [guid];
    this.reqUploadMatch(matchObj, () => {
      self.reqDeleteMatch(article.id);
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
        let res = r.data;
        if (res.code == 0) {
          if (callback) {
            callback();
          }
        }
      }
    });
  },


  deleteMatch: function (e) {
    const id = e.currentTarget.dataset.id;
    const self = this;
    wx.showModal({
      title: '提示',
      content: '删除不可撤销，确认删除？',
      success: function (sm) {
        if (sm.confirm) {
          self.reqDeleteMatch(id);
        }
      }
    });
  },


  onPageBtnTap: function (e) {
    let page = e.currentTarget.dataset.index - 0 + 1;
    let index = this.data.index;
    let guid = this.data.groups[index].guid;
    if (guid != 0) {
      this.reqQueryMatches(guid, page);
      this.setData({
        pageSel: page,
        showIndex: -1,
      });
    }
  },

})