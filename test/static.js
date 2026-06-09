process.env.DATA_MODE='demo'; process.env.NODE_ENV='production';
const http=require('http'); const app=require('../src/app');
const s=app.listen(0); const p=s.address().port;
function get(path){return new Promise((res)=>{http.get(`http://127.0.0.1:${p}${path}`,r=>{let b=0;r.on('data',c=>b+=c.length);r.on('end',()=>res({status:r.statusCode,type:r.headers['content-type'],bytes:b}));});});}
(async()=>{let fail=0;
 for(const path of ['/zz/js/xsign-2.1.0.min.js','/zz/js/xsigndraw.js','/zz/images/esign.png','/zz/robots.txt','/zz/util/formcheck.js']){
   const r=await get(path); if(r.status!==200)fail++; console.log(`${r.status===200?'PASS':'FAIL'} ${path} -> ${r.status} ${(r.type||'').split(';')[0]} ${r.bytes}B`);
 }
 s.close(()=>process.exit(fail?1:0));
})();
