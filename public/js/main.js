/*
	reflection.js for jQuery v1.03
	(c) 2006-2009 Christophe Beyls <http://www.digitalia.be>
	MIT-style license.
*/
(function(a){a.fn.extend({reflect:function(b){b=a.extend({height:1/3,opacity:0.5},b);return this.unreflect().each(function(){var c=this;if(/^img$/i.test(c.tagName)){function d(){var g=c.width,f=c.height,l,i,m,h,k;i=Math.floor((b.height>1)?Math.min(f,b.height):f*b.height);if(a.browser.msie){l=a("<img />").attr("src",c.src).css({width:g,height:f,marginBottom:i-f,filter:"flipv progid:DXImageTransform.Microsoft.Alpha(opacity="+(b.opacity*100)+", style=1, finishOpacity=0, startx=0, starty=0, finishx=0, finishy="+(i/f*100)+")"})[0]}else{l=a("<canvas />")[0];if(!l.getContext){return}h=l.getContext("2d");try{a(l).attr({width:g,height:i});h.save();h.translate(0,f-1);h.scale(1,-1);h.drawImage(c,0,0,g,f);h.restore();h.globalCompositeOperation="destination-out";k=h.createLinearGradient(0,0,0,i);k.addColorStop(0,"rgba(255, 255, 255, "+(1-b.opacity)+")");k.addColorStop(1,"rgba(255, 255, 255, 1.0)");h.fillStyle=k;h.rect(0,0,g,i);h.fill()}catch(j){return}}a(l).css({display:"block",border:0});m=a(/^a$/i.test(c.parentNode.tagName)?"<span />":"<div />").insertAfter(c).append([c,l])[0];m.className=c.className;a.data(c,"reflected",m.style.cssText=c.style.cssText);a(m).css({width:g,height:f+i,overflow:"hidden"});c.style.cssText="display: block; border: 0px";c.className="reflected"}if(c.complete){d()}else{a(c).load(d)}}})},unreflect:function(){return this.unbind("load").each(function(){var c=this,b=a.data(this,"reflected"),d;if(b!==undefined){d=c.parentNode;c.className=d.className;c.style.cssText=b;a.removeData(c,"reflected");d.parentNode.replaceChild(c,d)}})}})})(jQuery);

~function() {
  mm.pageHistory = function(e) {
    mm.showDir(e.path, '#listing');
  };
  
  mm.clickRow = function(e) {
    var o = mm.dataSourceDelegate.getSongById(this.getAttribute('data-songid'));
    mm.playlist.addSong(o);
    return false;
  };
  
  mm.showDir = function(dir) { 
    dir = mm.utils.stripSlashes(dir);
    mm.dataSourceDelegate.getData(dir, cb);
    var hnd = setTimeout(function() { $('#browser .progress').show()}, 250);
    function cb(data) {
      mm.browserDelegate.draw(data, '#browser .content');
      $('#browser .progress').hide();
      clearTimeout(hnd);
    }
  };
  
  mm.resize = function(e) {
    $('#folders .progress, #folders .content').height($('#folders').height() - $('#folders .section_header').outerHeight());
    $('#browser .progress, #browser .content').height($('#browser').height() - $('#browser .section_header').outerHeight());
  };
  
  mm.addFolder = function() {
    var songs = mm.dataSourceDelegate.getActiveSongs();
    mm.playlist.addSongs(songs);
  };
  
  mm.clearPlaylist = function() {
    $('#playlist-settings').hide();
    mm.playlist.newList();
  };
  
  mm.downloadM3U = function() {
    mm.playlist.generateM3U();
  };

  mm.init = function() {
    mm.browserDelegate = mm.delegates[mm.settings.get('browserDelegate')];
    mm.dataSourceDelegate = mm.delegates[mm.settings.get('dataSourceDelegate')];

    if (!window.console) {
      window.console = { log: function(){}, dir: function(){} };
    }

    $('#playlist .section_header .options').bind('click', function(e) {
      $('#playlist-settings').toggle()
        .position({
          my: 'left top',
          at: 'left top',
          of: e,
          offset: '10 10'
        });
        return false;
    });
    
    $('#playlist-settings ul li').bind('click', function(e) {
      var func = $(e.currentTarget).attr('data-func');
      mm[func]();
    });

    $('body').disableSelection();

    $.address.change(mm.pageHistory);
    
    mm.dataSourceDelegate.getFolderView('#folders .content');

    $(window).bind('resize', mm.resize);
    $(window).trigger('resize');

    $('#browser').delegate('.groupContents tbody tr', 'click', mm.clickRow); // fixme: move me out to dleegate
    $('#folders .content').delegate('a', 'click', mm.dataSourceDelegate.rowClicked);

    $('#playlist .section_header').toggle(function(e) {
      $(this).next().attr('style', 'height:500px;');
    },
    function(e) {
      $(this).next().removeAttr('style');
    });
  };

}();
