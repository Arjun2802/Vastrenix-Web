const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..','admin');
const FAKE=`(function(){var listeners=[];var user=null;var verified=false;var claims={};window.__calls=[];
function mkUser(email){return {uid:'u9',email:email,get emailVerified(){return verified},reload:async function(){},sendEmailVerification:async function(){__calls.push('verify-email')},getIdToken:async function(){return 'TOK_ABCDEFGHIJKLMNOPQRSTUVWX'},getIdTokenResult:async function(){return {claims:claims}}}}
var A={currentUser:null,setPersistence:async function(){},onAuthStateChanged:function(cb){listeners.push(cb);setTimeout(function(){cb(A.currentUser)},10)},
createUserWithEmailAndPassword:async function(e,p){A.currentUser=mkUser(e);__calls.push('create '+e);setTimeout(function(){listeners.forEach(function(l){l(A.currentUser)})},10);return {user:A.currentUser}},
signInWithEmailAndPassword:async function(){},sendPasswordResetEmail:async function(){},signOut:async function(){}};
window.__verify=function(){verified=true};window.__grant=function(){claims={platformAdmin:true}};
function snap(){return {docs:[],size:0,forEach:function(){}}}
function coll(){var q={orderBy:function(){return q},limit:function(){return q},where:function(){return q},onSnapshot:function(n){setTimeout(function(){n(snap())},5);return function(){}},doc:function(){return {onSnapshot:function(n){n({exists:false});return function(){}}}}};return q}
var fs={collection:coll,doc:function(){return {onSnapshot:function(n){setTimeout(function(){n({exists:false,data:function(){}})},5);return function(){}}}},batch:function(){return {set:function(){},update:function(){},commit:async function(){}}}};
window.firebase={initializeApp:function(){return {auth:function(){return A},firestore:function(){return fs}}}};window.firebase.auth={Auth:{Persistence:{SESSION:1}}};window.firebase.firestore={FieldValue:{serverTimestamp:function(){}}};})();`;
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';if(/firebase-app-compat/.test(p)){s.writeHead(200,{'content-type':'text/javascript'});return s.end(FAKE);}if(/firebase-/.test(p)){s.writeHead(200,{'content-type':'text/javascript'});return s.end('');}const f=path.join(ROOT,p);if(!fs.existsSync(f)){s.writeHead(404);return s.end();}s.writeHead(200,{'content-type':{'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.png':'image/png'}[path.extname(f)]});fs.createReadStream(f).pipe(s);}).listen(0);
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1200,height:800}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.route('**/api/admin/**',async r=>{const u=r.request().url();if(u.includes('bootstrap')){await pg.evaluate(()=>__grant());return r.fulfill({contentType:'application/json',body:'{"ok":true}'});}return r.fulfill({contentType:'application/json',body:'{"razorpay":false,"mode":"off"}'});});
await pg.goto('http://localhost:'+srv.address().port+'/');await pg.waitForTimeout(300);
await pg.click('text=New admin? Create account');await pg.fill('#em','boss@vastrenix.com');await pg.fill('#pw','supersecret123');await pg.screenshot({path:require('os').tmpdir()+'/al1.png'});
await pg.click('button[type=submit]');await pg.waitForTimeout(300);await pg.screenshot({path:require('os').tmpdir()+'/al2.png'});
await pg.click('text=I have verified my email');await pg.waitForTimeout(200);console.log('before verify err:',await pg.evaluate(()=>document.querySelector('.err').textContent));
await pg.evaluate(()=>__verify());await pg.click('text=I have verified my email');await pg.waitForTimeout(400);
console.log('now on:',await pg.evaluate(()=>(document.querySelector('.head h1')||{}).textContent));console.log('calls:',await pg.evaluate(()=>__calls));
console.log(errs.join('\n')||'no errors');await b.close();srv.close();})();
