// ---- Supabase config ----

const SUPABASE_URL = "https://afqjgrcoiwitfftbjltp.supabase.co";

const SUPABASE_ANON_KEY = "PUT_YOUR_ANON_KEY_HERE"; // ضع مفتاح anon هنا

const BUCKET = "uploads";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



// ---- Modal open/close (يعتمد على data-open/data-close) ----

document.querySelectorAll("[data-open]").forEach(b=>{

  b.addEventListener("click",()=>document.getElementById(b.dataset.open)?.classList.add("show"));

});

document.querySelectorAll("[data-close]").forEach(b=>{

  b.addEventListener("click",()=>b.closest(".modal")?.classList.remove("show"));

});

document.getElementById("postModal").addEventListener("click",(e)=>{ if(e.target.id==="postModal") e.currentTarget.classList.remove("show"); });



// ---- Helpers ----

const $ = (s)=>document.querySelector(s);

const listEl = $("#list"), msgEl = $("#formMsg"), submitBtn = $("#submitBtn");

let page=0; const PAGE_SIZE=10;



// ---- Submit form ----

$("#requestForm").addEventListener("submit",async(e)=>{

  e.preventDefault(); msgEl.className="msg"; msgEl.textContent="Uploading…"; submitBtn.disabled=true;

  const title=$("#title").value.trim(), category=$("#category").value.trim(), zip=$("#zip").value.trim();

  const task_date=$("#date").value||null, description=$("#description").value.trim(), contact=$("#contact").value.trim()||null;

  if(!title||!category||!zip){ msgEl.className="msg err"; msgEl.textContent="Please fill required fields."; submitBtn.disabled=false; return; }

  const files=Array.from($("#files").files||[]).slice(0,5), urls=[];

  for(const f of files){

    if(f.size>10*1024*1024){ msgEl.className="msg err"; msgEl.textContent="File too large (>10MB)."; submitBtn.disabled=false; return; }

    const ext=(f.name.split(".").pop()||"bin").toLowerCase();

    const path=`req_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error:upErr } = await sb.storage.from(BUCKET).upload(path,f,{upsert:false});

    if(upErr){ console.error(upErr); msgEl.className="msg err"; msgEl.textContent="Upload failed. Check bucket/policies."; submitBtn.disabled=false; return; }

    const { data } = sb.storage.from(BUCKET).getPublicUrl(path); urls.push(data.publicUrl);

  }

  const { error:insErr } = await sb.from("requests").insert({ title, category, zip, task_date, description, contact, media_urls: urls });

  if(insErr){ console.error(insErr); msgEl.className="msg err"; msgEl.textContent="Could not save your request."; }

  else{ msgEl.className="msg ok"; msgEl.textContent="Posted! Your request is now live."; e.target.reset(); document.getElementById("postModal").classList.remove("show"); page=0; listEl.innerHTML=""; await load(true); location.hash="#feed"; }

  submitBtn.disabled=false;

});



// ---- List & filters ----

async function load(reset=false){

  const q=$("#q").value.trim(), cat=$("#cat").value.trim(), zipf=$("#zipf").value.trim();

  let qb=sb.from("requests").select("*").order("created_at",{ascending:false});

  if(q) qb=qb.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

  if(cat) qb=qb.eq("category",cat);

  if(zipf) qb=qb.ilike("zip",`%${zipf}%`);

  const from=page*PAGE_SIZE,to=from+PAGE_SIZE-1;

  const { data,error }=await qb.range(from,to);

  if(error){ console.error(error); return; }

  if(reset) listEl.innerHTML="";

  render(data||[]);

  $("#loadMore").classList.toggle("hidden",!(data&&data.length===PAGE_SIZE));

}

function render(rows){

  for(const r of rows){

    const d=new Date(r.task_date||r.created_at), nice=d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});

    const img=(r.media_urls&&r.media_urls[0])?`<a class="btn btn-ghost btn-sm" href="${r.media_urls[0]}" target="_blank">View file</a>`:"";

    const snippet=(r.description||"").slice(0,140);

    const el=document.createElement("div");

    el.className="item";

    el.innerHTML=`<h3 style="margin:0">${esc(r.title)}</h3>

    <div class="tags"><span class="tag">${esc(r.category||"Other")}</span>${r.zip?`<span class="tag">${esc(r.zip)}</span>`:""}<span class="tag">${nice}</span></div>

    <p style="margin:6px 0">${esc(snippet)}${r.description&&r.description.length>140?"…":""}</p>

    <div class="actions"><button class="btn btn-primary btn-sm" onclick="alert('Coordinate directly via email/text. Stay safe!')">Offer to help</button>${img}</div>`;

    listEl.appendChild(el);

  }

}

const esc=(s)=>s?.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))??"";

document.getElementById("apply").addEventListener("click",()=>{page=0;load(true)});document.getElementById("clear").addEventListener("click",()=>{$("#q").value="";$("#cat").value="";$("#zipf").value="";page=0;load(true)});document.getElementById("loadMore").addEventListener("click",()=>{page++;load()});

load(true);
