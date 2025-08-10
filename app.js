function hash(s){let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i)|0;return h.toString();}
function getUsers(){return JSON.parse(localStorage.getItem('users')||'{}');}
function setUsers(u){localStorage.setItem('users', JSON.stringify(u));}
function current(){return sessionStorage.getItem('currentUser');}
if(!current()){ location.href='index.html'; }
const who = document.getElementById('who'); who.textContent = 'Connecté : ' + current();
document.querySelectorAll('.tabs button').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('main .tab').forEach(t=>t.classList.remove('active'));
    document.getElementById(btn.dataset.tab).classList.add('active');
    if(btn.dataset.tab === 'stats'){renderStats();}
    if(btn.dataset.tab === 'admin'){renderAdmin();}
    if(btn.dataset.tab === 'settings'){loadSettings();}
  };
});
const users = getUsers(); const me = users[current()]; if(me && me.role === 'admin'){ document.getElementById('adminTab').style.display='inline-block'; }
let duration = 5*60, remaining = duration, interval=null, wakeLock=null;
const display = document.getElementById('display');
function fmt(sec){const m=Math.floor(sec/60).toString().padStart(2,'0');const s=Math.floor(sec%60).toString().padStart(2,'0');return m+':'+s;}
function render(){ if(display) display.textContent=fmt(remaining); } render();
function tick(){ remaining--; if(remaining<=0){ remaining=0; clearInterval(interval); interval=null; alert("Bien joué. Note l'intensité /10 et relance si besoin."); } render(); }
function startTimer(){ if(interval) return; if(remaining===0) remaining=duration; interval=setInterval(tick,1000); }
function addFive(){ remaining+=5*60; render(); }
function resetTimer(){ clearInterval(interval); interval=null; remaining=duration; render(); }
document.getElementById('start').onclick=startTimer;
document.getElementById('add5').onclick=addFive;
document.getElementById('reset').onclick=resetTimer;
document.getElementById('wakelock').onclick=async()=>{
  try{
    if(!('wakeLock' in navigator)) return alert('Wake Lock non supporté sur cet appareil.');
    if(!wakeLock){ wakeLock = await navigator.wakeLock.request('screen'); document.getElementById('wakelock').textContent='🔒 Écran maintenu réveillé'; wakeLock.addEventListener('release',()=>{document.getElementById('wakelock').textContent='🔓 Garder l’écran allumé'; wakeLock=null;}); }
    else { await wakeLock.release(); }
  }catch(e){ alert('Wake Lock refusé: '+e.message); }
};
document.addEventListener('visibilitychange', async () => { if (wakeLock && document.visibilityState === 'visible') { try { wakeLock = await navigator.wakeLock.request('screen'); } catch {} } });
const tableBody = document.querySelector('#logTable tbody');
function myData(){ const u=getUsers(); return (u[current()]||{data:{journal:[],settings:{}}}).data; }
function saveMyData(d){ const u=getUsers(); u[current()].data=d; setUsers(u); }
function addRow(entry, idx){
  const tr=document.createElement('tr'); const d=new Date(entry.ts);
  const rm=document.createElement('button'); rm.textContent='Suppr'; rm.className='secondary';
  rm.onclick=()=>{ const d=myData(); d.journal.splice(idx,1); saveMyData(d); renderJournal(); renderStats(); };
  tr.innerHTML=`<td>${d.toLocaleDateString()}</td><td>${d.toLocaleTimeString().slice(0,5)}</td>
                <td>${entry.intensity}</td><td>${entry.trigger||''}</td><td>${entry.action||''}</td>`;
  const td=document.createElement('td'); td.appendChild(rm); tr.appendChild(td); tableBody.appendChild(tr);
}
function renderJournal(){ if(!tableBody) return; tableBody.innerHTML=''; const d=myData(); (d.journal||[]).forEach((e,i)=>addRow(e,i)); }
renderJournal();
document.getElementById('addEntry').onclick=()=>{
  const intensity=parseInt(document.getElementById('intensity').value||'0',10);
  const trigger=document.getElementById('trigger').value.trim(); 
  const action=document.getElementById('action').value.trim();
  if(!intensity||intensity<1||intensity>10){ alert('Intensité 1 à 10.'); return; }
  const d=myData(); d.journal=d.journal||[]; d.journal.unshift({ts:Date.now(), intensity, trigger, action}); saveMyData(d);
  document.getElementById('trigger').value=''; document.getElementById('action').value=''; renderJournal(); renderStats();
};
function loadSettings(){
  const d=myData(); const s=d.settings || (d.settings={pricePerPack:11.0,cigsPerDay:10});
  const priceInput=document.getElementById('pricePerPack'); const cigsInput=document.getElementById('cigsPerDay');
  if(priceInput) priceInput.value = s.pricePerPack ?? 11.0; if(cigsInput) cigsInput.value = s.cigsPerDay ?? 10;
}
loadSettings();
document.getElementById('saveSettings').onclick=()=>{
  const d=myData(); const s=d.settings || (d.settings={});
  s.pricePerPack = parseFloat(document.getElementById('pricePerPack').value||'11.0');
  s.cigsPerDay   = parseInt(document.getElementById('cigsPerDay').value||'10',10);
  saveMyData(d); alert('Paramètres enregistrés.'); renderStats();
};
function renderStats(){
  const d=myData(); const list=(d.journal||[]);
  if(list.length===0){ document.getElementById('statsSummary').textContent='Aucune donnée pour le moment.'; return; }
  const n=list.length; const avg=(list.reduce((s,e)=>s+e.intensity,0)/n).toFixed(1);
  const price = (d.settings?.pricePerPack ?? 11.0); const perCig = price / 20; const saved = (perCig * n).toFixed(2);
  const freq = {}; list.forEach(e=>{ const t=(e.trigger||'autre').toLowerCase(); freq[t]=(freq[t]||0)+1; });
  const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>`${k} (${v})`).join(', ') || '—';
  document.getElementById('statsSummary').innerHTML = `Entrées: <b>${n}</b><br>Intensité moyenne: <b>${avg}</b><br>Déclencheurs fréquents: <b>${top}</b><br>Économies estimées: <b>${saved} €</b> (approx)`;
}
function renderAdmin(){
  const container=document.getElementById('adminList'); if(!container) return; container.innerHTML='';
  const u=getUsers(); Object.keys(u).forEach(name=>{
    const d=u[name].data||{journal:[]}; const box=document.createElement('div'); box.className='card';
    box.innerHTML = `<h3>${name} — ${(d.journal||[]).length} entrées</h3>`;
    const ul=document.createElement('ul');
    (d.journal||[]).slice(0,10).forEach(e=>{
      const li=document.createElement('li'); const dt=new Date(e.ts).toLocaleString();
      li.textContent=`${dt} — Intensité ${e.intensity} — ${e.trigger||''} — ${e.action||''}`; ul.appendChild(li);
    });
    const btn=document.createElement('button'); btn.textContent='Exporter CSV'; btn.className='secondary';
    btn.onclick=()=>exportCSV(name, d.journal||[]); box.appendChild(ul); box.appendChild(btn); container.appendChild(box);
  });
}
function exportCSV(name, rows){
  const header = 'ts,date,heure,intensite,declencheur,action\n';
  const body = rows.map(e=>{
    const d=new Date(e.ts); const date=d.toLocaleDateString(); const t=d.toLocaleTimeString().slice(0,5);
    return [e.ts,date,t,e.intensity,(e.trigger||'').replace(',',' '),(e.action||'').replace(',',' ')].join(',');
  }).join('\n');
  const blob = new Blob([header+body],{type:'text/csv'}); const url = URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`journal_${name}.csv`; a.click(); URL.revokeObjectURL(url);
}
document.getElementById('logout').onclick=()=>{ sessionStorage.removeItem('currentUser'); location.href='index.html'; };
