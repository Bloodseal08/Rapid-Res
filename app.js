/* ============ MASTER RESUME (edit this block to update your default resume) ============ */
const USER_NAME = "Scott Cole";
const MASTER_RESUME = `SCOTT COLE
Entry-Level IT Support | Cybersecurity | Windows Server Administration
Portland, OR
Email: scottcole1091@gmail.com | Phone: (530) 218-2242
LinkedIn: https://www.linkedin.com/in/scott-cole-810290163/

PROFESSIONAL SUMMARY
Entry-level IT and Cybersecurity professional holding dual Associate of Applied Science degrees in Cybersecurity and Network Administration, with a strong focus on Windows Server administration, system hardening, Active Directory, and network security fundamentals. Known for tenacity, effective communication, and the ability to stay calm and on task under high pressure — the go-to "Mr. Fix It" for troubleshooting hardware, software applications, and networks. Actively seeking first role in IT as a support specialist.

TECHNICAL SKILLS

Operating Systems & Platforms
- Windows 10/11, Windows Server
- Linux (CLI, Bash)
- Azure Fundamentals
- WSL

Systems & Networking
- Active Directory Domain Services (AD DS)
- TCP/IP, OSI model
- VLANs, IP assignment
- Network configuration & topologies
- Remote Desktop (RDP)
- Virtualization (Hyper-V, VirtualBox)

Security
- Network security fundamentals
- Access control & permissions
- System hardening
- Risk assessment & audits
- NIST Framework
- Threat identification & containment

Scripting & Tools
- PowerShell
- Python (basic)
- Bash
- HTML & CSS (basic)

Productivity
- Microsoft 365 (Word, Excel, Outlook, Teams, OneNote)

EDUCATION
- Associate of Applied Science (AAS) – Cybersecurity | Portland Community College — Portland, OR | Graduated: December 2024
- Associate of Applied Science (AAS) – Network Administration | Portland Community College — Portland, OR | Graduated: December 2024
- Microsoft Windows Server Administration – Certificate Curriculum Equivalent | Portland Community College — Portland, OR | Completed: December 2024

CAREER PAUSE
Family Caregiver (Full-Time)
Temporarily stepped away from the workforce following graduation to provide full-time care for an immediate family member after a serious medical emergency. Situation has since concluded, and I am fully available and actively pursuing a career in IT.

JOB HISTORY

Delivery Driver & Customer Service Associate
Sip City Spirits + Wine + Beer — Portland, OR | 07/2023 – 04/2024
- Delivered time-sensitive orders while maintaining accuracy and professionalism
- Processed transactions via POS
- Assisted customers in product selection and issue resolution
- Maintained organized inventory and clean work environment

Warehouse Associate / Forklift Operator / Customer Service
Lowe's — Hillsboro, OR | 05/2021 – 07/2023
- Coordinated with team members and supervisors to meet daily operational goals
- Safely operated powered industrial equipment
- Provided consistent customer service and problem resolution

(Earlier roles available on request.)

VOLUNTEER & HUMANITARIAN EXPERIENCE

Disaster Relief Volunteer – Carr Fire
Redding, CA | 07/2018
- Distributed essential supplies to displaced individuals
- Assisted with transportation and coordination of resources
- Supported relief organizations as an independent volunteer

Overseas Volunteer – National Aid & Preservation Services (NAPS)
Suriname | 06/2011 – 08/2011
- Assisted remote tribal communities with medical and basic-needs access
- Worked in austere environments without modern infrastructure
- Developed resilience, adaptability, and cross-cultural communication skills`;

const CONTACT = {
  email: "scottcole1091@gmail.com",
  phone: "(530) 218-2242",
  city: "Portland, OR",
  linkedin: "https://www.linkedin.com/in/scott-cole-810290163/"
};

/* ============ STATE ============ */
const $ = id => document.getElementById(id);
let adImages = [];      // [{data, mediaType}]
let result = null;      // parsed JSON from API

/* device storage (works when installed as an app; harmlessly skipped inside Claude) */
function store(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function read(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }

$("resumeBox").value = read("rt_master") || MASTER_RESUME;
$("resumeBox").addEventListener("input", ()=> store("rt_master", $("resumeBox").value));
$("apiKey").value = read("rt_key") || "";
$("saveKey").onclick = ()=>{ store("rt_key", $("apiKey").value.trim());
  $("saveKey").textContent = "✓ Saved"; setTimeout(()=> $("saveKey").textContent="Save key on this device", 1500); };

/* PWA service worker (only when hosted over https) */
if ("serviceWorker" in navigator && location.protocol === "https:")
  navigator.serviceWorker.register("sw.js").catch(()=>{});

/* ============ ANDROID SHARE TARGET ============ */
/* When the user taps Share in the LinkedIn/Indeed app and picks Rapid Res,
   Android relaunches us with the shared content as URL query params. */
(function handleShare(){
  const q = new URLSearchParams(location.search);
  const shared = [q.get("text"), q.get("url")].filter(Boolean).join("\n").trim();
  if(shared){
    const box = $("jobAd");
    box.value = shared;
    store("rt_pending_share", "1");          // hint that a job is loaded
    // clean the URL so a refresh doesn't re-trigger
    history.replaceState(null, "", location.pathname);
    setTimeout(()=> box.scrollIntoView({behavior:"smooth"}), 300);
  }
})();

/* ============ EDIT MODE ============ */
function toggleEdit(prevId, btn){
  const el = $(prevId);
  const on = el.contentEditable === "true";
  el.contentEditable = on ? "false" : "true";
  el.style.outline = on ? "" : "2px solid var(--acc)";
  el.style.maxHeight = on ? "" : "none";
  btn.textContent = on ? "✎ Edit" : "✓ Done editing";
  if(!on) el.focus();
}
$("edResume").onclick = e => toggleEdit("resumePrev", e.currentTarget);
$("edCover").onclick = e => toggleEdit("coverPrev", e.currentTarget);

/* ============ IMAGE CAPTURE ============ */
$("scanBtn").onclick = () => $("camInput").click();
$("uploadBtn").onclick = () => $("galInput").click();
$("camInput").onchange = e => addImage(e.target.files[0]);
$("galInput").onchange = e => addImage(e.target.files[0]);

async function addImage(file){
  if(!file) return;
  try{
    const data = await resizeToJpeg(file, 1568, 0.85);
    adImages.push({data, mediaType:"image/jpeg"});
    renderChips();
  }catch(err){ showErr("Couldn't read that image. Try again."); }
}

function resizeToJpeg(file, maxDim, q){
  return new Promise((res, rej)=>{
    const img = new Image();
    img.onload = ()=>{
      let {width:w, height:h} = img;
      const s = Math.min(1, maxDim/Math.max(w,h));
      const c = document.createElement("canvas");
      c.width = Math.round(w*s); c.height = Math.round(h*s);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      res(c.toDataURL("image/jpeg", q).split(",")[1]);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

function renderChips(){
  $("imgChips").innerHTML = adImages.map((_,i)=>
    `<span class="chip"><b>IMG_${String(i+1).padStart(2,"0")}</b> captured
     <span class="x" data-rm="${i}">✕</span></span> `).join("");
}
function removeImg(i){ adImages.splice(i,1); renderChips(); }
$("imgChips").addEventListener("click", e=>{ const el=e.target.closest("[data-rm]"); if(el) removeImg(+el.dataset.rm); });

/* ============ PIPELINE / STATUS ============ */
const STAGES = ["reading job ad","matching against resume","rewriting summary","reordering sections","drafting cover letter"];
let stageTimer = null;
function startStatus(extraFirst){
  $("status").style.display="block"; $("results").style.display="none";
  const stages = extraFirst ? [extraFirst, ...STAGES] : STAGES;
  let i = 0;
  const draw = ()=>{ $("pipe").innerHTML = stages.map((s,k)=>
    `<div class="${k<=i?"on":""}">${k<=i?"▸":"·"} ${s}${k===i?" …":k<i?" ✓":""}</div>`).join("");
  };
  draw();
  stageTimer = setInterval(()=>{ if(i < stages.length-1){ i++; draw(); } }, 3500);
}
function stopStatus(){ clearInterval(stageTimer); $("status").style.display="none"; }
function showErr(m){ const e=$("errBox"); e.textContent=m; e.style.display="block"; }
function clearErr(){ $("errBox").style.display="none"; }

/* ============ JOB AD LINK HANDLING ============ */
function extractUrl(text){
  const m = text.match(/https?:\/\/[^\s"'<>]+/i);
  return m ? m[0].replace(/[).,;]+$/,"") : null;
}

function htmlToText(html){
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,noscript,svg,iframe,nav,footer,header,form").forEach(n=>n.remove());
  return (doc.body ? doc.body.innerText || doc.body.textContent : "").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();
}

async function fetchJobPage(url){
  // try direct, then free CORS relays — first one that yields real content wins
  const attempts = [
    url,
    "https://api.allorigins.win/raw?url=" + encodeURIComponent(url),
    "https://corsproxy.io/?url=" + encodeURIComponent(url)
  ];
  for(const u of attempts){
    try{
      const r = await fetch(u, {redirect:"follow"});
      if(!r.ok) continue;
      const txt = htmlToText(await r.text());
      // login walls return short "sign in to continue" shells — reject those
      if(txt.length > 400 && !/sign in to continue|join linkedin|create a profile/i.test(txt.slice(0,600)))
        return txt.slice(0, 16000);
    }catch(e){ /* blocked — try next relay */ }
  }
  return null; // page unreachable — Claude's web search takes over
}

function isWalledBoard(url){
  return /linkedin\.com|indeed\.com|glassdoor\.com/i.test(url);
}

function extractJson(text){
  const clean = text.replace(/```json|```/g,"").trim();
  const end = clean.lastIndexOf("}");
  let i = clean.indexOf("{");
  while(i !== -1 && i < end){
    try{ return JSON.parse(clean.slice(i, end+1)); }catch(e){}
    try{ return JSON.parse(clean.slice(i)); }catch(e){}
    i = clean.indexOf("{", i+1);
  }
  throw new Error("couldn't read the tailoring output — try again");
}

/* ============ CLAUDE CALL ============ */
$("goBtn").onclick = run;

async function run(){
  clearErr();
  let adText = $("jobAd").value.trim();
  if(!adText && adImages.length===0){ showErr("Add the job ad first — paste the link, the text, or scan it."); return; }
  $("goBtn").disabled = true;

  // link mode: user pasted a URL (with little or no other text) — fetch the posting for them
  const url = extractUrl(adText);
  const linkMode = url && adText.replace(url,"").trim().length < 200 && adImages.length===0;
  let needWebSearch = false;

  startStatus(linkMode ? "fetching posting from link" : null);
  try{
    if(linkMode){
      const page = await fetchJobPage(url);
      if(page) adText = "Job posting fetched from " + url + " :\n\n" + page;
      else { needWebSearch = true; adText = "JOB AD URL (fetch it via web search): " + url; }
    }

    const content = [];
    adImages.forEach(im => content.push({type:"image", source:{type:"base64", media_type:im.mediaType, data:im.data}}));
    content.push({type:"text", text: buildPrompt(adText, needWebSearch)});

    const key = ($("apiKey").value || "").trim();
    const headers = {"Content-Type":"application/json"};
    if(key){
      headers["x-api-key"] = key;
      headers["anthropic-version"] = "2023-06-01";
      headers["anthropic-dangerous-direct-browser-access"] = "true";
    }
    const body = {
      model:"claude-sonnet-4-20250514",
      max_tokens:1000,
      messages:[{role:"user", content}]
    };
    if(needWebSearch) body.tools = [{type:"web_search_20250305", name:"web_search"}];

    const r = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST", headers, body:JSON.stringify(body)
    });
    const data = await r.json();
    if(data.error) throw new Error(data.error.message || "API error");
    const text = (data.content||[]).map(b=>b.text||"").filter(Boolean).join("\n");
    result = extractJson(text);
    showResults();
  }catch(err){
    console.error(err);
    let msg = "Tailoring failed: " + err.message;
    if(linkMode && isWalledBoard(url))
      msg = "LinkedIn / Indeed / Glassdoor hide full postings behind a login, so the link can't be read automatically. Easiest fix: in their app, open the job, tap Share, and choose Rapid Res — or select the description text and paste it here.";
    else if(linkMode)
      msg += " — that board may block robots; try the Share button in its app, or paste the ad text / a screenshot.";
    else
      msg += " — check the ad content and try again.";
    showErr(msg);
  }finally{
    stopStatus();
    $("goBtn").disabled = false;
  }
}

function buildPrompt(adText, needWebSearch){
  const searchNote = needWebSearch
    ? "\nIMPORTANT: the job ad is only available at the URL given below. FIRST use your web search tool to retrieve the full posting (search the URL and/or the job title + company from the URL slug), THEN do the tailoring. After searching, your final reply must still be ONLY the JSON object described at the end — no commentary.\n"
    : "";
  return `You are an expert resume writer and hiring strategist. Below is a candidate's master resume and a job ad (the ad may be provided as attached image(s) of a posting, as pasted text, as fetched webpage text, or via a URL — read all of it; ignore webpage clutter like menus, cookie banners, and unrelated job listings).
${searchNote}
STRICT RULES:
1. ONE HARD LINE: never invent, add, or exaggerate any skill, qualification, certification, tool, degree, employer, date, or accomplishment that is not in the master resume. Every factual claim must trace back to the master resume. That is the only restriction.
2. Otherwise you are a full-authority resume strategist. You may CUT anything that weakens or dilutes the application for THIS job (irrelevant bullets, weaker skill items, even entire sections like volunteer work if they don't help), REWORD any line anywhere for stronger, sharper impact (action verbs, mirroring the ad's language where truthful), REORDER and regroup everything, and RENAME section headings for better framing. Always keep contact info verbatim and keep enough substance that the resume doesn't look thin — cut to focus, not to gut.
3. YOUR OWN ORIGINAL WRITING is welcome in the PROFESSIONAL SUMMARY / headline and the cover letter: write freely and persuasively there, as long as every factual claim is backed by the master resume.
4. Rewrite the PROFESSIONAL SUMMARY (3-5 sentences) in your own compelling words to position the candidate specifically for this job, mirroring key language from the ad where it truthfully applies.
5. Write a cover letter of EXACTLY two paragraphs (no more), concise, confident, and original: paragraph 1 = why this candidate fits this specific role/company; paragraph 2 = what they bring + call to action. No invented qualifications. Do not include the address/date header or greeting/signoff in the paragraphs — those are added separately.
6. Extract the exact job title and company name from the ad. If the company name is not stated, use "Unknown Company".
MASTER RESUME:
${$("resumeBox").value}

JOB AD TEXT (may be empty if images attached):
${adText || "(see attached images)"}

Respond with ONLY valid JSON, no markdown, no preamble, in exactly this shape:
{
 "jobTitle": "string",
 "company": "string",
 "resume": [
   {"t":"name","x":"SCOTT COLE"},
   {"t":"tag","x":"one-line headline tailored to the job"},
   {"t":"contact","x":"city | email | phone | linkedin on one line"},
   {"t":"h","x":"SECTION HEADING"},
   {"t":"p","x":"paragraph text"},
   {"t":"sh","x":"sub-heading like a job title or skill category"},
   {"t":"m","x":"meta line like company/location/dates"},
   {"t":"b","x":"bullet point"}
 ],
 "coverLetter": ["paragraph 1", "paragraph 2"],
 "greeting": "Dear Hiring Manager," 
}
The "resume" array must contain the FULL reorganized resume in order. Use only the t values shown.`;
}

/* ============ RESULTS ============ */
function showResults(){
  $("jobTitle").value = result.jobTitle || "Position";
  $("company").value = result.company || "Company";
  updateFname();
  renderResume();
  renderCover();
  $("results").style.display="block";
  $("results").scrollIntoView({behavior:"smooth"});
}
$("jobTitle").oninput = updateFname;
$("company").oninput = updateFname;

function clean(s){ return (s||"").trim().replace(/[\\/:*?"<>|]+/g,"").replace(/\s+/g,"_"); }
function baseName(){
  return `${clean(USER_NAME)}_${clean($("jobTitle").value)}_${clean($("company").value)}`;
}
function updateFname(){
  $("fnamePrev").innerHTML = `Files will save as:<br>${baseName()}.docx<br>${baseName()}_Cover_Letter.docx`;
}

function esc(s){ const d=document.createElement("div"); d.textContent=s; return d.innerHTML; }

function renderResume(){
  let html="", inList=false;
  const close=()=>{ if(inList){html+="</ul>"; inList=false;} };
  for(const blk of result.resume){
    const x = esc(blk.x);
    if(blk.t==="b"){ if(!inList){html+="<ul>"; inList=true;} html+=`<li>${x}</li>`; continue; }
    close();
    if(blk.t==="name") html+=`<h2>${x}</h2>`;
    else if(blk.t==="tag"||blk.t==="contact") html+=`<p class="c">${x}</p>`;
    else if(blk.t==="h") html+=`<h3>${x}</h3>`;
    else if(blk.t==="sh") html+=`<h4>${x}</h4>`;
    else if(blk.t==="m") html+=`<p class="c">${x}</p>`;
    else html+=`<p>${x}</p>`;
  }
  close();
  $("resumePrev").innerHTML = html;
}

function renderCover(){
  const today = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  $("coverPrev").innerHTML =
    `<h2>${esc(USER_NAME)}</h2>
     <p class="c">${esc(CONTACT.city)} | ${esc(CONTACT.email)} | ${esc(CONTACT.phone)}</p>
     <p class="c">${esc(today)}</p>
     <p><b>Re: ${esc($("jobTitle").value)} — ${esc($("company").value)}</b></p>
     <p>${esc(result.greeting || "Dear Hiring Manager,")}</p>` +
    result.coverLetter.map(p=>`<p>${esc(p)}</p>`).join("") +
    `<p>Sincerely,<br>${esc(USER_NAME)}</p>`;
}

/* ============ DOCX EXPORT ============ */
/* docx library, loaded on demand from CDN.
   SECURITY (SRI): pin each URL to its real SHA-384 hash so a tampered CDN file is rejected.
   To get a hash: run  curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A
   then paste it as the `sri` value (format: "sha384-XXXX"). Leave "" to skip pinning for that URL. */
const DOCX_SOURCES = [
  { url:"https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js", sri:"" },
  { url:"https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.min.js",     sri:"" },
  { url:"https://cdnjs.cloudflare.com/ajax/libs/docx/7.8.2/docx.min.js",     sri:"" }
];
function loadDocx(){
  return new Promise((res)=>{
    if(window.docx) return res(true);
    let i=0;
    const tryNext=()=>{
      if(i>=DOCX_SOURCES.length) return res(false);
      const src = DOCX_SOURCES[i++];
      const s=document.createElement("script");
      s.src=src.url;
      if(src.sri){ s.integrity=src.sri; s.crossOrigin="anonymous"; }  // browser verifies the hash
      s.onload=()=> window.docx ? res(true) : tryNext();
      s.onerror=tryNext;
      document.head.appendChild(s);
    };
    tryNext();
  });
}

function dl(blob, name){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download=name;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},800);
}

$("dlResume").onclick = async ()=>{
  if(await loadDocx()) dl(await resumeDocx(), baseName()+".docx");
  else dl(htmlDoc($("resumePrev").innerHTML), baseName()+".doc");
};
$("dlCover").onclick = async ()=>{
  if(await loadDocx()) dl(await coverDocx(), baseName()+"_Cover_Letter.docx");
  else dl(htmlDoc($("coverPrev").innerHTML), baseName()+"_Cover_Letter.doc");
};

/* fallback: Word-compatible HTML .doc */
function htmlDoc(inner){
  return new Blob(["\ufeff<html><head><meta charset='utf-8'></head><body style='font-family:Calibri'>"+inner+"</body></html>"],
    {type:"application/msword"});
}

function P(opts){ return new docx.Paragraph(opts); }
function T(text, opts={}){ return new docx.TextRun(Object.assign({text, font:"Calibri", size:22}, opts)); }

/* parse the live (possibly edited) previews back into blocks */
function parseResumeDom(){
  const blocks = [];
  $("resumePrev").querySelectorAll("h2,h3,h4,li,p").forEach(el=>{
    const x = el.textContent.replace(/\s+/g," ").trim();
    if(!x) return;
    const t = el.tagName;
    if(t==="H2") blocks.push({t:"name", x});
    else if(t==="H3") blocks.push({t:"h", x});
    else if(t==="H4") blocks.push({t:"sh", x});
    else if(t==="LI") blocks.push({t:"b", x});
    else blocks.push({t: el.classList.contains("c") ? "m" : "p", x});
  });
  return blocks;
}

async function resumeDocx(){
  const ch=[];
  for(const blk of parseResumeDom()){
    const x = blk.x||"";
    if(blk.t==="name") ch.push(P({children:[T(x,{bold:true,size:40})], spacing:{after:40}}));
    else if(blk.t==="h") ch.push(P({children:[T(x.toUpperCase(),{bold:true,size:24})],
      spacing:{before:200,after:60}, border:{bottom:{color:"222222",size:8,style:docx.BorderStyle.SINGLE,space:2}}}));
    else if(blk.t==="sh") ch.push(P({children:[T(x,{bold:true})], spacing:{before:110,after:20}}));
    else if(blk.t==="m") ch.push(P({children:[T(x,{size:20,color:"444444"})], spacing:{after:40}}));
    else if(blk.t==="b") ch.push(P({children:[T(x)], bullet:{level:0}, spacing:{after:20}}));
    else ch.push(P({children:[T(x)], spacing:{after:60}}));
  }
  const doc=new docx.Document({sections:[{properties:{page:{margin:{top:720,bottom:720,left:864,right:864}}}, children:ch}]});
  return docx.Packer.toBlob(doc);
}

async function coverDocx(){
  const ch=[];
  $("coverPrev").querySelectorAll("h2,p").forEach(el=>{
    // split lines joined by <br> (e.g. "Sincerely,<br>Scott Cole")
    const parts = el.innerHTML.split(/<br\s*\/?>/i).map(s=>{
      const d=document.createElement("div"); d.innerHTML=s; return d.textContent.replace(/\s+/g," ").trim();
    }).filter(Boolean);
    parts.forEach((x,i)=>{
      if(el.tagName==="H2") ch.push(P({children:[T(x,{bold:true,size:36})], spacing:{after:40}}));
      else if(el.classList.contains("c")) ch.push(P({children:[T(x,{size:20,color:"444444"})], spacing:{after:120}}));
      else if(el.querySelector("b")) ch.push(P({children:[T(x,{bold:true})], spacing:{after:200}}));
      else ch.push(P({children:[T(x)], spacing:{after: i<parts.length-1 ? 40 : 200}}));
    });
  });
  const doc=new docx.Document({sections:[{properties:{page:{margin:{top:1080,bottom:1080,left:1080,right:1080}}}, children:ch}]});
  return docx.Packer.toBlob(doc);
}
