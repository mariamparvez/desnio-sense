import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,signOut,updateProfile} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {getFirestore,collection,query,where,orderBy,documentId,limit,startAfter,getDocs,doc,getDoc,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
import {initializeAppCheck,ReCaptchaEnterpriseProvider,getToken} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app-check.js';
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const productionHosts=new Set(['desnio-sense.vercel.app','desniosense.com','www.desniosense.com']);
const appCheck=productionHosts.has(location.hostname)?initializeAppCheck(app,{provider:new ReCaptchaEnterpriseProvider('6Le2cuYtAAAAAP9Mn-ByDEjm9rETsxeROWIcZLBb'),isTokenAutoRefreshEnabled:true}):null;
async function browserAttestation(){return appCheck?(await getToken(appCheck,false)).token:null;}
const state={products:[],phoneModels:[],jobs:[],users:[],admins:[],orders:[],tickets:[],phoneModelRequests:[],applications:[]};
let session=null,refreshing,initial=true;
for(const key of ['session','customers','admins','orders','tickets','jobs','managed-products','phone-models','phone-model-requests'])localStorage.removeItem('ds-'+key);
function clearPersonalCache(){for(const key of ['checkout-details','checkout-key','latest-order','support-email','coupon','test-checkout','test-checkout-key','cart-dirty'])localStorage.removeItem('ds-'+key);}
const errorMessage=error=>({'auth/invalid-credential':'Email or password is incorrect.','auth/email-already-in-use':'This email already has an account. Sign in or reset your password.','auth/popup-closed-by-user':'Google sign-in was closed. Try again.','auth/popup-blocked':'Allow the sign-in popup and try again.','auth/account-exists-with-different-credential':'Use your existing sign-in method for this email.','auth/user-disabled':'This account is disabled. Contact support.','auth/too-many-requests':'Too many attempts. Please wait and try again.','auth/network-request-failed':'Check your internet connection and try again.','permission-denied':'Your account does not have access to this information.'}[error.code]||error.message||'Unable to complete this request.');
async function list(name,condition){let cursor,records=[];do{const constraints=[...(condition?(Array.isArray(condition[0])?condition:[condition]).map(c=>where(...c)):[]),orderBy(documentId()),limit(100),...(cursor?[startAfter(cursor)]:[])];const snapshot=await getDocs(query(collection(db,name),...constraints));records.push(...snapshot.docs.map(d=>({...d.data(),id:d.id,uid:d.data().uid||d.id})));cursor=snapshot.size===100?snapshot.docs.at(-1):null;}while(cursor);return records;}
async function api(action,data={}){if(!auth.currentUser)throw new Error('Sign in to continue.');const token=await auth.currentUser.getIdToken(),attestation=await browserAttestation();const response=await fetch('/api/store?action='+encodeURIComponent(action),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...(attestation?{'X-Firebase-AppCheck':attestation}:{})},body:JSON.stringify(data)});const body=await response.json().catch(()=>({error:'The backend could not be reached. Try again.'}));if(!response.ok)throw new Error(body.error||'Request failed.');return body;}
function publish(){PRODUCTS.splice(0,PRODUCTS.length,...state.products.filter(p=>p.status==='Active'&&p.approved===true&&p.title&&Number.isFinite(p.price)&&p.price>0).map(p=>({...p,style:p.style||'graphic',collection:p.collectionName||SECTIONS[p.section]?.name,care:p.care||'Follow the product care label.'})));const before=Store.get('cart',[]),after=before.filter(i=>PRODUCTS.some(p=>p.id===i.product)).map(i=>{const p=PRODUCTS.find(p=>p.id===i.product);return{...i,price:p.price,name:p.title,image:productImage(p)}});if(JSON.stringify(before)!==JSON.stringify(after)){Store.set('cart',after);refreshBag();if(session)saveCart().catch(e=>toast(errorMessage(e)));}window.dispatchEvent(new Event('ds-cloud-change'));}
async function refresh(){if(refreshing)return refreshing;refreshing=(async()=>{
 const publicLists=await Promise.allSettled([list('products',[['status','==','Active'],['approved','==',true]]),list('phoneModels',['status','==','Active']),list('jobs',['status','==','Published'])]);
 try{const response=await fetch('/api/store?action=health',{cache:'no-store'}),health=await response.json();Backend.features.testPayments=response.ok&&health.features?.testPayments===true;}catch{Backend.features.testPayments=false;}
 for(const r of publicLists)if(r.status==='rejected')throw r.reason;
 [state.products,state.phoneModels,state.jobs]=publicLists.map(r=>r.value);
 if(session){const definitions=session.type==='admin'?['products','phoneModels','jobs','users','admins','orders','tickets','phoneModelRequests','applications']:['orders','tickets','phoneModelRequests','applications'];const results=await Promise.allSettled(definitions.map(name=>list(name,session.type==='admin'?null:['customerId','==',session.id])));for(let i=0;i<results.length;i++){if(results[i].status==='rejected')throw results[i].reason;state[definitions[i]]=results[i].value;}state.orders.sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));}
 publish();return state;
 })().finally(()=>refreshing=null);return refreshing;}
let authQueue=Promise.resolve();
function synchronizeUser(user){return authQueue=authQueue.catch(()=>{}).then(()=>syncUser(user));}
async function syncUser(user){
 if(user?.uid!==auth.currentUser?.uid)return;
 session=null;for(const key of ['users','admins','orders','tickets','phoneModelRequests','applications'])state[key]=[];
 if(user){
  const token=await user.getIdTokenResult(true),profileSnap=await getDoc(doc(db,'users',user.uid)),p=profileSnap.data();
  if(p?.status==='Inactive'){await signOut(auth);throw new Error('This account is inactive. Contact support.');}
  const isAdmin=user.emailVerified&&token.claims.admin===true;
  session={id:user.uid,uid:user.uid,email:user.email||'',name:p?.name||user.displayName||'Customer',phone:p?.phone||'',type:isAdmin?'admin':'customer',role:isAdmin?(token.claims.adminHead===true?'Admin Head':'Admin'):'Customer',emailVerified:user.emailVerified,status:'Active'};
  if(!p){await setDoc(doc(db,'users',user.uid),{uid:user.uid,id:user.uid,name:session.name,email:session.email,phone:'',status:'Active',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});}
  const previousOwner=Store.get('cart-owner','');if(previousOwner&&previousOwner!==user.uid){Store.set('saved-design',null);clearPersonalCache();}
  const cloudCart=await getDoc(doc(db,'carts',user.uid));const guest=Store.get('cart',[]);
  if(Store.get('cart-dirty',null)?.uid===user.uid&&Store.get('cart-owner','')===user.uid)await saveCart();else if(cloudCart.exists())Store.set('cart',cloudCart.data().items||[]);else if(guest.length&&!Store.get('cart-owner',''))await saveCart();else Store.set('cart',[]);
  Store.set('cart-owner',user.uid);
  const draft=await getDoc(doc(db,'designs',user.uid));if(draft.exists())Store.set('saved-design',draft.data().draft);
 }else if(Store.get('cart-owner','')){Store.set('cart',[]);Store.set('cart-owner','');Store.set('saved-design',null);clearPersonalCache();}
 await refresh();refreshBag();
}
let cartQueue=Promise.resolve();
function saveCart(){const user=auth.currentUser;if(!user)return Promise.resolve();const items=DS.getCart(),snapshot=JSON.stringify(items),data=JSON.parse(snapshot);if(snapshot.length>650000)return Promise.reject(new Error('This design is too large to sync. Download the print package and keep it in this browser.'));Store.set('cart-dirty',{uid:user.uid,snapshot});cartQueue=cartQueue.catch(()=>{}).then(()=>setDoc(doc(db,'carts',user.uid),{uid:user.uid,items:data,updatedAt:serverTimestamp()})).then(()=>{const pending=Store.get('cart-dirty',null);if(pending?.uid===user.uid&&pending.snapshot===snapshot)Store.set('cart-dirty',null);});return cartQueue;}
const Backend={state,api,refresh,errorMessage,browserAttestation,session:()=>session,user:()=>auth.currentUser,
 async google(){const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider);await authQueue;if(session?.id!==auth.currentUser?.uid)await synchronizeUser(auth.currentUser);},
 async login(mail,password){await signInWithEmailAndPassword(auth,mail,password);await authQueue;if(session?.id!==auth.currentUser?.uid)await synchronizeUser(auth.currentUser);},
 async signup(data){const credential=await createUserWithEmailAndPassword(auth,data.email,data.password);await updateProfile(credential.user,{displayName:data.name});await authQueue;if(session?.id!==credential.user.uid)await synchronizeUser(credential.user);const saved=await api('profile',{name:data.name,phone:data.phone});Object.assign(session,{name:saved.profile.name,phone:saved.profile.phone});await sendEmailVerification(credential.user);},
 reset:mail=>sendPasswordResetEmail(auth,mail),verify:()=>sendEmailVerification(auth.currentUser),
 async logout(){await signOut(auth);session=null;Store.set('cart',[]);Store.set('cart-owner','');Store.set('saved-design',null);clearPersonalCache();},
 async mutate(action,data){const result=await api(action,data);await refresh();return result;},
 async profile(data){await api('profile',data);await synchronizeUser(auth.currentUser);},
 async draft(draft){if(!auth.currentUser)throw new Error('Sign in to save a draft across devices.');const data=JSON.parse(JSON.stringify(draft));if(JSON.stringify(data).length>650000)throw new Error('This draft is too large to sync. Download the print package.');await setDoc(doc(db,'designs',auth.currentUser.uid),{uid:auth.currentUser.uid,draft:data,originalsStored:false,updatedAt:serverTimestamp()});},saveCart,
 features:{payments:false,artworkStorage:false,testPayments:false},
 async startTestPayment(details){const items=DS.getCart(),fingerprint=JSON.stringify({uid:session?.id,items,details,coupon:localGet('coupon','')});let attempt=localGet('test-checkout-key',null);if(!attempt||attempt.fingerprint!==fingerprint){attempt={key:crypto.randomUUID(),fingerprint};localSet('test-checkout-key',attempt);localSet('test-checkout',null);}const result=await api('create-payment',{key:attempt.key,delivery:details,items,coupon:localGet('coupon','')});localSet('test-checkout',{id:result.order.id,key:attempt.key,fingerprint,cart:JSON.stringify(items)});await refresh();return result;},
 async verifyTestPayment(id,payment){const result=await api('verify-payment',{id,...payment});await refresh();return result;},
 async testPaymentStatus(id){const result=await api('payment-status',{id});await refresh();return result;},
 async finishTestPayment(order){if(order.payment!=='Test paid'||order.paymentMode!=='test')throw new Error('Test payment is not confirmed.');localSet('latest-order',order.id);const attempt=localGet('test-checkout',null);if(attempt?.id===order.id){if(attempt.cart===JSON.stringify(DS.getCart())){localSet('cart',[]);localSet('coupon','');await saveCart();refreshBag();}localSet('test-checkout',null);localSet('test-checkout-key',null);}}
};
window.Backend=Backend;
const cloudKeys={'managed-products':'products','customers':'users','admins':'admins','orders':'orders','tickets':'tickets','jobs':'jobs','phone-models':'phoneModels','phone-model-requests':'phoneModelRequests'};
const localGet=Store.get.bind(Store),localSet=Store.set.bind(Store);
Store.get=(key,fallback)=>key==='customers'?state.users.filter(u=>!state.admins.some(a=>a.id===u.id)):cloudKeys[key]?state[cloudKeys[key]]:key==='session'?session:localGet(key,fallback);
Store.set=(key,value)=>{if(cloudKeys[key]||key==='session')throw new Error('Shared records must be saved through the authenticated backend.');return localSet(key,value);};
Object.assign(DS,{session:()=>session,logout:()=>Backend.logout(),managedProducts:()=>state.products,orders:()=>state.orders,tickets:()=>state.tickets,
 async addTicket(data){return (await Backend.mutate('ticket',data)).ticket;},
 async createOrder(details){const key=localGet('checkout-key',null)||crypto.randomUUID();localSet('checkout-key',key);const result=await Backend.mutate('create-order',{key,delivery:details,items:DS.getCart(),coupon:localGet('coupon','')});localSet('latest-order',result.order.id);localSet('cart',[]);localSet('coupon','');localSet('checkout-key',null);await saveCart();refreshBag();return result.order;}
});
window.addEventListener('ds-cart-change',()=>saveCart().catch(e=>toast(errorMessage(e))));
onAuthStateChanged(auth,async user=>{try{await synchronizeUser(user);if(initial){initial=false;DS._ready();}else window.dispatchEvent(new Event('ds-auth-change'));}catch(error){if(initial){initial=false;DS._reject(error);}else DS.fail(error);}});
// Refresh shared records while a visible page is open without making hidden tabs poll.
setInterval(()=>{if(!document.hidden)refresh().catch(error=>DS.fail(error));},90000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh().catch(error=>DS.fail(error));});
