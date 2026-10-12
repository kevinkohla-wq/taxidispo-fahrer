(() => {
const cfg = window.TAXIDISPO_CONFIG || {};
const $ = id => document.getElementById(id);
const demoTrips = [
 {id:"demo1",time:"06:20",type:"HF",customer:"Beispielkunde",pickup:"Abholadresse nach Einrichtung",destination:"Zieladresse nach Einrichtung",note:"Demo-Fahrt: keine echten Kundendaten",status:"Geplant"},
 {id:"demo2",time:"10:45",type:"Dialyse",customer:"Beispielkunde",pickup:"Abholadresse nach Einrichtung",destination:"Dialyse / Klinik",note:"Demo-Fahrt: keine echten Kundendaten",status:"Geplant"}
];
let trips = demoTrips;
let lastUpdated = null;
const today = new Intl.DateTimeFormat("de-DE",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(new Date());
$("today").textContent = today;
$("callLink").href = cfg.dispatcherPhone ? `tel:${cfg.dispatcherPhone}` : "tel:";
$("discordBtn").addEventListener("click",()=>{if(cfg.voiceChannelUrl) location.href=cfg.voiceChannelUrl; else alert("Bitte voiceChannelUrl in config.js eintragen.");});
$("saveDriver").addEventListener("click",()=>{const name=$("driver").value.trim()||"Fahrer";$("greeting").textContent=`Fahrplan, ${name}`;loadTrips();});
$("refresh").addEventListener("click",loadTrips);
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function render(){
 $("count").textContent=`${trips.length} ${trips.length===1?"Fahrt":"Fahrten"}`;
 if(!trips.length){$("trips").innerHTML='<div class="empty">Für heute sind keine Fahrten eingetragen.</div>';return;}
 $("trips").innerHTML=trips.map(t=>`<article class="trip"><div class="trip-top"><div><div class="time">${escapeHtml(t.time||"--:--")}</div><span class="tag">${escapeHtml(t.type||"Fahrt")}</span></div><span class="pill">${escapeHtml(t.status||"Geplant")}</span></div><h3>${escapeHtml(t.customer||"Fahrt")}</h3><p class="address"><span class="arrow">●</span>${escapeHtml(t.pickup||"Abholadresse fehlt")}</p><p class="address"><span class="arrow">◆</span>${escapeHtml(t.destination||"Ziel nicht angegeben")}</p>${t.note?`<p class="note">Hinweis: ${escapeHtml(t.note)}</p>`:""}<div class="trip-actions"><a class="primary" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(t.pickup||"")}" target="_blank" rel="noopener">Navigation zur Abholung</a><button class="secondary" data-status="Angekommen" data-id="${escapeHtml(t.id)}">Angekommen</button><button class="secondary" data-status="Fahrgast aufgenommen" data-id="${escapeHtml(t.id)}">Aufgenommen</button><button class="secondary" data-status="Erledigt" data-id="${escapeHtml(t.id)}">Erledigt</button></div></article>`).join("");
 document.querySelectorAll("[data-status]").forEach(b=>b.addEventListener("click",()=>updateStatus(b.dataset.id,b.dataset.status)));
}
async function loadTrips(){
 if(!cfg.apiUrl){$("connection").textContent="Demo-Modus";$("notice").hidden=false;render();return;}
 try{
  const url=new URL(cfg.apiUrl);url.searchParams.set("action","trips");url.searchParams.set("driver",$("driver").value.trim());
  const res=await fetch(url,{cache:"no-store"});if(!res.ok)throw new Error("HTTP "+res.status);
  const data=await res.json();if(!data.ok)throw new Error(data.error||"API-Fehler");
  trips=data.trips||[];lastUpdated=new Date();$("connection").textContent="Verbunden";$("notice").hidden=true;render();
 }catch(e){$("connection").textContent="Offline";$("notice").hidden=false;$("notice").textContent="Verbindung fehlgeschlagen. Bitte später erneut versuchen. Der letzte Plan bleibt nicht automatisch aktuell.";console.error(e);}
}
async function updateStatus(id,status){
 if(String(id).startsWith("demo")){trips=trips.map(t=>t.id===id?{...t,status}:t);render();return;}
 if(!cfg.apiUrl){alert("Die Schnittstelle ist noch nicht eingerichtet.");return;}
 try{const res=await fetch(cfg.apiUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"status",id,status,driver:$("driver").value.trim()})});const data=await res.json();if(!data.ok)throw new Error(data.error||"Fehler");trips=trips.map(t=>t.id===id?{...t,status}:t);render();}
 catch(e){alert("Status konnte nicht gespeichert werden. Bitte Disposition informieren.");}
}
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
loadTrips();setInterval(loadTrips,Math.max(30,Number(cfg.refreshSeconds)||60)*1000);
})();