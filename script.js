/* ============================================================
   AMIIN — VIDEO EDITOR PORTFOLIO — script.js
   Menu, scroll, work filters, FAQ, iyo reveal animation
   ============================================================ */

/* ============================================================
   YouTube IFrame API — autoplay, mute, seamless loop (no chrome)
   ============================================================ */

// Soo dejiso API-ga YouTube
(function loadYouTubeAPI() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

// Waa in uu global-ka noqdaa — YouTube ayaa u yeeraya marka API-gu diyaar yahay
window.onYouTubeIframeAPIReady = function () {
  const frames = document.querySelectorAll('iframe[src*="youtube.com/embed"]');
  frames.forEach((frame, i) => {
    if (!frame.id) frame.id = "yt-player-" + i;
    new YT.Player(frame.id, {
      events: {
        onReady: (e) => {
          e.target.mute();          // loo baahan yahay autoplay-ga
          e.target.playVideo();
        },
        onStateChange: (e) => {
          // Markuu dhammaado → dib u bilow (end-screen "More videos" lama arko)
          if (e.data === YT.PlayerState.ENDED) {
            e.target.seekTo(0);
            e.target.playVideo();
          }
        },
      },
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- 1. Sannadka footer-ka ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 2. Menu-ka mobile ---------- */
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  hamburger?.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("open");
  });
  navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navLinks.classList.remove("open");
    });
  });

  /* ---------- 3. Navbar border markay scroll ---------- */
  const navbar = document.getElementById("navbar");
  const onScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll);
  onScroll();

  /* ---------- 4. Work filters ---------- */
  const filterBtns = document.querySelectorAll(".filter");
  const workItems = document.querySelectorAll(".work-item");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;

      workItems.forEach((item) => {
        const show = filter === "all" || item.dataset.cat === filter;
        item.classList.toggle("hide", !show);
      });
    });
  });

  /* ---------- 5. FAQ accordion ---------- */
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      // Xir dhammaan kuwa kale
      faqItems.forEach((other) => {
        other.classList.remove("open");
        other.querySelector(".faq-a").style.maxHeight = null;
      });
      // Furo kan la riixay (haddii uusan horey u furnayn)
      if (!isOpen) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });

  /* ---------- 6. Reveal animation (sections) ---------- */
  const revealEls = document.querySelectorAll(".section, .cta");
  revealEls.forEach((el) => el.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  revealEls.forEach((el) => observer.observe(el));

  /* ---------- 7. Scroll effect for feature rows ---------- */
  const features = document.querySelectorAll(".feature");
  const featureObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          featureObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );
  features.forEach((el) => featureObserver.observe(el));

  /* ---------- 8. Contact popup (modal) ---------- */
  const modal = document.getElementById("contactModal");
  const fab = document.getElementById("contactFab");

  const openModal = () => {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => document.getElementById("cName")?.focus(), 100);
  };
  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  // Open from the floating button
  fab?.addEventListener("click", openModal);

  // Show the FAB only after leaving the hero, and hide it on the footer
  const footer = document.querySelector(".footer");
  const updateFab = () => {
    if (!fab) return;
    const pastHero = window.scrollY > window.innerHeight * 0.6;
    const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
    const footerVisible = footerTop < window.innerHeight - 40;
    fab.classList.toggle("fab-hidden", !pastHero || footerVisible);
  };
  window.addEventListener("scroll", updateFab, { passive: true });
  window.addEventListener("resize", updateFab);
  updateFab();
  // Open from any link that points to #contact (nav, buttons, etc.)
  document.querySelectorAll('a[href="#contact"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });
  // Close: overlay, X button, Esc
  modal?.querySelectorAll("[data-close]").forEach((el) =>
    el.addEventListener("click", closeModal)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  /* ---------- 9. Contact form ---------- */
  const contactForm = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");

  contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("cName").value.trim();
    const email = document.getElementById("cEmail").value.trim();
    const subject = document.getElementById("cSubject").value.trim();
    const msg = document.getElementById("cMsg").value.trim();

    const note = (text, type) => {
      formNote.textContent = text;
      formNote.className = "form-note " + type;
    };

    if (!name || !email || !subject || !msg) {
      note("Please fill in all fields.", "err");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      note("Please enter a valid email.", "err");
      return;
    }

    // Opens the visitor's email app pre-filled (no backend required)
    const mailto =
      "mailto:info@ayubkahil.so" +
      "?subject=" + encodeURIComponent(subject + " — from " + name) +
      "&body=" + encodeURIComponent(msg + "\n\nFrom: " + name + " (" + email + ")");

    note("Thanks! Opening your email app…", "ok");
    setTimeout(() => {
      window.location.href = mailto;
      contactForm.reset();
      note("", "");
      closeModal();
    }, 900);
  });
});
