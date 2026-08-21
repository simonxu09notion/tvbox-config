/*
瓜子影视 drpy spider
源站: https://gz360.tv
API: https://haiwaiapi.1fc8ab0.com/Pc/
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

function getClass() {
  var r = req(siteUrl + PC + '/Index/indexPid');
  var cls = [];
  var data = r.data || [];
  for (var i = 0; i < data.length; i++) {
    var c = data[i];
    if (!c.type || (c.type !== 'video' && c.type !== 'recommend' && c.type !== 'discover')) continue;
    var kids = [];
    if (c.children) {
      for (var j = 0; j < c.children.length; j++) {
        kids.push(c.children[j].name);
      }
    }
    cls.push({ cid: c.id + '', cname: c.name, class_tag: kids.join(',') });
  }
  return cls;
}

var Rule = {
  name: '瓜子影视',
  api: '4.0',
  searchable: 1,
  quickSearch: 0,
  filterable: 1,
  style: { type: 'rect', ratio: 0.75 },
  
  class_parse: function() { return getClass(); },
  
  推荐: function() {
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
    return items;
  },
  
  detail: function(id) { return { list: [] }; },
  category: function(tid, pg) { return { list: [] }; },
  search: function(wd) { return { list: [] }; },
  play: function(flag, id, flags) { return { parse: 0, url: id, header: {} }; }
};

export default Rule;
