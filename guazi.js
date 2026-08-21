/*
瓜子影视 drpy spider v3
源站: https://gz360.tv
API: https://haiwaiapi.1fc8ab0.com/Pc/
分类: 热门、电影、电视剧、动漫、综艺、短剧
主页: 推荐轮播 + 各分类最新内容
*/
var siteUrl = 'https://haiwaiapi.1fc8ab0.com';
var PC = '/Pc';

function req(url, obj) {
  obj = obj || {};
  var body = obj.body || '';
  var h = obj.headers || {};
  h['User-Agent'] = h['User-Agent'] || 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
  h['Content-Type'] = 'application/json';
  if (body) {
    return JSON.parse(request(url, { method: 'POST', body: body, headers: h }));
  } else {
    return JSON.parse(request(url, { method: 'POST', headers: h }));
  }
}

// ========== 分类 ==========
function getClass() {
  var r = req(siteUrl + PC + '/Index/indexPid');
  var cls = [];
  var data = r.data || [];
  // 添加"首页"分类
  cls.push({ cid: '0', cname: '首页推荐' });
  for (var i = 0; i < data.length; i++) {
    var c = data[i];
    if (!c.type || (c.type !== 'video' && c.type !== 'recommend' && c.type !== 'discover')) continue;
    var kids = [];
    if (c.children) {
      for (var j = 0; j < c.children.length; j++) {
        kids.push(c.children[j].name);
      }
    }
    cls.push({
      cid: c.id + '',
      cname: c.name,
      class_tag: kids.join(',')
    });
  }
  return cls;
}

// ========== 列表 ==========
function getList(cid, pg) {
  pg = pg || 1;
  // 首页特殊处理
  if (cid === '0') {
    return getHomeList();
  }
  var r = req(siteUrl + PC + '/Index/CategoryList', { body: JSON.stringify({ pid: parseInt(cid), page: pg }) });
  var data = r.data || {};
  var items = [];
  var sections = data.list || [];
  for (var s = 0; s < sections.length; s++) {
    var inner = sections[s].list || [];
    for (var k = 0; k < inner.length; k++) {
      var v = inner[k];
      items.push({
        vod_id: v.vod_id + '',
        vod_name: v.vod_name || v.c_name || '',
        vod_pic: v.vod_pic || v.c_pic || '',
        vod_year: v.vod_year || '',
        vod_area: v.vod_area || '',
        vod_actor: v.vod_actor || '',
        vod_content: (v.vod_use_content || '').substring(0, 200),
        vod_remarks: v.vod_continu || '',
        vod_score: v.vod_scroe || v.vod_douban_score || '',
        vod_tag: (v.tags || []).join('/')
      });
    }
  }
  var banner = data.banner || [];
  for (var b = 0; b < banner.length; b++) {
    var bv = banner[b];
    if (!bv.vod_id) continue;
    var already = false;
    for (var ex = 0; ex < items.length; ex++) {
      if (items[ex].vod_id === (bv.vod_id + '')) { already = true; break; }
    }
    if (!already) {
      items.push({
        vod_id: bv.vod_id + '',
        vod_name: bv.title || bv.vod_name || '',
        vod_pic: bv.vod_pic || '',
        vod_year: bv.vod_year || '',
        vod_area: bv.vod_type_name || '',
        vod_actor: '',
        vod_content: bv.content || '',
        vod_remarks: bv.vod_remarks || '',
        vod_score: '',
        vod_tag: bv.vod_type_name || ''
      });
    }
  }
  return {
    page: pg,
    pagecount: data.total ? Math.ceil(data.total / 20) : pg,
    limit: 20,
    total: data.total || items.length,
    list: items
  };
}

// ========== 首页推荐列表 ==========
function getHomeList() {
  var r = req(siteUrl + PC + '/Index/CategoryList', { body: JSON.stringify({ id: 1, pid: 1, page: 1 }) });
  var data = r.data || {};
  var items = [];
  // 添加banner
  var banner = data.banner || [];
  for (var b = 0; b < banner.length; b++) {
    var bv = banner[b];
    if (!bv.vod_id) continue;
    items.push({
      vod_id: bv.vod_id + '',
      vod_name: bv.title || '',
      vod_pic: bv.slide_pic || bv.vod_pic || '',
      vod_year: '',
      vod_area: bv.vod_type_name || '',
      vod_actor: '',
      vod_content: bv.content || '',
      vod_remarks: bv.vod_remarks || '',
      vod_score: '',
      vod_tag: 'banner'
    });
  }
  // 添加列表
  var sections = data.list || [];
  for (var s = 0; s < sections.length; s++) {
    var inner = sections[s].list || [];
    for (var k = 0; k < inner.length; k++) {
      var v = inner[k];
      items.push({
        vod_id: v.vod_id + '',
        vod_name: v.vod_name || '',
        vod_pic: v.vod_pic || '',
        vod_year: v.vod_year || '',
        vod_area: v.vod_area || '',
        vod_actor: v.vod_actor || '',
        vod_content: (v.vod_use_content || '').substring(0, 200),
        vod_remarks: v.vod_continu || '',
        vod_score: v.vod_scroe || '',
        vod_tag: sections[s].name || ''
      });
    }
  }
  return {
    page: 1,
    pagecount: 1,
    limit: items.length,
    total: items.length,
    list: items
  };
}

// ========== 详情 ==========
function getDetail(id) {
  var r = req(siteUrl + PC + '/Resource/GetVodInfo', { body: JSON.stringify({ vod_id: id }) });
  var vod = r.data && r.data.vodInfo ? r.data.vodInfo : {};
  if (!vod.vod_id) {
    return { list: [] };
  }
  var pr = req(siteUrl + PC + '/Resource/GetOnePlayList', { body: JSON.stringify({ vod_id: id }) });
  var playData = pr.data || {};
  var urls = playData.urls || [];
  var playList = [];
  for (var i = 0; i < urls.length; i++) {
    playList.push(urls[i].name + '$' + urls[i].url);
  }
  var item = {
    vod_id: vod.vod_id + '',
    vod_name: vod.vod_name || '',
    vod_pic: vod.pic || '',
    vod_year: vod.vod_year || '',
    vod_area: vod.vod_area || '',
    vod_actor: vod.vod_actor || '',
    vod_director: vod.vod_director || '',
    vod_content: vod.vod_use_content || '',
    vod_remarks: vod.vod_continu || '',
    vod_score: vod.vod_scroe || '',
    type_name: (vod.videoTag || []).join('/'),
    vod_play_from: '瓜子',
    vod_play_url: playList.join('#')
  };
  return { list: [item] };
}

// ========== 搜索 ==========
function search(wd) {
  var results = [];
  var formats = [
    { keyword: wd, page: 1 },
    { kw: wd, page: 1 },
    { search: wd, page: 1 },
    { wd: wd, page: 1 }
  ];
  for (var i = 0; i < formats.length; i++) {
    try {
      var r = req(siteUrl + PC + '/Search/GetList', { body: JSON.stringify(formats[i]) });
      var list = r.data || [];
      if (list && list.length > 0) {
        results = list;
        break;
      }
    } catch(e) {}
  }
  var items = [];
  for (var j = 0; j < results.length; j++) {
    var v = results[j];
    items.push({
      vod_id: v.vod_id + '',
      vod_name: v.vod_name || '',
      vod_pic: v.vod_pic || '',
      vod_remarks: v.vod_continu || '',
      vod_score: v.vod_scroe || ''
    });
  }
  return { list: items };
}

// ========== 播放 ==========
function play(flag, id, flags) {
  return { parse: 0, url: id, header: {} };
}

// ========== 主页 ==========
function home() {
  return { class: getClass() };
}

function homeVod() {
  var r = req(siteUrl + PC + '/Index/latestVideo', { body: '{}' });
  var list = r.data || [];
  var items = [];
  for (var i = 0; i < list.length && i < 20; i++) {
    var v = list[i];
    items.push({
      vod_id: v.vod_id + '',
      vod_name: v.vod_name || '',
      vod_pic: v.vod_pic || '',
      vod_remarks: v.vod_continu || '',
      vod_score: v.vod_scroe || ''
    });
  }
  return { list: items };
}

// ========== 分类列表 ==========
function category(tid, pg, size, year, area, zt, jd) {
  return getList(tid, pg);
}

// ========== 导出 ==========
var Rule = {
  api: '4.0',
  name: '瓜子影视',
  author: 'Agnes',
  canSearch: 1,
  searchLimit: 10,
  style: { type: 'rect', ratio: 0.75 },
  playParse: 0,
  timeout: 15000,

  class_parse: function() {
    return getClass();
  },

  url: siteUrl + PC + '/Resource/GetVodInfo',

  detail: function(id) {
    return getDetail(id);
  },

  category: function(tid, pg, size, year, area, zt, jd) {
    return category(tid, pg, size, year, area, zt, jd);
  },

  search: function(wd, fast) {
    return search(wd);
  },

  home: function() {
    return home();
  },

  homeVod: function() {
    return homeVod();
  },

  play: function(flag, id, flags) {
    return play(flag, id, flags);
  }
};

export default Rule;
