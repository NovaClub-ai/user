(() => {
  "use strict";

  const safeStorage = {
    get(store, key) {
      try {
        return store.getItem(key);
      } catch (error) {
        return null;
      }
    },
    set(store, key, value) {
      try {
        store.setItem(key, value);
        return true;
      } catch (error) {
        return false;
      }
    },
    remove(store, key) {
      try {
        store.removeItem(key);
        return true;
      } catch (error) {
        return false;
      }
    }
  };

  const getCookie = (name) => {
    const prefix = `${name}=`;
    const value = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix))?.slice(prefix.length) || "";

    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  };

  const cookieSecuritySuffix = () => window.location.protocol === "https:" ? "; Secure" : "";

  const setCookie = (name, value, days) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax${cookieSecuritySuffix()}`;
  };

  const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=/; SameSite=Lax${cookieSecuritySuffix()}`;
  };

  const COOKIE_CONSENT_KEY = "aiclub_storage_consent";
  const CONSENT_FALLBACK_KEY = "aiclub_storage_consent_fallback";
  const OPTIONAL_LOCAL_STORAGE_KEYS = ["savedAIResources", "aiClubMembershipDraft"];
  const OPTIONAL_SESSION_STORAGE_KEYS = ["aiclub_workshop_saved", "projectFilter", "galleryFilter", "eventFilter", "membershipSubmitted"];
  const RETIRED_LOCAL_STORAGE_KEYS = ["aiclub_member_name"];

  const isValidConsentChoice = (choice) => choice === "necessary" || choice === "optional" || choice === "rejected";

  const getCookieConsent = () => {
    const cookieChoice = getCookie(COOKIE_CONSENT_KEY);
    if (isValidConsentChoice(cookieChoice)) {
      return cookieChoice;
    }

    const fallbackChoice = safeStorage.get(window.localStorage, CONSENT_FALLBACK_KEY);
    return isValidConsentChoice(fallbackChoice) ? fallbackChoice : "";
  };

  const setCookieConsent = (choice) => {
    setCookie(COOKIE_CONSENT_KEY, choice, 180);

    if (getCookie(COOKIE_CONSENT_KEY) === choice) {
      safeStorage.remove(window.localStorage, CONSENT_FALLBACK_KEY);
    } else {
      safeStorage.set(window.localStorage, CONSENT_FALLBACK_KEY, choice);
    }
  };

  const hasOptionalStorageConsent = () => getCookieConsent() === "optional";

  const clearOptionalStorage = () => {
    deleteCookie("aiclub_notice_dismissed");
    OPTIONAL_LOCAL_STORAGE_KEYS.forEach((key) => safeStorage.remove(window.localStorage, key));
    OPTIONAL_SESSION_STORAGE_KEYS.forEach((key) => safeStorage.remove(window.sessionStorage, key));
  };

  RETIRED_LOCAL_STORAGE_KEYS.forEach((key) => safeStorage.remove(window.localStorage, key));

  const optionalStorage = {
    isAllowed: hasOptionalStorageConsent,
    getLocal(key) {
      return hasOptionalStorageConsent() ? safeStorage.get(window.localStorage, key) : null;
    },
    setLocal(key, value) {
      return hasOptionalStorageConsent() ? safeStorage.set(window.localStorage, key, value) : false;
    },
    removeLocal(key) {
      return hasOptionalStorageConsent() ? safeStorage.remove(window.localStorage, key) : false;
    },
    getSession(key) {
      return hasOptionalStorageConsent() ? safeStorage.get(window.sessionStorage, key) : null;
    },
    setSession(key, value) {
      return hasOptionalStorageConsent() ? safeStorage.set(window.sessionStorage, key, value) : false;
    },
    removeSession(key) {
      return hasOptionalStorageConsent() ? safeStorage.remove(window.sessionStorage, key) : false;
    }
  };

  window.aiclubOptionalStorage = Object.freeze(optionalStorage);

  const mountSharedLayout = () => {
    const navigationItems = [
      { href: "index.html", label: "Home" },
      { href: "about_us.html", label: "About Us" },
      { href: "aiproject.html", label: "AI Projects" },
      { href: "resources.html", label: "Resources" },
      { href: "gallery.html", label: "Gallery" },
      { href: "events.html", label: "Events" },
      { href: "challenges.html", label: "Challenges" }
    ];
    const currentFile = window.location.pathname.split("/").filter(Boolean).pop()?.toLowerCase() || "index.html";
    const isJoinPage = currentFile === "join.html";
    const activePage = isJoinPage ? "" : (navigationItems.some((item) => item.href === currentFile) ? currentFile : "index.html");
    const navLinkStyle = "color:#d9d5e9;font-size:.87rem;font-weight:600;padding:.5rem .75rem;position:relative;transition:color .16s;";

    const navbarPlaceholder = document.querySelector("[data-site-navbar]");
    if (navbarPlaceholder) {
      const navigationMarkup = navigationItems.map((item) => {
        const isActive = item.href === activePage;
        return `<li class="nav-item"><a class="nav-link${isActive ? " active" : ""}"${isActive ? ' aria-current="page"' : ""} href="${item.href}" style="${navLinkStyle}">${item.label}</a></li>`;
      }).join("");

      navbarPlaceholder.outerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark fixed-top" aria-label="Main navigation" style="background:rgba(6,24,39,.96);border-bottom:1px solid rgba(34,211,238,.18);backdrop-filter:blur(18px);padding:0;min-height:76px;">
          <div class="container" style="max-width:1180px;">
            <a class="navbar-brand" href="index.html" aria-label="Nova Club home" style="font-weight:800;letter-spacing:-0.02em;color:#f7f7ff;font-size:.96rem;display:flex;align-items:center;gap:11px;padding:.5rem 0;">
              <span style="display:grid;width:37px;height:37px;place-items:center;border:1px solid rgba(34,211,238,.65);border-radius:11px;background:linear-gradient(135deg,#22d3ee,#a5f3fc);box-shadow:0 0 20px rgba(0,210,255,.25);color:#04131f;font-size:1.1rem;font-weight:800;">AI</span>
              <span>Nova <span style="color:#71e8ff;">Club</span></span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation" style="border-color:rgba(34,211,238,.3);padding:.4rem .6rem;">
              <span class="navbar-toggler-icon" style="background-image:url(&quot;data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(34,211,238,0.8)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e&quot;);"></span>
            </button>
            <div class="collapse navbar-collapse" id="mainNav">
              <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1" style="gap:.25rem;">
                ${navigationMarkup}
                <li class="nav-item"><a class="btn btn-join-nav${isJoinPage ? " active" : ""}"${isJoinPage ? ' aria-current="page"' : ""} href="join.html" style="color:#fff;background:linear-gradient(100deg,#008bb5 0%,#0a0ad6 52%,#9b00ff 100%);border-radius:999px;padding:.4rem 1.2rem;font-weight:700;font-size:.79rem;transition:transform .18s,box-shadow .18s;box-shadow:0 12px 26px rgba(10,10,214,.28);border:none;display:inline-flex;align-items:center;">Join Us</a></li>
              </ul>
            </div>
          </div>
        </nav>`;
    }

    const footerPlaceholder = document.querySelector("[data-site-footer]");
    if (footerPlaceholder) {
      footerPlaceholder.outerHTML = `
        <footer class="site-footer">
          <div class="footer-inner">
            <p>&copy; <span data-year>2026</span> Nova Club. Learn, build, share.</p>
            <div class="footer-links">
              <a href="index.html">Home</a>
              <a href="about_us.html">About Us</a>
              <a href="aiproject.html">Projects</a>
              <a href="resources.html">Resources</a>
              <a href="gallery.html">Gallery</a>
              <a href="events.html">Events</a>
              <a href="challenges.html">Challenges</a>
              <a href="join.html">Join Us</a>
            </div>
          </div>
        </footer>`;
    }
  };

  mountSharedLayout();

  const startUserCursor = () => {
    const supportsFinePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!supportsFinePointer || prefersReducedMotion) {
      return;
    }

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    const cursor = document.createElement("div");
    cursor.className = "user-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = `
      <div class="user-cursor__arrow">
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 3L23 14L14 16L11 24Z" fill="#00d2ff" stroke="rgba(0,0,0,0.36)" stroke-width="0.9" stroke-linejoin="round"/>
        </svg>
      </div>`;

    const arrow = cursor.querySelector(".user-cursor__arrow");
    if (!arrow) {
      return;
    }

    document.body.append(cursor);
    document.body.classList.add("has-custom-cursor");

    const cursorStyle = document.createElement("style");
    cursorStyle.textContent = `
      body.has-custom-cursor,
      body.has-custom-cursor *,
      body.has-custom-cursor *::before,
      body.has-custom-cursor *::after {
        cursor: none !important;
      }
    `;
    document.body.append(cursorStyle);

    let targetX = -100;
    let targetY = -100;
    let arrowX = -100;
    let arrowY = -100;
    let pressed = false;
    let visible = false;
    let frameId = 0;

    const renderCursor = () => {
      arrowX += (targetX - arrowX) * 0.32;
      arrowY += (targetY - arrowY) * 0.32;

      cursor.style.transform = `translate3d(${arrowX}px, ${arrowY}px, 0)`;
      arrow.style.transform = `scale(${pressed ? 0.9 : 1})`;

      const stillMoving = Math.abs(targetX - arrowX) > 0.1 || Math.abs(targetY - arrowY) > 0.1;
      if (visible || stillMoving) {
        frameId = window.requestAnimationFrame(renderCursor);
      } else {
        frameId = 0;
      }
    };

    const requestRender = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(renderCursor);
      }
    };

    const show = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;

      visible = true;
      cursor.classList.add("is-visible");
      document.body.classList.add("has-custom-cursor");
      requestRender();
    };

    const hide = () => {
      visible = false;
      cursor.classList.remove("is-visible");
      document.body.classList.remove("has-custom-cursor");
      requestRender();
    };

    window.addEventListener("pointermove", show, { passive: true });
    window.addEventListener("pointerdown", () => {
      pressed = true;
      cursor.classList.add("is-pressed");
      requestRender();
    });
    window.addEventListener("pointerup", () => {
      pressed = false;
      cursor.classList.remove("is-pressed");
      requestRender();
    });
    window.addEventListener("blur", hide);
    document.addEventListener("mouseout", (event) => {
      if (!event.relatedTarget) {
        hide();
      }
    });

  };

  startUserCursor();

  const startClickEffects = () => {
    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    const layer = document.createElement("div");
    layer.className = "click-effects";
    layer.setAttribute("aria-hidden", "true");
    document.body.append(layer);

    const addElement = (effect, className, styles = {}) => {
      const element = document.createElement("span");
      element.className = className;
      Object.entries(styles).forEach(([property, value]) => {
        element.style.setProperty(property, value);
      });
      effect.append(element);
    };

    document.addEventListener("click", (event) => {
      if (event.detail === 0) {
        return;
      }

      const target = event.target;
      
      if (target.closest('a') || target.closest('button')) return;
      
      if (target.closest('.btn') || target.closest('.btn-gradient')) return;
      if (target.closest('.navbar-toggler') || target.closest('.nav-link')) return;
      if (target.closest('.dropdown-toggle') || target.closest('.dropdown-item')) return;
      if (target.closest('.close') || target.closest('.btn-close') || target.closest('.modal-close')) return;
      if (target.closest('.accordion-button') || target.closest('.accordion-toggle')) return;
      if (target.closest('.carousel-control-prev') || target.closest('.carousel-control-next')) return;
      if (target.closest('[data-bs-toggle="modal"]') || target.closest('[data-bs-toggle="collapse"]')) return;
      
      if (target.closest('.button-link') || target.closest('.filter-btn')) return;
      if (target.closest('.gallery-card') || target.closest('.bookmark')) return;
      if (target.closest('.brand') || target.closest('.social-link')) return;
      if (target.closest('[role="button"]') || target.closest('[role="link"]')) return;

      const effect = document.createElement("div");
      effect.className = "click-effect";
      effect.style.left = `${event.clientX}px`;
      effect.style.top = `${event.clientY}px`;
      layer.append(effect);

      addElement(effect, "click-effect__ring");
      [0, 90, 180, 270].forEach((angle) => {
        addElement(effect, "click-effect__ray", { "--angle": `${angle}deg` });
      });

      Array.from({ length: 8 }, (_, index) => index * 45).forEach((angle, index) => {
        addElement(effect, "click-effect__particle", {
          "--angle": `${angle}deg`,
          "--distance": `${30 + Math.round(Math.random() * 24)}px`,
          "--particle-color": index % 2 === 0 ? "#71e8ff" : "#c883ff"
        });
      });

      window.setTimeout(() => effect.remove(), 650);
    });
  };

  startClickEffects();

  const startCookieConsent = () => {
    let banner = null;

    const updateBottomOffset = () => {
      if (!banner || banner.hidden) {
        return;
      }

      const height = Math.ceil(banner.getBoundingClientRect().height + 24);
      document.documentElement.style.setProperty("--cookie-consent-offset", `${height}px`);
    };

    const updateChoiceStatus = () => {
      const status = banner?.querySelector("[data-cookie-choice-status]");
      if (!status) {
        return;
      }

      const choice = getCookieConsent();
      status.textContent = choice === "optional"
        ? "Current choice: optional browser storage is enabled."
        : choice === "necessary"
          ? "Current choice: necessary storage only."
          : choice === "rejected"
            ? "Current choice: all optional cookies and browser storage are rejected."
            : "Choose how this device should remember optional settings.";
    };

    const hide = () => {
      if (!banner) {
        return;
      }

      banner.hidden = true;
      document.body.classList.remove("has-cookie-consent");
      document.documentElement.style.removeProperty("--cookie-consent-offset");
    };

    const saveChoice = (choice) => {
      if (!isValidConsentChoice(choice)) {
        return;
      }

      const previousChoice = getCookieConsent();
      setCookieConsent(choice);

      if (choice !== "optional") {
        clearOptionalStorage();
      }

      const choiceWasSaved = getCookieConsent() === choice;
      hide();

      if (choiceWasSaved && previousChoice !== choice) {
        window.location.reload();
      }
    };

    const show = () => {
      if (!banner) {
        banner = document.createElement("section");
        banner.className = "cookie-consent";
        banner.hidden = true;
        banner.setAttribute("data-cookie-consent", "");
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-label", "Cookie and storage preferences");
        banner.innerHTML = `
          <p class="cookie-consent__eyebrow">Your privacy choices</p>
          <h2>Cookie &amp; storage preferences</h2>
          <p>We use one necessary cookie to remember this choice. Accept All enables optional browser storage for resource bookmarks, filters, workshop reminder and Join form draft on this device.</p>
          <details class="cookie-consent__details">
            <summary>What is stored?</summary>
            <ul>
              <li>Necessary: your cookie and storage preference for 180 days.</li>
              <li>Optional: localStorage, sessionStorage and the home notice preference.</li>
              <li>Reject All blocks optional storage; the necessary preference cookie remains only to remember that choice.</li>
            </ul>
          </details>
          <p class="cookie-consent__status" data-cookie-choice-status aria-live="polite"></p>
          <div class="cookie-consent__actions">
            <button class="cookie-consent__button cookie-consent__button--primary" type="button" data-cookie-choice="optional">Accept All</button>
            <button class="cookie-consent__button cookie-consent__button--secondary" type="button" data-cookie-choice="necessary">Accept Necessary Only</button>
            <button class="cookie-consent__button cookie-consent__button--reject" type="button" data-cookie-choice="rejected">Reject All</button>
          </div>
        `;
        document.body.append(banner);

        banner.querySelectorAll("[data-cookie-choice]").forEach((button) => {
          button.addEventListener("click", () => saveChoice(button.dataset.cookieChoice));
        });

        const details = banner.querySelector(".cookie-consent__details");
        if (details) {
          details.addEventListener("toggle", () => window.requestAnimationFrame(updateBottomOffset));
        }
      }

      updateChoiceStatus();
      banner.hidden = false;
      document.body.classList.add("has-cookie-consent");
      window.requestAnimationFrame(updateBottomOffset);
    };

    const footerLinks = document.querySelector(".footer-links");
    if (footerLinks && !footerLinks.querySelector("[data-cookie-settings]")) {
      const settingsButton = document.createElement("button");
      settingsButton.className = "footer-cookie-settings";
      settingsButton.type = "button";
      settingsButton.textContent = "Cookie settings";
      settingsButton.setAttribute("data-cookie-settings", "");
      settingsButton.addEventListener("click", show);
      footerLinks.append(settingsButton);
    }

    window.addEventListener("resize", () => window.requestAnimationFrame(updateBottomOffset), { passive: true });

    if (document.body.classList.contains("home-page")) {
    show();
  }
  };

  startCookieConsent();

  const notice = document.querySelector("[data-site-notice]");
  const dismissNotice = document.querySelector("[data-dismiss-site-notice]");

  if (notice && hasOptionalStorageConsent() && getCookie("aiclub_notice_dismissed") === "true") {
    notice.hidden = true;
  }

  if (notice && dismissNotice) {
    dismissNotice.addEventListener("click", () => {
      notice.hidden = true;
      if (hasOptionalStorageConsent()) {
        setCookie("aiclub_notice_dismissed", "true", 14);
      }
    });
  }

  const workshopButton = document.querySelector("[data-workshop-save]");
  const workshopStatus = document.querySelector("[data-workshop-status]");
  let savedWorkshop = optionalStorage.getSession("aiclub_workshop_saved") === "true";

  const updateWorkshopState = (saved) => {
    if (!workshopButton) {
      return;
    }

    workshopButton.setAttribute("aria-label", saved ? "Reminder saved successfully." : "Save workshop reminder");
    workshopButton.setAttribute("aria-pressed", String(saved));
    workshopButton.disabled = saved;
    if (workshopStatus) {
      workshopStatus.textContent = saved ? "Reminder saved successfully." : "";
    }
  };

  updateWorkshopState(savedWorkshop);

  const saveWorkshopReminder = () => {
    if (savedWorkshop) {
      return;
    }

    savedWorkshop = true;
    optionalStorage.setSession("aiclub_workshop_saved", "true");
    updateWorkshopState(true);
    workshopButton.removeEventListener("click", saveWorkshopReminder);
  };

  if (workshopButton && !savedWorkshop) {
    workshopButton.addEventListener("click", saveWorkshopReminder);
  }

  const apiStatus = document.querySelector("[data-api-status]");
  if (apiStatus && window.jQuery) {
    window.jQuery.ajax({
      url: "https://api.github.com/repos/tensorflow/tensorflow",
      dataType: "json",
      timeout: 6000
    }).done((repository) => {
      const stars = document.querySelector("[data-github-stars]");
      const updated = document.querySelector("[data-github-updated]");
      if (stars) {
        stars.textContent = Number(repository.stargazers_count || 0).toLocaleString();
      }
      if (updated && repository.updated_at) {
        updated.textContent = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(repository.updated_at));
      }
      apiStatus.textContent = "Live data from the TensorFlow public repository.";
    }).fail(() => {
      apiStatus.textContent = "Live project data is temporarily unavailable.";
    });
  }

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });



  $(function() {
  if ($("#countdownTimer").length === 0) return;
  
    function updateCountdown() {
      var deadline = new Date("August 30, 2026 23:59:59").getTime();
      var now = new Date().getTime();
      var diff = deadline - now;
      if (diff < 0) {
        $("#countdownTimer").html("Challenge Ended");
        return;
      }
      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((diff % (1000 * 60)) / 1000);
      $("#days").text(String(days).padStart(2, '0'));
      $("#hours").text(String(hours).padStart(2, '0'));
      $("#minutes").text(String(minutes).padStart(2, '0'));
      $("#seconds").text(String(seconds).padStart(2, '0'));
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  });

  $(function() {
    if ($(".event-item").length === 0) return;
    const optionalStorage = window.aiclubOptionalStorage;
    function applyFilter(filter) {
      $(".filter-btn").removeClass("active");
      $('.filter-btn[data-filter="' + filter + '"]').addClass("active");
      if (filter === "all") {
        $(".event-item").fadeIn(200);
      } else {
        $(".event-item").hide().filter('[data-category="' + filter + '"]').fadeIn(200);
      }
      var visibleCount = $(".event-item:visible").length;
      $(".empty-state").toggle(visibleCount === 0);
    }

    $(".filter-btn").on("click", function() {
      var filter = $(this).data("filter");
      applyFilter(filter);
      optionalStorage.setSession("eventFilter", filter);
    });

    var savedFilter = optionalStorage.getSession("eventFilter") || "all";
    applyFilter(savedFilter);
  });

  $(function() {
    if ($(".project-item").length === 0) return;
    const optionalStorage = window.aiclubOptionalStorage;

    function applyFilter(filter) {
      $(".filter-btn").removeClass("active");
      $('.filter-btn[data-filter="' + filter + '"]').addClass("active");
      if (filter === "all") {
        $(".project-item").fadeIn(180);
      } else {
        $(".project-item").hide().filter('[data-status="' + filter + '"]').fadeIn(180);
      }
      var visibleCount = $(".project-item:visible").length;
      $(".empty-state").toggle(visibleCount === 0);
    }

    $(".filter-btn").on("click", function() {
      var filter = $(this).data("filter");
      applyFilter(filter);
      optionalStorage.setSession("projectFilter", filter);
    });

    var savedFilter = optionalStorage.getSession("projectFilter") || "all";
    applyFilter(savedFilter);
  });

  $(function() {
    if ($(".gallery-item").length === 0) return;
    const optionalStorage = window.aiclubOptionalStorage;
    function applyFilter(filter) {
      $(".filter-btn").removeClass("active").filter('[data-filter="' + filter + '"]').addClass("active");
      if (filter === "all") {
        $(".gallery-item").fadeIn(180);
      } else {
        $(".gallery-item").hide().filter('[data-category="' + filter + '"]').fadeIn(180);
      }
      $(".empty-state").toggle($(".gallery-item:visible").length === 0);
      optionalStorage.setSession("galleryFilter", filter);
    }

    $(".filter-btn").on("click", function() {
      applyFilter($(this).data("filter"));
    });
    applyFilter(optionalStorage.getSession("galleryFilter") || "all");

    var modal = $("#galleryModal");
    var modalImage = $("#modalImage");
    var modalTitle = $("#modalTitle");
    var modalDesc = $("#modalDescription");

    $(".gallery-card").on("click", function() {
      modalImage.attr("src", $(this).data("image"));
      modalImage.attr("alt", $(this).data("title"));
      modalTitle.text($(this).data("title"));
      modalDesc.text($(this).data("description") || "");
      modal.addClass("active");
      document.body.style.overflow = "hidden";
    });

    $("#modalClose, #galleryModal").on("click", function(e) {
      if (e.target === this) {
        modal.removeClass("active");
        document.body.style.overflow = "";
      }
    });

    $(document).on("keydown", function(e) {
      if (e.key === "Escape") {
        modal.removeClass("active");
        document.body.style.overflow = "";
      }
    });
  });

window.saveDraft = function() {
  console.log("saveDraft called!");
  const draft = {};
  const fieldIds = ["fullName", "studentId", "course", "email", "yearOfStudy", "experience", "reason"];
  const draftKey = "aiClubMembershipDraft";
  
  fieldIds.forEach(function(id) {
    const el = document.getElementById(id);
    if (el) draft[id] = el.value;
  });
  
  draft.interests = Array.from(document.querySelectorAll('.interest:checked')).map(function(cb) {
    return cb.value;
  });
  
  try {
    localStorage.setItem(draftKey, JSON.stringify(draft));
    const verify = localStorage.getItem(draftKey);
   
    return true;
  } catch (error) {
    console.log("❌ Error saving draft:", error);
    return false;
  }
};

$(function() {
  if ($("#joinForm").length === 0) return;
  
  console.log("Join form initialized!"); 
  const form = document.getElementById("joinForm");
  const draftKey = "aiClubMembershipDraft";
  const fieldIds = ["fullName", "studentId", "course", "email", "yearOfStudy", "experience", "reason"];
  const optionalStorage = window.aiclubOptionalStorage;

  function loadDraft() {
    let draft = null;
    try {
      const raw = optionalStorage.getLocal(draftKey);
      console.log("Raw draft from storage:", raw);
      draft = JSON.parse(raw || "null");
    } catch (error) {
      console.log("Error loading draft:", error);
      draft = null;
    }
    if (!draft || typeof draft !== "object") return;
    
    console.log("Loading draft:", draft);
    fieldIds.forEach(function(id) {
      if (draft[id] !== undefined) {
        $("#" + id).val(draft[id]);
      }
    });
    if (draft.interests) {
      draft.interests.forEach(function(value) {
        $('.interest[value="' + value + '"]').prop("checked", true);
      });
    }
    $("#characterCount").text($("#reason").val().length);
  }

  $(form).on("input change", "input, select, textarea", function() {
    window.saveDraft();
    $("#characterCount").text($("#reason").val().length);
  });

  window.resetJoinForm = function() {
    form.reset();
    form.classList.remove("was-validated");
    $("#interestError").hide();
    $("#characterCount").text("0");
    optionalStorage.removeLocal(draftKey);
    console.log("Form reset, draft cleared");
  };

  $("#clearDraft").on("click", window.resetJoinForm);

  $(form).on("submit", function(event) {
    event.preventDefault();
    var hasInterest = $(".interest:checked").length > 0;
    $("#interestError").toggle(!hasInterest);
    form.classList.add("was-validated");
    if (!form.checkValidity() || !hasInterest) return;
    var memberName = $("#fullName").val();
    window.resetJoinForm();
    $("#successMessage").html("<strong>Registration received, " + $("<div>").text(memberName).html() + "!</strong> Thank you for your interest. The committee will contact you soon.").addClass("show");
    $("#successMessage")[0].scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $(".accordion-button").on("click", function() {
    var target = $(this).data("target");
    var body = $("#" + target);
    var isOpen = body.is(":visible");
    $(".accordion-body").slideUp(200);
    $(".accordion-button").removeClass("active").attr("aria-expanded", "false");
    if (!isOpen) {
      body.slideDown(200);
      $(this).addClass("active").attr("aria-expanded", "true");
    }
  });

  loadDraft();
});

  $(function() {
    $("[data-year]").text(new Date().getFullYear());
  });

  $(function() {
      const optionalStorage = window.aiclubOptionalStorage;

      $(".filter-btn").on("click", function() {
        const filter = $(this).data("filter");
        $(".filter-btn").removeClass("active");
        $(this).addClass("active");
        if (filter === "all") {
          $(".resource-item").fadeIn(180);
        } else {
          $(".resource-item").hide().filter('[data-category="' + filter + '"]').fadeIn(180);
        }
      });

      let saved = [];
      try {
        const storedBookmarks = JSON.parse(optionalStorage.getLocal("savedAIResources") || "[]");
        saved = Array.isArray(storedBookmarks) ? storedBookmarks : [];
      } catch (error) {
        saved = [];
      }

      function refreshBookmarks() {
        $(".resource-item").each(function() {
          const isSaved = saved.includes($(this).data("id"));
          $(this).find(".bookmark").toggleClass("saved", isSaved).text(isSaved ? "★" : "☆");
        });
      }
      $(".bookmark").on("click", function() {
        const id = $(this).closest(".resource-item").data("id");
        saved = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id];
        optionalStorage.setLocal("savedAIResources", JSON.stringify(saved));
        refreshBookmarks();
      });
      refreshBookmarks();
    });

    const MANUAL_EVENTS = [
  {
    summary: "Prompt Engineering Masterclass",
    description: "Learn advanced techniques for crafting effective prompts in AI applications.",
    location: "Lab 2",
    start: "2026-08-20T09:00:00",
    end: "2026-08-20T17:00:00",
    category: "workshop",
    status: "upcoming"
  },
  {
    summary: "AI Ethics & Responsible Innovation",
    description: "Discuss the ethical implications of AI and how to build responsible systems.",
    location: "Auditorium",
    start: "2026-08-25T10:00:00",
    end: "2026-08-25T16:00:00",
    category: "seminar",
    status: "upcoming"
  },
  {
    summary: "AI for Good Hackathon",
    description: "Build AI solutions that address real-world social and environmental challenges.",
    location: "Online + Lab",
    start: "2026-09-05T09:00:00",
    end: "2026-09-06T17:00:00",
    category: "hackathon",
    status: "upcoming"
  },
  {
    summary: "Innovation Sprint: Smart Campus",
    description: "Design a solution that makes campus life smarter, safer, or more sustainable. Team of 3-4",
    location: "Deadline: Aug 30",
    start: "2026-08-30T00:00:00",
    end: "2026-08-30T23:59:00",
    category: "challenge",
    status: "ongoing"
  },
  {
    summary: "Computer Vision with OpenCV",
    description: "Hands-on session on image processing and object detection using OpenCV.",
    location: "Lab 3",
    start: "2026-09-10T09:00:00",
    end: "2026-09-10T17:00:00",
    category: "workshop",
    status: "upcoming"
  },
  {
    summary: "Future of AI in Healthcare",
    description: "Industry experts discuss AI applications in medical diagnosis and treatment. Recording available soon.",
    location: "Virtual",
    start: "2026-08-05T10:00:00",
    end: "2026-08-05T16:00:00",
    category: "seminar",
    status: "ended"
  }
];

let cachedEvents = [];
let currentFilter = 'all';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getEventStatus(event) {
  if (event.status) return event.status;
  
  const now = new Date();
  const start = new Date(event.start?.dateTime || event.start);
  const end = new Date(event.end?.dateTime || event.end || start);

  if (now > end) return 'ended';
  if (now >= start && now <= end) return 'ongoing';
  return 'upcoming';
}

function getEventCategory(summary) {
  const lower = summary.toLowerCase();
  if (lower.includes('workshop')) return 'workshop';
  if (lower.includes('seminar') || lower.includes('talk')) return 'seminar';
  if (lower.includes('hackathon')) return 'hackathon';
  if (lower.includes('challenge') || lower.includes('sprint')) return 'challenge';
  return 'workshop';
}

function getTagStyles(category) {
  const map = {
    'workshop': 'tag-workshop',
    'seminar': 'tag-seminar',
    'hackathon': 'tag-hackathon',
    'challenge': 'tag-challenge'
  };
  return map[category] || 'tag-workshop';
}

function getStatusStyles(status) {
  const map = {
    'upcoming': 'status-upcoming',
    'ongoing': 'status-ongoing',
    'ended': 'status-ended'
  };
  return map[status] || 'status-upcoming';
}

function getManualEvents() {
  return MANUAL_EVENTS.map(event => ({
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.start
    },
    end: {
      dateTime: event.end
    },
    status: 'confirmed',
    category: event.category || getEventCategory(event.summary),
    manualStatus: event.status || null
  }));
}

function renderEvents(events) {
  const grid = document.getElementById('eventGrid');
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');

  loadingState.style.display = 'none';

  if (!events || events.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  let filteredEvents = events;
  if (currentFilter !== 'all') {
    filteredEvents = events.filter(event => {
      const category = event.category || getEventCategory(event.summary);
      return category === currentFilter;
    });
  }

  if (filteredEvents.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  filteredEvents.sort((a, b) => {
    const dateA = new Date(a.start?.dateTime || a.start?.date);
    const dateB = new Date(b.start?.dateTime || b.start?.date);
    return dateA - dateB;
  });

  let html = '';
  filteredEvents.forEach(event => {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date || start;
    const summary = event.summary || 'Untitled Event';
    const description = event.description || 'No description available.';
    const location = event.location || 'Location TBD';
    const category = event.category || getEventCategory(summary);
    const status = event.manualStatus || getEventStatus(event);
    const tagClass = getTagStyles(category);
    const statusClass = getStatusStyles(status);
    const displayDate = formatDate(start);

    let timeDisplay = '';
    if (event.start?.dateTime) {
      const time = new Date(start);
      timeDisplay = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    html += `
      <div class="event-item" data-category="${category}">
        <article class="event-card">
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:.5rem;">
              <span class="event-tag ${tagClass}">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
              <span class="event-status ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
            <h3 style="color:#fff;font-size:1.1rem;font-weight:700;margin:.5rem 0;">${summary}</h3>
            <p style="color:var(--muted);font-size:.9rem;margin-bottom:.5rem;">${description.substring(0, 120)}${description.length > 120 ? '...' : ''}</p>
            <div style="display:flex;gap:1rem;font-size:.8rem;color:var(--muted);margin:.5rem 0;flex-wrap:wrap;">
              <span>📅 ${displayDate}${timeDisplay ? ' at ' + timeDisplay : ''}</span>
              <span>📍 ${location}</span>
            </div>
            ${status !== 'ended' ? `
              <a class="button button-primary" href="join.html#registration">Register Now
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
              </a>
            ` : `
              <span style="color:var(--muted);font-size:.8rem;display:block;text-align:center;margin-top:.5rem;">✓ Event has ended</span>
            `}
          </div>
        </article>
      </div>
    `;
  });

  grid.innerHTML = html;
}

function buildCalendar(events, year, month) {
  const grid = document.getElementById('calendarGrid');
  const monthYearDisplay = document.getElementById('calendarMonthYear');
  const headers = grid.querySelectorAll('.day-header');
  grid.innerHTML = '';
  headers.forEach(h => grid.appendChild(h));

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

  const eventDates = new Set();
  events.forEach(event => {
    const start = event.start?.dateTime || event.start?.date;
    if (start) {
      const date = new Date(start);
      if (date.getFullYear() === year && date.getMonth() === month) {
        eventDates.add(date.getDate());
      }
    }
  });

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const div = document.createElement('div');
    div.className = 'day other-month';
    div.textContent = day;
    grid.appendChild(div);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const div = document.createElement('div');
    div.className = 'day';
    if (eventDates.has(day)) {
      div.classList.add('has-event');
      div.title = 'Event on this day';
    }
    div.textContent = day;
    grid.appendChild(div);
  }

  const totalCells = startDayOfWeek + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const div = document.createElement('div');
    div.className = 'day other-month';
    div.textContent = day;
    grid.appendChild(div);
  }
}

function initCalendar() {
  const grid = document.getElementById('eventGrid');
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');

  if (!grid || !loadingState || !emptyState) {
    return;
  }

  loadingState.style.display = 'block';
  emptyState.style.display = 'none';

  const events = getManualEvents();
  cachedEvents = events;

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.start?.dateTime || a.start?.date);
    const dateB = new Date(b.start?.dateTime || b.start?.date);
    return dateA - dateB;
  });

  renderEvents(sortedEvents);

  const now = new Date();
  buildCalendar(events, now.getFullYear(), now.getMonth());

  window.currentCalendarYear = now.getFullYear();
  window.currentCalendarMonth = now.getMonth();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
    setupEventListeners();
  });
} else {
  initCalendar();
  setupEventListeners();
}

function setupEventListeners() {
  
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const filter = this.dataset.filter;
        currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const sortedEvents = [...cachedEvents].sort((a, b) => {
          const dateA = new Date(a.start?.dateTime || a.start?.date);
          const dateB = new Date(b.start?.dateTime || b.start?.date);
          return dateA - dateB;
        });
        renderEvents(sortedEvents);
      });
    });
  }

  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      if (window.currentCalendarMonth === undefined) return;
      window.currentCalendarMonth--;
      if (window.currentCalendarMonth < 0) {
        window.currentCalendarMonth = 11;
        window.currentCalendarYear--;
      }
      buildCalendar(cachedEvents, window.currentCalendarYear, window.currentCalendarMonth);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      if (window.currentCalendarMonth === undefined) return;
      window.currentCalendarMonth++;
      if (window.currentCalendarMonth > 11) {
        window.currentCalendarMonth = 0;
        window.currentCalendarYear++;
      }
      buildCalendar(cachedEvents, window.currentCalendarYear, window.currentCalendarMonth);
    });
  }
}

})();



