const FormatUtil = require('../../utils/FormatUtil.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    wordCount: 0,
    enWordCount: 0,
    punctuation: 'Normal',
    out3500: 0,
    commonWordTypes: ['前五百', '中五百', '后五百', '前一千五'],
    commonWordNums: [20, 30, 50, 80, 100, 200, 500],
    cutNums: [650, 600, 550, 500, 450, 400, 350, 300, 250],
    typeSel: 0,
    numSel: 0,
    cutSel: 3,
    content: '',
  },

  bindFmtText: function(e){
    let content = this.data.content;
    const fmtStr = FormatUtil.getFormatStr(content);
    const out3500 = FormatUtil.getOUT3500(fmtStr);
		
    const punctuation = FormatUtil.getStatusHTML(fmtStr);
    const enWordCount = FormatUtil.getEnChCount(fmtStr);
    this.setData({
      out3500: out3500,
      punctuation: punctuation,
      content: fmtStr,
      wordCount: fmtStr.length,
      enWordCount: enWordCount,
    });
  },

  bindMadeSingleWord: function(e){
    let content = this.data.content;
    const typeSel = this.data.typeSel;
    const numSel = this.data.numSel;
    const num = this.data.commonWordNums[numSel];
    content += FormatUtil.getDisorderSingleWord(typeSel, num);
    this.setData({
      content: content,
      wordCount: content.length,
    });
  },

  bindTypePickerChange: function (e) {
    const index = e.detail.value;
    this.setData({
      typeSel: index
    });
  },

  bindNumPickerChange: function (e) {
    const index = e.detail.value;
    this.setData({
      numSel: index
    });
  },

  bindCutPickerChange: function (e) {
    const index = e.detail.value;
    this.setData({
      cutSel: index
    });
  },

  bindCutWord: function(){
    let content = this.data.content;
    if(!content.trim()){
      return;
    }
    const fmtStr = FormatUtil.getFormatStr(content);
    const out3500 = FormatUtil.getOUT3500(fmtStr);
		
    const punctuation = FormatUtil.getStatusHTML(fmtStr);
    const enWordCount = FormatUtil.getEnChCount(fmtStr);
    const cutNum = this.data.cutNums[this.data.cutSel];
    this.setData({
      out3500: out3500,
      punctuation: punctuation,
      content: FormatUtil.getCutStr(fmtStr, cutNum),
      wordCount: fmtStr.length,
      enWordCount: enWordCount,
    });
  },

  bindResetAll: function(e){
    this.setData({
      wordCount: 0,
      enWordCount: 0,
      punctuation: 'Normal',
      out3500: 0,
      typeSel: 0,
      numSel: 0,
      cutSel: 3,
      content: '',
    })
  },

  onContentInput: function (e) {
    const content = e.detail.value;
    const enWordCount = FormatUtil.getEnChCount(content);
    this.setData({
      content: content,
      wordCount: content.length,
      enWordCount: enWordCount,
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const res = wx.getSystemInfoSync();
    this.setData({
      contentHeight: res.windowHeight
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})