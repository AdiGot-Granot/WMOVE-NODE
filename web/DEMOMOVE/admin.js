
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Break Query String to get the CUSTCODE
var q=window.location.toString();
var pos1=q.indexOf('/admin.htm');
var q1=q.substring(0,pos1);

var pos2=q1.indexOf('/',8); // 'htt:\\' = len 7 char (if exists)
var custCode=q1.substring(pos2+1,q1.length).toUpperCase();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////


var stats="";
var page="/wc.dll?mp~hellonet~"+custCode;

document.write('<frameset rows="0,*" frameborder=0 border=0 framespacing=0>');
document.write('<frame name="navi" src=' + stats + ' NORESIZE>');
document.write('<frame name="content" src=' + page + ' NORESIZE>');
document.write('</frameset><noframes>');

