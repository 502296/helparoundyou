/* ===== Supabase config ===== */

const SUPABASE_URL = "https://afqjgrcoiwitfftbjltp.supabase.co";

const SUPABASE_ANON_KEY = "PUT_YOUR_ANON_KEY_HERE"; // ضع anon key بين " "

const BUCKET = "uploads";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



/* ===== Helpers ===== */

const $ = (s)=>document.querySelector(s);

const esc=(s)=>s?.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))??"";

const PAGE_SIZE = 10;



document.addEventListener("DOMContentLoaded",()=>{

  const page = document.body.getAttribute("data-page");

  console.log("app.js ready page=",page);



  if(page==="post") initPost();

  if(page==="requests") initRequests();

});



/* ===== Page: Post ===== */

function initPost(){

  const form=$("#requestForm"), msg=$("#formMsg"), submitBtn=$("#submitBtn");

  form.addEventListener("submit", async (e)=>{

    e.preventDefault(); msg.className="msg"; msg.textContent="Uploading…"; submitBtn.disabled=true;



    const title=$("#title").value.trim(), category=$("#category").value.trim(), zip=$("#zip").value.trim();

    const task_date=$("#date").value||null, description=$("#description").value.trim(), contact=$("#contact").value.trim()||null;

    if(!title||!category||!zip){ msg.className="msg err"; msg.textContent="Please fill required fields."; submitBtn.disabled=false; return; }



    // upload files (optional)

    const fList = Array.from($("#files").files||[]).slice(0,5), media_urls=[];

    for(const f of fList){

      if(f.size>10*1024*1024){ msg.className="msg err"; msg.textContent="File too large (>10MB)."; submitBtn.disabled=false; return; }

      const ext=(f.name.split(".").pop()||"bin").toLowerCase();

      const path=`req_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error:upErr } = await sb.storage.from(BUCKET).upload(path,f,{upsert:false});

      if(upErr){ console.error(upErr); msg.className="msg err"; msg.textContent="Upload failed. Check bucket/policies."; submitBtn.disabled=false; return; }

      const { data } = sb.storage.from(BUCKET).getPublicUrl(path); media_urls.push(data.publicUrl);

    }



    const { error:insErr } = await sb.from("requests").insert({ title, category, zip, task_date, description, contact, media_urls });

    if(insErr){ console.error(insErr); msg.className="msg err"; msg.textContent="Could not save your request."; }

    else{ msg.className="msg ok"; msg.textContent="Posted! Redirecting to requests…"; form.reset(); setTimeout(()=>location.href="requests.html",700); }

    submitBtn.disabled=false;

  });

}



/* ===== Page: Requests ===== */

function initRequests(){

  const list=$("#list"), q=$("#q"), cat=$("#cat"), zip=$("#zipf"), loadMore=$("#loadMore");

  let page=0;



  async function load(reset=false){

    let qb = sb.from("requests").select("*").order("created_at",{ascending:false});

    const text=q.value.trim(), c=cat.value.trim(), z=zip.value.trim();

    if(text) qb = qb.or(`title.ilike.%${text}%,description.ilike.%${text}%`);

    if(c) qb = qb.eq("category",c);

    if(z) qb = qb.ilike("zip",`%${z}%`);

    const from=page*PAGE_SIZE,to=from+PAGE_SIZE-1;

    const { data, error } = await qb.range(from,to);

    if(error){ console.error(error); return; }

    if(reset) list.innerHTML="";

    render(data||[]);

    loadMore.classList.toggle("hidden", !(data&&data.length===PAGE_SIZE));

  }



  function render(rows){

    for(const r of rows){

      const d=new Date(r.task_date||r.created_at), nice=d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});

      const first = (r.media_urls&&r.media_urls[0]) ? `<a class="btn btn-ghost btn-sm" href="${r.media_urls[0]}" target="_blank">View file</a>` : "";

      const el=document.createElement("div"); el.className="item";

      el.innerHTML = `

        <h3 style="margin:0">${esc(r.title)}</h3>

        <div class="tags">

          <span class="tag">${esc(r.category||"Other")}</span>

          ${r.zip?`<span class="tag">${esc(r.zip)}</span>`:""}

          <span class="tag">${nice}</span>

        </div>

        <p style="margin:6px 0">${esc((r.description||"").slice(0,160))}${(r.description||"").length>160?"…":""}</p>

        <div class="actions">

          <button class="btn btn-primary btn-sm" onclick="alert('Coordinate directly via email/text. Stay safe!')">Offer to help</button>

          ${first}

        </div>`;

      list.appendChild(el);

    }

  }



  $("#apply").addEventListener("click",()=>{page=0;load(true)});

  $("#clear").addEventListener("click",()=>{q.value="";cat.value="";zip.value="";page=0;load(true)});

  loadMore.addEventListener("click",()=>{page++;load()});

  load(true);

}
