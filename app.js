// === Replace with your project keys ===

const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";

const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

const BUCKET = "uploads";



const supabase = supabasejs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



// ---------- Helpers ----------

const el = (sel) => document.querySelector(sel);

const listEl = el("#list");

const msgEl = el("#formMsg");

const submitBtn = el("#submitBtn");



let page = 0;

const PAGE_SIZE = 10;



// ---------- Submit form ----------

el("#requestForm").addEventListener("submit", async (e) => {

  e.preventDefault();

  msgEl.className = "msg";

  msgEl.textContent = "Uploading… please wait";

  submitBtn.disabled = true;



  const form = new FormData(e.target);

  const title = form.get("title")?.toString().trim();

  const category = form.get("category")?.toString().trim();

  const zip = form.get("zip")?.toString().trim();

  const task_date = form.get("task_date") || null;

  const description = form.get("description")?.toString().trim() || "";

  const contact = form.get("contact")?.toString().trim() || null;



  if(!title || !category || !zip){

    msgEl.className = "msg err";

    msgEl.textContent = "Please fill required fields.";

    submitBtn.disabled = false;

    return;

  }



  // Upload files (max 5)

  const filesInput = document.getElementById("files");

  const files = Array.from(filesInput.files || []).slice(0, 5);



  const urls = [];

  for (const file of files) {

    const ext = file.name.split(".").pop();

    const path = `req_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });

    if (upErr) {

      console.error(upErr);

      msgEl.className = "msg err";

      msgEl.textContent = "Upload failed. Try smaller files or another format.";

      submitBtn.disabled = false;

      return;

    }

    // Get public URL

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    urls.push(data.publicUrl);

  }



  // Insert row

  const { error: insErr } = await supabase

    .from("requests")

    .insert({

      title, category, zip, task_date: task_date || null,

      description, contact, media_urls: urls

    });



  if (insErr) {

    console.error(insErr);

    msgEl.className = "msg err";

    msgEl.textContent = "Could not save your request. Please try again.";

  } else {

    msgEl.className = "msg ok";

    msgEl.textContent = "Posted! Your request is now live.";

    e.target.reset();

    // refresh feed

    page = 0; listEl.innerHTML = "";

    await loadRequests(true);

    location.hash = "#feed";

  }

  submitBtn.disabled = false;

});



// ---------- List / Filters ----------

async function loadRequests(reset=false){

  const q = el("#q").value.trim();

  const cat = el("#cat").value.trim();

  const zip = el("#zip").value.trim();



  let query = supabase.from("requests").select("*").order("created_at", { ascending: false });



  if (q){

    // Full text: filter title/description contains

    query = query.ilike("title", `%${q}%`).or(`description.ilike.%${q}%`);

  }

  if (cat){ query = query.eq("category", cat); }

  if (zip){ query = query.ilike("zip", `%${zip}%`); }



  // pagination

  const from = page * PAGE_SIZE;

  const to = from + PAGE_SIZE - 1;



  const { data, error } = await query.range(from, to);

  if (error){ console.error(error); return; }



  if (reset) listEl.innerHTML = "";

  renderList(data || []);

  el("#loadMore").classList.toggle("hidden", !data || data.length < PAGE_SIZE);

}



function renderList(rows){

  for (const r of rows){

    const d = new Date(r.task_date || r.created_at);

    const niceDate = d.toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });

    const firstImg = (r.media_urls && r.media_urls[0]) ? `<a class="btn" href="${r.media_urls[0]}" target="_blank"><i class="fa-regular fa-image"></i> View file</a>` : "";



    const snippet = (r.description || "").slice(0, 120);

    const item = document.createElement("div");

    item.className = "item";

    item.innerHTML = `

      <h3>${escapeHtml(r.title)}</h3>

      <div class="tags">

        <span class="tag">${escapeHtml(r.category || "Other")}</span>

        ${r.zip ? `<span class="tag">${escapeHtml(r.zip)}</span>` : ""}

        <span class="tag">${niceDate}</span>

      </div>

      <p>${escapeHtml(snippet)}${r.description && r.description.length>120 ? "…" : ""}</p>

      <div class="actions">

        <a class="btn primary" href="mailto:" onclick="alert('Coordinate directly via replies. Keep it safe!'); return false;"><i class="fa-regular fa-handshake"></i> Offer to help</a>

        ${firstImg}

      </div>

    `;

    listEl.appendChild(item);

  }

}



// basic escaping

function escapeHtml(s){

  return s?.replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m])) ?? "";

}



// Events

document.getElementById("apply").addEventListener("click", ()=>{ page=0; loadRequests(true); });

document.getElementById("clear").addEventListener("click", ()=>{

  el("#q").value = ""; el("#cat").value = ""; el("#zip").value = "";

  page=0; loadRequests(true);

});

document.getElementById("loadMore").addEventListener("click", ()=>{ page++; loadRequests(); });



// Initial

loadRequests(true);
