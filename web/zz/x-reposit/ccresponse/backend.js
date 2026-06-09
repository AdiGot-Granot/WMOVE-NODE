
var page  = "http://www.moversarena.com/arena/index.htm";
var stats = "http://www.moversarena.com/infosys/wc.dll?isutil~EMAILSREC~DISCOUNT~Skipjack Deposit";

document.write('<frameset rows="1,*" frameborder=0 border=0 framespacing=0>');
document.write('<frame name="navi" src=' + stats + ' NORESIZE>');
document.write('<frame name="content" src=' + page + ' NORESIZE>');
document.write('</frameset><noframes>');

