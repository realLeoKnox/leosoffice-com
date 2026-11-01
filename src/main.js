import './style.css';
import './office.css';
import {preferredLocale} from './language.js';
const menu=document.querySelector('.menu-button'),nav=document.querySelector('.nav');
function closeMenu(){menu?.setAttribute('aria-expanded','false');nav?.classList.remove('open');}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
const languageLinks=[...document.querySelectorAll('[data-language]')];
function syncHash(){languageLinks.forEach(link=>{const url=new URL(link.href);url.hash=location.hash;link.href=url.href;});}
syncHash();window.addEventListener('hashchange',syncHash);
languageLinks.forEach(link=>link.addEventListener('click',()=>{try{localStorage.setItem('leosoffice-language',link.dataset.language);}catch{}}));
let saved,dismissed;
try{saved=localStorage.getItem('leosoffice-language');dismissed=sessionStorage.getItem('leosoffice-language-dismissed');}catch{}
const desired=['en','zh-Hant','zh-Hans'].includes(saved)?saved:preferredLocale(navigator.languages||[navigator.language]);
const notice=document.querySelector('.language-notice'),suggestion=document.querySelector('#language-suggestion');
if(notice&&desired!==document.documentElement.lang&&!dismissed){
 const candidate=languageLinks.find(link=>link.dataset.language===desired);
 if(candidate){suggestion.href=candidate.href;suggestion.textContent={en:'Prefer English? Read in English →','zh-Hant':'偏好繁體中文？切換至繁體版 →','zh-Hans':'偏好简体中文？切换至简体版 →'}[desired];notice.hidden=false;suggestion.addEventListener('click',()=>{try{localStorage.setItem('leosoffice-language',desired);}catch{}});}
}
document.querySelector('[data-dismiss-language]')?.addEventListener('click',()=>{notice.hidden=true;try{sessionStorage.setItem('leosoffice-language-dismissed','1');}catch{}});
const officeButtons=[...document.querySelectorAll('[data-office-key]')];
function selectObject(key){
 const button=officeButtons.find(b=>b.dataset.officeKey===key);if(!button)return;
 officeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.querySelector('#detail-title').textContent=button.dataset.name;
 document.querySelector('#detail-description').textContent=button.dataset.description;
 document.querySelector('#detail-domain').textContent=button.dataset.domain;
 document.querySelector('#detail-link').href=button.dataset.url;
 const roomLink=document.querySelector('#room-link');roomLink.href=button.dataset.url;roomLink.hidden=false;document.querySelector('#room-selection-title').textContent=button.dataset.name;
 document.dispatchEvent(new CustomEvent('office-focus',{detail:key}));
}
officeButtons.forEach(button=>button.addEventListener('click',()=>selectObject(button.dataset.officeKey)));
document.addEventListener('office-object',event=>selectObject(event.detail));
const copy=document.querySelector('[data-copy]'),status=document.querySelector('.copy-status');
copy?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('leo@leosoffice.com');status.textContent=copy.dataset.success;}catch{status.textContent=copy.dataset.failure;}});
const time=document.querySelector('[data-time]');
function updateTime(){if(time)time.textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Taipei'}).format(new Date())+' UTC+8';}
updateTime();setInterval(()=>{if(!document.hidden)updateTime();},30000);
// 3D office: only when WebGL is available; otherwise the static illustration stays.
const officeRoot=document.querySelector('#office-root');
function webgl(){try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;}}
if(officeRoot&&webgl()){
 import('./office/mount.jsx').then(({mountOffice})=>{
  const fail=mountOffice(officeRoot);
  officeRoot.addEventListener('webglcontextlost',fail,{once:true,capture:true});
 }).catch(()=>{officeRoot.dataset.unavailable='true';});
}
