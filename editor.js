/* ============================================================
   AYUBKAHIL — Visual Editor (no-code content editing)
   ------------------------------------------------------------
   • Enter edit mode: add "#edit" to the URL
       local:  http://localhost:5500/#edit
       live:   https://ayubkahil.so/#edit
   • Change the password below to your own.
   • Edit text/images/videos in place, ADD or DELETE Work videos.
   • Changes save to your browser. Click "Publish" to download
     content.json — upload it next to index.html so everyone sees it.
   ============================================================ */

(function () {
  "use strict";

  const PASSWORD = "ayubkahil"; // <-- change to your own password
  const LS_KEY = "ayubkahil_edits_v2";

  let edits = {};
  try { edits = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch (e) { edits = {}; }
  edits.workAdds = edits.workAdds || [];
  edits.workDel = edits.workDel || [];
  let editing = false;

  /* ---------- Stable structural key (path-based) ---------- */
  function keyOf(el) {
    const parts = [];
    while (el && el !== document.body) {
      if (el.id) { parts.unshift("#" + el.id); break; }
      let seg = el.tagName.toLowerCase();
      const p = el.parentElement;
      if (p) {
        const same = [...p.children].filter((c) => c.tagName === el.tagName);
        if (same.length > 1) seg += ":" + (same.indexOf(el) + 1);
      }
      parts.unshift(seg);
      el = el.parentElement;
    }
    return parts.join(">");
  }

  /* ---------- Collectors ---------- */
  const TEXT_SELECTOR = [
    "h1", "h2", "h3", "h4", "p", "li", "blockquote",
    ".nav-handle",
    ".feature-link", ".about-name", ".about-role",
    ".process-num", ".reel-name", ".logos-label",
    ".fab-label", ".nav-contact", ".nav-links a",
    ".faq-q", ".hero-badge"
  ].join(",");

  // round avatars that can hold an uploaded photo
  const AVATAR_SELECTOR = ".nav-avatar, .modal-avatar, .avatars span";

  const skip = (el) =>
    el.closest("#editorBar") || el.closest(".ed-dialog") || el.closest(".ed-addtile");

  const textEls = () =>
    [...document.querySelectorAll(TEXT_SELECTOR)].filter(
      (el) => !skip(el) && !el.closest(".reel[data-cid]")
    );
  const imgEls = () =>
    [...document.querySelectorAll("img")].filter((el) => !skip(el));
  const vidEls = () =>
    [...document.querySelectorAll('iframe[src*="youtube.com/embed"]')].filter(
      (el) => !el.closest(".reel[data-cid]")
    );
  const avatarEls = () =>
    [...document.querySelectorAll(AVATAR_SELECTOR)].filter((el) => !skip(el));
  const aboutPhoto = () => document.querySelector(".about-photo");
  const workGrid = () => document.getElementById("workGrid");

  function setAvatar(el, url) {
    el.style.background = "url(" + url + ") center / cover no-repeat";
    el.style.color = "transparent";
  }

  /* ---------- YouTube helpers ---------- */
  const ytURL = (id) =>
    `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}` +
    `&controls=0&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1`;
  const ytID = (url) => {
    const m = String(url).match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([\w-]{11})/);
    if (m) return m[1];
    return /^[\w-]{11}$/.test(url) ? url : null;
  };

  /* ---------- Build a reel card ---------- */
  function buildReel(item) {
    const art = document.createElement("article");
    art.className = "work-item reel";
    art.dataset.cat = item.cat || "youtube";
    art.dataset.cid = item.id;
    art.innerHTML =
      '<div class="reel-head">' +
        '<span class="reel-avatar">' + (item.name || "A").charAt(0).toUpperCase() + "</span>" +
        '<span class="reel-name">' + (item.name || "New video") + "</span>" +
        '<span class="reel-verified">✔</span>' +
      "</div>" +
      '<div class="reel-video">' +
        '<iframe src="' + ytURL(item.vid) + '" title="' + (item.name || "") +
        '" allow="autoplay; encrypted-media" allowfullscreen></iframe>' +
      "</div>";
    return art;
  }

  /* ---------- Custom dialogs (match the site) ---------- */
  function edDialog(opts) {
    return new Promise((resolve) => {
      const ov = document.createElement("div");
      ov.className = "ed-dialog";
      const box = document.createElement("div");
      box.className = "ed-dialog-box";

      const msg = document.createElement("p");
      msg.className = "ed-dialog-msg";
      msg.textContent = opts.message || "";
      box.appendChild(msg);

      let input = null;
      if (opts.input) {
        input = document.createElement("input");
        input.className = "ed-dialog-input";
        input.type = opts.password ? "password" : "text";
        if (opts.placeholder) input.placeholder = opts.placeholder;
        if (opts.value) input.value = opts.value;
        box.appendChild(input);
      }

      const actions = document.createElement("div");
      actions.className = "ed-dialog-actions";
      if (opts.showCancel) {
        const c = document.createElement("button");
        c.className = "ed-dlg-cancel";
        c.textContent = opts.cancelText || "Cancel";
        c.onclick = () => done(null);
        actions.appendChild(c);
      }
      const ok = document.createElement("button");
      ok.className = "ed-dlg-ok";
      ok.textContent = opts.okText || "OK";
      ok.onclick = () => done(opts.input ? input.value : true);
      actions.appendChild(ok);
      box.appendChild(actions);

      ov.appendChild(box);
      document.body.appendChild(ov);
      if (input) setTimeout(() => input.focus(), 50);

      function done(val) {
        ov.remove();
        document.removeEventListener("keydown", onKey);
        resolve(val);
      }
      function onKey(e) {
        if (e.key === "Escape") done(opts.showCancel ? null : true);
        if (e.key === "Enter" && opts.input) { e.preventDefault(); done(input.value); }
      }
      document.addEventListener("keydown", onKey);
      ov.addEventListener("click", (e) => { if (e.target === ov && opts.showCancel) done(null); });
    });
  }
  const edPrompt = (message, o = {}) => edDialog({ message, input: true, showCancel: true, ...o });
  const edAlert = (message) => edDialog({ message, okText: "OK" });
  const edConfirm = (message) =>
    edDialog({ message, showCancel: true, okText: "Yes", cancelText: "Cancel" }).then((v) => v === true);

  /* ---------- Apply saved content (runs for EVERY visitor) ---------- */
  function applyAll() {
    // 1) structural: added Work videos
    const grid = workGrid();
    if (grid) {
      edits.workAdds.forEach((item) => {
        if (!grid.querySelector('.reel[data-cid="' + item.id + '"]')) {
          grid.appendChild(buildReel(item));
        }
      });
      // hidden (deleted) original reels
      [...grid.querySelectorAll(".reel")].forEach((reel) => {
        if (!reel.dataset.cid && edits.workDel.includes(keyOf(reel))) {
          reel.classList.add("ed-removed");
        }
      });
    }

    // 2) text / images / videos (path-keyed)
    textEls().forEach((el) => { const v = edits["text:" + keyOf(el)]; if (v != null) el.innerHTML = v; });
    imgEls().forEach((el) => { const v = edits["img:" + keyOf(el)]; if (v) el.src = v; });
    vidEls().forEach((el) => { const v = edits["vid:" + keyOf(el)]; if (v) el.src = ytURL(v); });

    avatarEls().forEach((el) => { const v = edits["avatar:" + keyOf(el)]; if (v) setAvatar(el, v); });

    const ap = edits.aboutimg;
    if (ap && aboutPhoto())
      aboutPhoto().style.backgroundImage = "url(" + ap + "), linear-gradient(160deg,#eef1f6,#d7dde8)";
  }

  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(edits));
    const s = document.getElementById("ebStatus");
    if (s) { s.textContent = "Saved ✓"; setTimeout(() => (s.textContent = "Saved locally"), 1200); }
  }

  /* ---------- Load published base (Supabase → content.json) then local overrides ---------- */
  async function loadBase() {
    let base = null;
    try {
      if (window.SUPA) {
        const { data } = await window.SUPA.from("site_content").select("data").eq("id", 1).maybeSingle();
        if (data && data.data && Object.keys(data.data).length) base = data.data;
      }
    } catch (e) { /* ignore */ }
    if (!base) {
      try { const r = await fetch("content.json", { cache: "no-store" }); if (r.ok) base = await r.json(); } catch (e) {}
    }
    if (base) {
      const adds = (edits.workAdds && edits.workAdds.length) ? edits.workAdds : base.workAdds;
      const del = (edits.workDel && edits.workDel.length) ? edits.workDel : base.workDel;
      edits = Object.assign({}, base, edits);
      edits.workAdds = adds || [];
      edits.workDel = del || [];
    }
    applyTheme();
    applyAll();
  }

  /* ---------- Auth gate (Supabase Auth, or local password fallback) ---------- */
  async function ensureAuth() {
    if (window.SUPA) {
      const { data: { session } } = await window.SUPA.auth.getSession();
      if (session) return true;
      const email = await edPrompt("Editor email:", { placeholder: "you@email.com" });
      if (!email) return false;
      const password = await edPrompt("Password:", { password: true, placeholder: "Password" });
      if (!password) return false;
      const { error } = await window.SUPA.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { await edAlert("Login failed: " + error.message); return false; }
      return true;
    }
    const p = await edPrompt("Enter password to edit this site:", { password: true, placeholder: "Password" });
    if (p === PASSWORD) return true;
    if (p !== null) await edAlert("Wrong password.");
    return false;
  }

  /* ---------- File picker ---------- */
  function pickFile(cb) {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const rd = new FileReader(); rd.onload = () => cb(rd.result); rd.readAsDataURL(f);
    };
    inp.click();
  }

  /* ---------- Edit mode ---------- */
  function attachReelControls(reel) {
    if (reel.querySelector(".ed-itemctrl")) return;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ed-itemctrl";
    del.textContent = "×";
    del.title = "Delete this video";
    del.onclick = async (e) => {
      e.preventDefault();
      if (!(await edConfirm("Delete this video?"))) return;
      if (reel.dataset.cid) {
        edits.workAdds = edits.workAdds.filter((it) => it.id !== reel.dataset.cid);
        reel.remove();
      } else {
        edits.workDel.push(keyOf(reel));
        reel.classList.add("ed-removed");
      }
      save();
    };
    reel.appendChild(del);

    // custom reel name → edit updates the stored item
    if (reel.dataset.cid) {
      const nameEl = reel.querySelector(".reel-name");
      if (nameEl) {
        nameEl.setAttribute("contenteditable", "true");
        nameEl.addEventListener("input", () => {
          const it = edits.workAdds.find((x) => x.id === reel.dataset.cid);
          if (it) { it.name = nameEl.textContent.trim(); save(); }
        });
      }
      // change video button
      const vf = reel.querySelector(".reel-video");
      if (vf) addVideoButton(vf, async () => {
        const url = await edPrompt("Paste YouTube link or video ID:");
        if (!url) return;
        const id = ytID(url.trim());
        if (!id) { await edAlert("That doesn't look like a valid YouTube link."); return; }
        vf.querySelector("iframe").src = ytURL(id);
        const it = edits.workAdds.find((x) => x.id === reel.dataset.cid);
        if (it) { it.vid = id; save(); }
      });
    }
  }

  function addVideoButton(wrap, handler) {
    if (wrap.querySelector(".ed-mediabtn")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "ed-mediabtn"; b.textContent = "✎ Change video";
    b.onclick = handler;
    wrap.appendChild(b);
  }

  function enableEdit() {
    editing = true;
    document.body.classList.add("editing");
    buildFmt();
    document.addEventListener("selectionchange", positionFmt);
    window.addEventListener("scroll", positionFmt, { passive: true });

    // text
    textEls().forEach((el) => {
      el.setAttribute("contenteditable", "true");
      el.addEventListener("input", () => { edits["text:" + keyOf(el)] = el.innerHTML; save(); });
      el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); }, true);
    });

    // images
    imgEls().forEach((el) => {
      el.classList.add("ed-img");
      el.addEventListener("click", (e) => {
        e.preventDefault();
        pickFile((data) => { el.src = data; edits["img:" + keyOf(el)] = data; save(); });
      });
    });

    // videos (originals)
    vidEls().forEach((frame) => {
      const wrap = frame.parentElement;
      addVideoButton(wrap, async () => {
        const url = await edPrompt("Paste YouTube link or video ID:", { placeholder: "https://youtube.com/watch?v=..." });
        if (!url) return;
        const id = ytID(url.trim());
        if (!id) { await edAlert("That doesn't look like a valid YouTube link."); return; }
        frame.src = ytURL(id);
        edits["vid:" + keyOf(frame)] = id;
        save();
      });
    });

    // avatars → upload a photo
    avatarEls().forEach((el) => {
      el.classList.add("ed-img");
      el.title = "Click to upload a photo";
      el.addEventListener("click", (e) => {
        e.preventDefault();
        pickFile((data) => { setAvatar(el, data); edits["avatar:" + keyOf(el)] = data; save(); });
      });
    });

    // about photo
    const ap = aboutPhoto();
    if (ap) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "ed-mediabtn"; b.textContent = "✎ Change photo";
      b.onclick = () => pickFile((data) => {
        ap.style.backgroundImage = "url(" + data + "), linear-gradient(160deg,#eef1f6,#d7dde8)";
        edits.aboutimg = data; save();
      });
      ap.appendChild(b);
    }

    // Work grid: per-reel controls + "Add video" tile
    const grid = workGrid();
    if (grid) {
      [...grid.querySelectorAll(".reel")].forEach(attachReelControls);
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "ed-addtile";
      tile.innerHTML = "<span>＋</span>Add video";
      tile.onclick = async () => {
        const url = await edPrompt("Paste the YouTube link for the new video:", { placeholder: "https://youtube.com/watch?v=..." });
        if (!url) return;
        const id = ytID(url.trim());
        if (!id) { await edAlert("That doesn't look like a valid YouTube link."); return; }
        const name = (await edPrompt("Title / creator name:", { placeholder: "e.g. New Project" })) || "New video";
        const cat = (await edPrompt("Category — type: youtube  or  short", { value: "youtube" })) || "youtube";
        const item = { id: "c" + Date.now(), name: name.trim(), vid: id, cat: cat.trim() === "short" ? "short" : "youtube" };
        edits.workAdds.push(item);
        const reel = buildReel(item);
        grid.insertBefore(reel, tile);
        attachReelControls(reel);
        save();
      };
      grid.appendChild(tile);
    }

    buildBar();
  }

  function buildBar() {
    const bar = document.createElement("div");
    bar.id = "editorBar";
    bar.innerHTML =
      '<span class="eb-title">✏️ Edit Mode</span>' +
      '<span class="eb-status" id="ebStatus">Saved locally</span>' +
      '<button id="ebTheme">🎨 Theme</button>' +
      '<button id="ebPage">＋ Page</button>' +
      '<button id="ebPublish">⬇ Publish</button>' +
      '<button id="ebReset">Reset</button>' +
      '<button id="ebExit">Exit</button>';
    document.body.appendChild(bar);
    document.getElementById("ebTheme").onclick = openTheme;
    document.getElementById("ebPage").onclick = addPage;
    document.getElementById("ebPublish").onclick = publish;
    document.getElementById("ebReset").onclick = resetAll;
    document.getElementById("ebExit").onclick = () => { location.hash = ""; location.reload(); };
  }

  async function publish() {
    if (window.SUPA) {
      const { data: { session } } = await window.SUPA.auth.getSession();
      if (!session) { await edAlert("Please re-open Edit Mode and log in first."); return; }
      const { error } = await window.SUPA.from("site_content")
        .upsert({ id: 1, data: edits, updated_at: new Date().toISOString() });
      if (error) { await edAlert("Publish failed: " + error.message); return; }
      await edAlert("Published! Your changes are now live for everyone. 🎉");
      return;
    }
    // fallback (no Supabase): download content.json
    const blob = new Blob([JSON.stringify(edits, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "content.json";
    a.click();
    await edAlert("content.json downloaded. Upload it next to index.html, then re-deploy.");
  }

  async function resetAll() {
    if (!(await edConfirm("Reset all your local changes back to the original?"))) return;
    localStorage.removeItem(LS_KEY);
    location.reload();
  }

  /* ---------- Styles ---------- */
  function injectCSS() {
    const css = `
      #editorBar{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#0a0a0b;color:#fff;
        display:flex;align-items:center;gap:14px;padding:11px 18px;font:600 14px/1 system-ui,sans-serif;}
      #editorBar .eb-title{font-weight:800;}
      #editorBar .eb-status{color:#9ca3af;margin-right:auto;font-weight:500;}
      #editorBar button{background:#fff;color:#0a0a0b;border:none;border-radius:9px;padding:9px 16px;font-weight:700;cursor:pointer;}
      #editorBar #ebPublish{background:#ffc533;}
      #editorBar #ebExit{background:#ef3e2e;color:#fff;}
      #editorBar button:hover{opacity:.88;}
      body.editing{padding-bottom:58px;}
      body.editing [contenteditable="true"]:hover{outline:2px dashed #ffc533;outline-offset:3px;border-radius:3px;cursor:text;}
      body.editing [contenteditable="true"]:focus{outline:2px solid #ffc533;outline-offset:3px;border-radius:3px;}
      body.editing .ed-img{cursor:pointer;}
      body.editing .ed-img:hover{outline:3px solid #ffc533;outline-offset:2px;}
      .ed-removed{display:none!important;}
      .ed-mediabtn{position:absolute;top:10px;left:10px;z-index:60;background:#0a0a0b;color:#fff;border:none;border-radius:9px;padding:8px 12px;font:700 12px/1 system-ui;cursor:pointer;opacity:.92;}
      .ed-mediabtn:hover{background:#ef3e2e;}
      .ed-itemctrl{position:absolute;top:10px;right:10px;z-index:60;width:30px;height:30px;border-radius:50%;background:#ef3e2e;color:#fff;border:none;font:700 18px/1 system-ui;cursor:pointer;display:grid;place-items:center;}
      .reel{position:relative;}
      .ed-addtile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
        min-height:200px;border:2px dashed #ccc;border-radius:22px;background:transparent;color:#6b7280;
        font:700 1rem/1 system-ui;cursor:pointer;aspect-ratio:9/16;}
      .ed-addtile span{font-size:2.4rem;line-height:1;color:#ffc533;}
      .ed-addtile:hover{border-color:#ffc533;color:#0a0a0b;}
      /* keep nav open & FAQ visible while editing */
      body.editing .nav-expand{max-width:none!important;opacity:1!important;margin-left:20px!important;}
      body.editing .nav-dots{display:none!important;}
      body.editing .faq-a{max-height:none!important;}
      /* pages / builder */
      body.custom-page>section,body.custom-page>.logos{display:none!important;}
      #customWrap{padding:130px 0 90px;min-height:70vh;}
      .cust-page{display:flex;flex-direction:column;gap:22px;}
      .cust-block{position:relative;}
      .cust-img{max-width:100%;border-radius:16px;display:block;}
      .cust-imgph{min-height:220px;display:grid;place-items:center;background:#f0f0f2;border-radius:16px;color:#888;font-weight:600;}
      .cust-vid{position:relative;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000;}
      .cust-vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}
      .cb-palette{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:24px;padding:22px;border:2px dashed #ccc;border-radius:18px;}
      .cb-palette button{background:#0a0a0b;color:#fff;border:none;border-radius:999px;padding:10px 18px;font-weight:700;cursor:pointer;text-transform:capitalize;}
      .cb-palette button:hover{background:#ffc533;color:#0a0a0b;}
      .cb-ctrl{position:absolute;top:6px;right:6px;display:flex;gap:4px;z-index:5;}
      .cb-ctrl button{width:28px;height:28px;border:none;border-radius:7px;background:#0a0a0b;color:#fff;cursor:pointer;font-size:14px;}
      .cb-ctrl button:last-child{background:#ef3e2e;}
      .ed-panel{position:fixed;right:18px;bottom:70px;z-index:10001;width:280px;background:rgba(255,255,255,.85);
        backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);
        border:1px solid rgba(255,255,255,.7);border-radius:18px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.25);
        font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;}
      .ed-panel-head{display:flex;justify-content:space-between;align-items:center;font-weight:800;margin-bottom:14px;}
      .ed-panel-x{border:none;background:none;font-size:1.5rem;line-height:1;cursor:pointer;color:#0a0a0b;}
      .ed-row{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;font-weight:600;font-size:.9rem;color:#0a0a0b;}
      .ed-row input[type=color]{width:46px;height:30px;border:1px solid #ddd;border-radius:8px;cursor:pointer;background:none;padding:2px;}
      .ed-row select{padding:7px 9px;border-radius:9px;border:1px solid #ccc;font-family:inherit;background:#fff;}
      /* rich-text toolbar */
      .ed-fmt{position:fixed;z-index:10002;display:none;gap:2px;align-items:center;background:#0a0a0b;color:#fff;
        border-radius:12px;padding:6px;box-shadow:0 12px 34px rgba(0,0,0,.35);font-family:system-ui,sans-serif;}
      .ed-fmt.show{display:flex;}
      .ed-fmt button{background:none;border:none;color:#fff;min-width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:14px;}
      .ed-fmt button:hover{background:rgba(255,255,255,.16);}
      .ed-sep{width:1px;height:20px;background:rgba(255,255,255,.22);margin:0 3px;}
      .ed-fmt-color{display:grid;place-items:center;width:32px;height:32px;border-radius:8px;cursor:pointer;position:relative;font-weight:800;}
      .ed-fmt-color:hover{background:rgba(255,255,255,.16);}
      .ed-fmt-color input{position:absolute;inset:0;opacity:0;cursor:pointer;}
      /* dialogs (glass) */
      .ed-dialog{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:rgba(0,0,0,.25);
        backdrop-filter:blur(4px);animation:edFade .2s ease;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;}
      .ed-dialog-box{width:92%;max-width:440px;border-radius:24px;padding:32px;background:rgba(255,255,255,.72);
        backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);
        border:1px solid rgba(255,255,255,.7);box-shadow:0 30px 80px rgba(0,0,0,.25);animation:edPop .25s cubic-bezier(.2,.8,.2,1);}
      .ed-dialog-msg{font-size:1.15rem;font-weight:600;color:#0a0a0b;margin:0 0 20px;line-height:1.5;}
      .ed-dialog-input{width:100%;box-sizing:border-box;padding:14px 16px;border:1px solid rgba(10,10,11,.15);border-radius:13px;
        font-size:.98rem;font-family:inherit;color:#0a0a0b;margin-bottom:24px;background:rgba(255,255,255,.6);}
      .ed-dialog-input:focus{outline:none;border-color:#ffc533;box-shadow:0 0 0 3px rgba(255,197,51,.22);}
      .ed-dialog-actions{display:flex;justify-content:flex-end;gap:10px;}
      .ed-dialog-actions button{border:none;border-radius:999px;padding:12px 26px;font:700 .95rem/1 'Helvetica Neue',Helvetica,Arial,sans-serif;cursor:pointer;transition:transform .15s,background .2s;}
      .ed-dialog-actions button:hover{transform:translateY(-1px);}
      .ed-dlg-ok{background:#ffc533;color:#0a0a0b;}
      .ed-dlg-ok:hover{background:#e58a1f;}
      .ed-dlg-cancel{background:#fff;border:1px solid rgba(10,10,11,.15)!important;color:#0a0a0b;}
      @keyframes edFade{from{opacity:0}to{opacity:1}}
      @keyframes edPop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
    `;
    const st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ============================================================
     THEME editor (colors + fonts)
     ============================================================ */
  const GOOGLE_FONTS = ["Inter", "Poppins", "Montserrat", "Sora", "Space Grotesk", "Outfit", "Playfair Display", "Bricolage Grotesque"];
  const ALL_FONTS = ["Helvetica Neue"].concat(GOOGLE_FONTS);

  function cssVar(k) { return getComputedStyle(document.documentElement).getPropertyValue(k).trim(); }
  function toHex(v) { v = (v || "").trim(); return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : "#000000"; }
  function loadFont(name) {
    if (!name || GOOGLE_FONTS.indexOf(name) < 0) return;
    const id = "gf-" + name.replace(/\s/g, "");
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=" + name.replace(/\s/g, "+") + ":wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }
  function applyTheme() {
    const t = edits.theme || {};
    let css = ":root{";
    ["--gold", "--orange", "--bg", "--text"].forEach((k) => { if (t[k]) css += k + ":" + t[k] + ";"; });
    if (t.fontHead) css += "--font-head:'" + t.fontHead + "',sans-serif;";
    if (t.fontBody) css += "--font-body:'" + t.fontBody + "',sans-serif;";
    css += "}";
    let st = document.getElementById("ed-theme");
    if (!st) { st = document.createElement("style"); st.id = "ed-theme"; document.head.appendChild(st); }
    st.textContent = css;
    loadFont(t.fontHead); loadFont(t.fontBody);
  }
  function openTheme() {
    if (document.getElementById("edThemePanel")) { document.getElementById("edThemePanel").remove(); return; }
    const t = edits.theme || (edits.theme = {});
    const colors = [["--gold", "Primary"], ["--orange", "Accent"], ["--bg", "Background"], ["--text", "Text"]];
    const panel = document.createElement("div");
    panel.id = "edThemePanel"; panel.className = "ed-panel";
    let html = '<div class="ed-panel-head">🎨 Theme <button class="ed-panel-x">×</button></div>';
    colors.forEach(([k, lab]) => {
      html += '<label class="ed-row">' + lab + '<input type="color" data-var="' + k + '" value="' + toHex(t[k] || cssVar(k)) + '"></label>';
    });
    const opts = (sel) => ALL_FONTS.map((f) => '<option ' + (sel === f ? "selected" : "") + ">" + f + "</option>").join("");
    html += '<label class="ed-row">Heading font<select data-font="head">' + opts(t.fontHead) + "</select></label>";
    html += '<label class="ed-row">Body font<select data-font="body">' + opts(t.fontBody) + "</select></label>";
    panel.innerHTML = html;
    document.body.appendChild(panel);
    panel.querySelector(".ed-panel-x").onclick = () => panel.remove();
    panel.querySelectorAll('input[type=color]').forEach((inp) =>
      inp.oninput = () => { t[inp.dataset.var] = inp.value; applyTheme(); save(); });
    panel.querySelectorAll("select[data-font]").forEach((sel) =>
      sel.onchange = () => { if (sel.dataset.font === "head") t.fontHead = sel.value; else t.fontBody = sel.value; applyTheme(); save(); });
  }

  /* ============================================================
     PAGES (extra blank pages with insertable blocks)
     ============================================================ */
  function currentPageId() { const m = location.hash.match(/^#\/p\/(.+)$/); return m ? m[1] : null; }

  function defaultBlock(type) {
    if (type === "heading") return { type, text: "New heading" };
    if (type === "text") return { type, text: "New paragraph of text." };
    if (type === "button") return { type, text: "Click me", href: "#contact" };
    if (type === "image") return { type, src: "" };
    if (type === "video") return { type, vid: "" };
    return { type };
  }

  function renderBlock(b, page, idx) {
    const wrap = document.createElement("div");
    wrap.className = "cust-block";
    let node;
    if (b.type === "heading") { node = document.createElement("h2"); node.className = "section-title"; node.innerHTML = b.html || b.text || "Heading"; }
    else if (b.type === "text") { node = document.createElement("p"); node.innerHTML = b.html || b.text || "Text"; }
    else if (b.type === "button") { node = document.createElement("a"); node.className = "btn btn-primary"; node.href = b.href || "#"; node.innerHTML = b.html || b.text || "Button"; }
    else if (b.type === "image") {
      if (b.src) { node = document.createElement("img"); node.src = b.src; node.className = "cust-img"; }
      else { node = document.createElement("div"); node.className = "cust-imgph"; node.textContent = "🖼 Click to upload image"; }
    } else if (b.type === "video") {
      node = document.createElement("div"); node.className = "cust-vid";
      node.innerHTML = '<iframe src="' + (b.vid ? ytURL(b.vid) : "") + '" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
    }
    wrap.appendChild(node);

    if (editing) {
      if (b.type === "heading" || b.type === "text" || b.type === "button") {
        node.setAttribute("contenteditable", "true");
        node.addEventListener("input", () => { b.html = node.innerHTML; b.text = node.textContent; save(); });
        node.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); }, true);
      }
      if (b.type === "image") {
        node.style.cursor = "pointer";
        node.onclick = () => pickFile((d) => { b.src = d; save(); renderRoute(); });
      }
      if (b.type === "video") {
        const btn = document.createElement("button");
        btn.className = "ed-mediabtn"; btn.textContent = "✎ Change video";
        btn.onclick = async () => {
          const u = await edPrompt("YouTube link or video ID:"); if (!u) return;
          const id = ytID(u.trim()); if (!id) { await edAlert("Invalid YouTube link."); return; }
          node.querySelector("iframe").src = ytURL(id); b.vid = id; save();
        };
        wrap.appendChild(btn);
      }
      const ctrl = document.createElement("div");
      ctrl.className = "cb-ctrl";
      ctrl.innerHTML = '<button data-a="up">↑</button><button data-a="down">↓</button><button data-a="del">×</button>';
      ctrl.querySelector('[data-a=up]').onclick = () => { if (idx > 0) { const a = page.blocks; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; save(); renderRoute(); } };
      ctrl.querySelector('[data-a=down]').onclick = () => { const a = page.blocks; if (idx < a.length - 1) { [a[idx + 1], a[idx]] = [a[idx], a[idx + 1]]; save(); renderRoute(); } };
      ctrl.querySelector('[data-a=del]').onclick = async () => { if (await edConfirm("Delete this element?")) { page.blocks.splice(idx, 1); save(); renderRoute(); } };
      wrap.appendChild(ctrl);
    }
    return wrap;
  }

  function showHome() {
    document.body.classList.remove("custom-page");
    const w = document.getElementById("customWrap");
    if (w) w.style.display = "none";
  }
  function showCustom(page) {
    document.body.classList.add("custom-page");
    let w = document.getElementById("customWrap");
    if (!w) { w = document.createElement("main"); w.id = "customWrap"; document.querySelector("footer").before(w); }
    w.style.display = "block";
    w.innerHTML = "";
    const c = document.createElement("div");
    c.className = "container cust-page";
    const h = document.createElement("p"); h.className = "section-tag"; h.textContent = page.name;
    c.appendChild(h);
    page.blocks.forEach((b, i) => c.appendChild(renderBlock(b, page, i)));
    if (editing) {
      const pal = document.createElement("div"); pal.className = "cb-palette";
      ["heading", "text", "image", "video", "button"].forEach((t) => {
        const btn = document.createElement("button");
        btn.textContent = "＋ " + t;
        btn.onclick = () => { page.blocks.push(defaultBlock(t)); save(); renderRoute(); };
        pal.appendChild(btn);
      });
      c.appendChild(pal);
    }
    w.appendChild(c);
  }
  function renderRoute() {
    const id = currentPageId();
    const page = (edits.pages || []).find((p) => p.id === id);
    if (page) showCustom(page); else showHome();
    buildPageNav();
  }
  function buildPageNav() {
    const nav = document.getElementById("navLinks");
    if (!nav) return;
    nav.querySelectorAll(".ed-pagelink").forEach((e) => e.remove());
    (edits.pages || []).forEach((pg) => {
      const a = document.createElement("a");
      a.className = "ed-pagelink"; a.href = "#/p/" + pg.id; a.textContent = pg.name;
      nav.appendChild(a);
    });
  }
  async function addPage() {
    const name = await edPrompt("New page name:", { placeholder: "e.g. About, Pricing" });
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page" + Date.now();
    edits.pages = edits.pages || [];
    if (edits.pages.find((p) => p.id === id)) { await edAlert("A page with that name already exists."); return; }
    edits.pages.push({ id, name, blocks: [] });
    save();
    location.hash = "#/p/" + id;
  }

  /* ============================================================
     Rich-text toolbar (appears on text selection)
     ============================================================ */
  function editableAncestor(node) {
    while (node && node !== document.body) {
      if (node.nodeType === 1 && node.getAttribute && node.getAttribute("contenteditable") === "true") return node;
      node = node.parentNode;
    }
    return null;
  }
  function currentHost() {
    const s = getSelection();
    if (!s.rangeCount) return null;
    return editableAncestor(s.getRangeAt(0).startContainer);
  }
  function changeSize(delta) {
    const s = getSelection();
    if (!s.rangeCount || s.isCollapsed) return;
    let el = s.getRangeAt(0).startContainer;
    if (el.nodeType === 3) el = el.parentElement;
    const cur = parseFloat(getComputedStyle(el).fontSize) || 16;
    const next = Math.max(10, Math.min(160, cur + delta));
    document.execCommand("fontSize", false, "7");
    const host = currentHost() || editableAncestor(el);
    if (host) {
      host.querySelectorAll('font[size="7"]').forEach((f) => {
        const sp = document.createElement("span");
        sp.style.fontSize = next + "px";
        while (f.firstChild) sp.appendChild(f.firstChild);
        f.replaceWith(sp);
      });
    }
  }
  function applyCmd(fn) {
    const host = currentHost();
    if (!host) return;
    fn();
    host.dispatchEvent(new Event("input", { bubbles: true }));
    positionFmt();
  }
  function buildFmt() {
    if (document.getElementById("edFmt")) return;
    const bar = document.createElement("div");
    bar.id = "edFmt"; bar.className = "ed-fmt";
    bar.innerHTML =
      '<button data-cmd="bold" title="Bold"><b>B</b></button>' +
      '<button data-cmd="italic" title="Italic"><i>I</i></button>' +
      '<button data-cmd="underline" title="Underline"><u>U</u></button>' +
      '<span class="ed-sep"></span>' +
      '<button data-size="-2" title="Smaller">A−</button>' +
      '<button data-size="2" title="Bigger">A+</button>' +
      '<span class="ed-sep"></span>' +
      '<button data-align="justifyLeft" title="Left">⬅</button>' +
      '<button data-align="justifyCenter" title="Center">▦</button>' +
      '<button data-align="justifyRight" title="Right">➡</button>' +
      '<span class="ed-sep"></span>' +
      '<label class="ed-fmt-color" title="Text color">A<input type="color" id="edFmtColor"></label>';
    document.body.appendChild(bar);
    bar.addEventListener("mousedown", (e) => { if (e.target.tagName !== "INPUT") e.preventDefault(); });
    bar.querySelectorAll("[data-cmd]").forEach((b) => (b.onclick = () => applyCmd(() => document.execCommand(b.dataset.cmd))));
    bar.querySelectorAll("[data-align]").forEach((b) => (b.onclick = () => applyCmd(() => document.execCommand(b.dataset.align))));
    bar.querySelectorAll("[data-size]").forEach((b) => (b.onclick = () => applyCmd(() => changeSize(+b.dataset.size))));
    document.getElementById("edFmtColor").oninput = function () {
      applyCmd(() => document.execCommand("foreColor", false, this.value));
    };
  }
  function positionFmt() {
    const bar = document.getElementById("edFmt");
    if (!bar) return;
    const s = getSelection();
    if (!editing || !s.rangeCount || s.isCollapsed || !currentHost()) { bar.classList.remove("show"); return; }
    const r = s.getRangeAt(0).getBoundingClientRect();
    if (!r.width && !r.height) { bar.classList.remove("show"); return; }
    bar.classList.add("show");
    const bw = bar.offsetWidth, bh = bar.offsetHeight;
    let top = r.top - bh - 10;
    if (top < 8) top = r.bottom + 10;
    let left = r.left + r.width / 2 - bw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
    bar.style.top = top + "px";
    bar.style.left = left + "px";
  }

  /* ---------- Init ---------- */
  function init() {
    injectCSS();
    applyTheme();
    loadBase().then(async () => {
      applyTheme(); // theme may arrive from content.json
      renderRoute();
      window.addEventListener("hashchange", () => { if (location.hash !== "#edit") renderRoute(); });
      if (location.hash === "#edit") {
        if (await ensureAuth()) { enableEdit(); renderRoute(); }
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
