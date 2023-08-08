var folderupload_input = document.getElementById('folderupload_input');
var musictable = document.querySelector("#musiclist tbody");
folderupload_input.onchange = function () {
  if (this.files) {
    document.getElementById('folderuploader').style.display = 'none';
    document.querySelector("#musiclist").style.display = 'block';
    document.querySelector("#lrc_frame").style.display = 'block';
    for (var i = 0; i < this.files.length; i++) {
      if (this.files[i].type.indexOf('audio/') != -1) {
        function a(i) {
          var url = URL.createObjectURL(this.files[i]);
          var filename = this.files[i].name;
          var tr = document.createElement('tr');
          tr.innerHTML = '<td>' + filename + '</td><td></td><td></td><td></td><td></td><td></td>';
          musictable.append(tr);
          tr.onclick = function () {
            alert('正在识别...');
          }
          ID3.loadTags(filename, function () {
            var tags = ID3.getAllTags(filename);
            tr.innerHTML = '<td>' + filename + '</td><td>' + (tags.track || '') + '</td><td>' + (tags.album || '') + '</td><td>' + (tags.artist || '') + '</td><td>' + (tags.title || '') + '</td><td>' + (tags.year || '') + '</td>';
            tr.querySelectorAll('td').forEach(function(td){
              td.title=td.innerText;
            })
            tr.onclick = function () {
              var src='';
              if(tags.picture){
                var image = tags.picture;
                var base64String = "";
                for (var i = 0; i < image.data.length; i++) {
                  base64String += String.fromCharCode(image.data[i]);
                }
                src = "data:" + image.format + ";base64," + window.btoa(base64String);
              }
              if (document.querySelector("tr.act")) { document.querySelector("tr.act").classList.remove('act') };
              play(url, src, tags.artist, tags.title, tags.album, filename, tags.lyrics?tags.lyrics.U:'', tr);
            }
          }, {
            tags: ['picture', 'title', 'artist', 'album', 'lyrics', 'comment', 'track', 'year', 'school'],
            dataReader: ID3.FileAPIReader(this.files[i])
          })
        }
        a.call(this, i);
      }
    }
  }
}


var mimg = document.getElementById("music_img");
var mp = document.getElementById("music_play");
var mtitle = document.getElementById("music_title");
var malbum = document.getElementById("music_album");
var mname = document.getElementById("music_name");
var mrange = document.getElementById("music_range");

var lastbtn = document.getElementById("lastbtn");
var playbtn = document.getElementById("playbtn");
var nextbtn = document.getElementById("nextbtn");
var nowplaytr = null;
function play(musicurl, imgurl, artist, title, album, filename, lrc, tr) {
  mimg.src = imgurl;
  mp.src = musicurl;
  mtitle.innerHTML = artist + ' - ' + title;
  malbum.innerHTML = album;
  mname.innerHTML = filename;
  nowplaytr = tr;
  tr.classList.add('act');
  xrlrc(lrc);
}

mp.oncanplay = function () {
  mrange.max = mp.duration;
  try { mp.play() } catch (e) { };
}
mp.onended = function () {
  if (nextrule == 'repeat-1') {
    mp.play();
  } else {
    nextbtn.click();
  }
}
var _up = true;
mp.ontimeupdate = function () {
  if (_up) {
    mrange.value = mp.currentTime;
  }
  if(oLRC.ms.length>0){
    var q = 0;
    for (var i = 0; i < oLRC.ms.length; i++) {
      if ((oLRC.ms[i].t - 0) > mp.currentTime) {
        lrcf.style.marginTop = (window.innerHeight - 70) / 2 - getLiH(i) + 'px';
        if (lrcf.querySelector('li.act')) {
          lrcf.querySelector('li.act').classList.remove('act');
        }
        lrcf.querySelectorAll('li')[i - 1].classList.add('act');
        q = 1;
        break;
      }
    }
    if (!q) {
      lrcf.style.marginTop = (window.innerHeight - 70) / 2 - getLiH(oLRC.ms.length - 1) + 'px';
      if (lrcf.querySelector('li.act')) {
        lrcf.querySelector('li.act').classList.remove('act');
      }
      lrcf.querySelectorAll('li')[oLRC.ms.length - 1].classList.add('act');
    }
  }
  
  function getLiH(i) {
    var h = 0;
    for (var i2 = 0; i2 < i; i2++) {
      var element = lrcf.querySelectorAll('li')[i2];
      h += element.offsetHeight;
    }
    return h;
  }
}

mrange.onmousedown = function () {
  _up = false;
  document.onmouseup = function () {
    document.onmouseup = null;
    _up = true;
    mp.currentTime = mrange.value - 0;
  }
}

mp.onplay = function () {
  playbtn.className = 'bi bi-pause';
}

mp.onpause = function () {
  playbtn.className = 'bi bi-play-fill';
}

playbtn.onclick = function () {
  if (mp.paused) {
    mp.play();
  } else {
    mp.pause();
  }
}

lastbtn.onclick = function () {
  if (nextrule != 'shuffle') {

    if (nowplaytr) {
      if (nowplaytr.previousSibling) {
        nowplaytr.previousSibling.click();
      } else {
        var a = document.querySelectorAll("#musiclist tr");
        a[a.length - 1].click();
      }
    } else {
      var a = document.querySelectorAll("#musiclist tr");
      if (a.length <= 1) return;
      a[a.length - 1].click();
    }
  } else {
    var a = document.querySelectorAll("#musiclist tr");
    a[parseInt(Math.random() * a.length)].click();
  }
}

nextbtn.onclick = function () {
  if (nextrule != 'shuffle') {
    if (nowplaytr) {
      if (nowplaytr.nextSibling) {
        nowplaytr.nextSibling.click();
      } else {
        var a = document.querySelectorAll("#musiclist tr");
        a[1].click();
      }
    } else {
      var a = document.querySelectorAll("#musiclist tr");
      if (a.length <= 1) return;
      a[1].click();
    }
  } else {
    var a = document.querySelectorAll("#musiclist tr");
    a[parseInt(Math.random() * a.length)].click();
  }

}
var oLRC = {};

function createLrcObj(lrc) {
  if (lrc.length == 0) return;
  var lrcs = lrc.split('\n');//用回车拆分成数组
  for (var i in lrcs) {//遍历歌词数组
    lrcs[i] = lrcs[i].replace(/(^\s*)|(\s*$)/g, ""); //去除前后空格
    var t = lrcs[i].substring(lrcs[i].indexOf("[") + 1, lrcs[i].indexOf("]"));//取[]间的内容
    var s = t.split(":");//分离:前后文字
    if (isNaN(parseInt(s[0]))) { //不是数值
      for (var i in oLRC) {
        if (i != "ms" && i == s[0].toLowerCase()) {
          oLRC[i] = s[1];
        }
      }
    } else { //是数值
      var arr = lrcs[i].match(/\[(\d+:.+?)\]/g);//提取时间字段，可能有多个
      var start = 0;
      for (var k in arr) {
        start += arr[k].length; //计算歌词位置
      }
      var content = lrcs[i].substring(start);//获取歌词内容
      for (var k in arr) {
        var t = arr[k].substring(1, arr[k].length - 1);//取[]间的内容
        var s = t.split(":");//分离:前后文字
        oLRC.ms.push({//对象{t:时间,c:歌词}加入ms数组
          t: (parseFloat(s[0]) * 60 + parseFloat(s[1])).toFixed(3),
          c: content
        });
      }
    }
  }
  oLRC.ms.sort(function (a, b) {//按时间顺序排序
    return a.t - b.t;
  });
  /*
  for(var i in oLRC){ //查看解析结果
      console.log(i,":",oLRC[i]);
  }*/
}
var lrcf = document.querySelector("#lrc_frame ul");
function xrlrc(lrc) {
  oLRC = {
    ti: "", //歌曲名
    ar: "", //演唱者
    al: "", //专辑名
    by: "", //歌词制作人
    offset: 0, //时间补偿值，单位毫秒，用于调整歌词整体位置
    ms: [] //歌词数组{t:时间,c:歌词}
  };
  createLrcObj(lrc);
  var s = "";
  for (var i in oLRC.ms) {//遍历ms数组，把歌词加入列表
    s += '<li>' + oLRC.ms[i].c + '</li>';
  }
  lrcf.innerHTML = s;
}

var nextrule = 'repeat';

document.querySelector("#nextrule").onclick = function () {
  var list = ['repeat', 'repeat-1', 'shuffle'];
  nextrule = list[(list.indexOf(nextrule) + 1) > 2 ? 0 : (list.indexOf(nextrule) + 1)];
  this.className = 'bi bi-' + nextrule;
}