const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..','admin');
const now=Date.now(), DAY=864e5;
const FAKE=`(function(){var writes=window.__writes=[];
var DATA={subscriptions:{s1:{status:'active',cycleId:'quarterly',expiresAt:${now+5*DAY},trialStartedAt:${now-40*DAY}},s2:{status:'trialing',trialEndsAt:${now+DAY},trialStartedAt:${now-6*DAY}},s3:{status:'trialing',trialEndsAt:${now-DAY},trialStartedAt:${now-9*DAY}}},
codes:{'VX-SF-AB12':{storeId:'s1',name:'Shree Fashion'},'VX-KC-ZZ11':{storeId:'s2',name:'<img src=x onerror=alert(1)>Kala Creations'}},
subscriptionRequests:{s3:{businessId:'s3',storeName:'Raj Textiles',storeCode:'VX-RT-QQ22',email:'raj@example.com',cycle:'annual',amount:6999,utr:'431298765432',status:'pending',createdAt:{toMillis:function(){return ${now-3600e3}}}},s2:{businessId:'s2',storeName:'Kala',cycle:'monthly',amount:699,utr:'431298765432',status:'approved',createdAt:${now-9*DAY}}},
supportRequests:{t1:{type:'support',category:'bug',name:'Raj',email:'raj@example.com',message:'PDF not opening on my phone',status:'open',createdAt:${now-7200e3}},t2:{type:'custom_work_inquiry',name:'Meena',whatToBuild:'Tally export',message:'Need XML',status:'resolved',createdAt:${now-5*DAY}}},adminLog:{}};
function snap(m){var docs=Object.keys(m).map(function(k){return {id:k,data:function(){return m[k]}}});return {docs:docs,size:docs.length,forEach:function(f){docs.forEach(f)}}}
function coll(n){var q={orderBy:function(){return q},limit:function(){return q},where:function(){return q},onSnapshot:function(nx){setTimeout(function(){nx(snap(DATA[n]||{}))},10);return function(){}},get:function(){return Promise.resolve(snap({}))},doc:function(id){return docRef(n+'/'+(id||'auto'+Math.random()))}};return q}
function docRef(p){return {path:p,get:function(){return Promise.resolve({exists:true,data:function(){return {city:'Surat',phone:'9876543210'}}})}}}
var fs={collection:coll,doc:docRef,batch:function(){var ops=[];return {set:function(r,d){ops.push(['set',r.path,d])},update:function(r,d){ops.push(['update',r.path,d])},commit:function(){writes.push.apply(writes,ops);return Promise.resolve()}}}};
window.firebase={initializeApp:function(){return {auth:function(){return {setPersistence:function(){return Promise.resolve()},onAuthStateChanged:function(cb){setTimeout(function(){cb({uid:'adm',email:'admin@vastrenix.com',getIdTokenResult:function(){return Promise.resolve({claims:{platformAdmin:true}})}})},20)},signOut:function(){}}},firestore:function(){return fs}}}};
window.firebase.auth={Auth:{Persistence:{SESSION:'session'}}};window.firebase.firestore={FieldValue:{serverTimestamp:function(){return 'TS'}}};})();`;
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';if(/firebase-app-compat/.test(p)){s.writeHead(200,{'content-type':'text/javascript'});return s.end(FAKE);}if(/firebase-/.test(p)){s.writeHead(200,{'content-type':'text/javascript'});return s.end('');}const f=path.join(ROOT,p);if(!fs.existsSync(f)){s.writeHead(404);return s.end();}s.writeHead(200,{'content-type':{'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.png':'image/png'}[path.extname(f)]});fs.createReadStream(f).pipe(s);}).listen(0);
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1360,height:860}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('dialog',d=>{errs.push('DIALOG '+d.message());d.accept();});
await pg.goto('http://localhost:'+srv.address().port+'/');await pg.waitForTimeout(400);
await pg.screenshot({path:require('os').tmpdir()+'/adm-overview.png'});
for(const v of ['Payments','Stores','Support','Audit log']){await pg.click('aside >> text='+v);await pg.waitForTimeout(150);await pg.screenshot({path:require('os').tmpdir()+'/adm-'+v.replace(' ','')+'.png'});}
await pg.click('aside >> text=Payments');await pg.click('text=Approve…');await pg.waitForTimeout(150);await pg.screenshot({path:require('os').tmpdir()+'/adm-approve.png'});
await pg.click('.modal-f >> text=Approve & activate');await pg.waitForTimeout(150);
console.log(JSON.stringify(await pg.evaluate(()=>window.__writes.map(w=>[w[0],w[1],w[2].status||w[2].action]))));
console.log(errs.join('\n')||'no errors');await b.close();srv.close();})();
