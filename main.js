// Loads home.html, then the header and footer components, then wires the bar menu.
(function () {
  start();

  async function start() {
    const mount = document.querySelector("[data-page-root]");
    if (mount) {
      const loaded = await loadHome(mount);
      if (!loaded) {
        return;
      }
    }
    await loadComponents(document);
    setupPage();
  }

  async function loadHome(mountNode) {
    try {
      const response = await fetch("home.html", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("home.html did not load");
      }

      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const page = parsed.querySelector("[data-home]");
      if (!page) {
        throw new Error("home.html is missing the page wrapper");
      }

      mountNode.replaceWith(document.adoptNode(page));
      return true;
    } catch (error) {
      mountNode.innerHTML =
        '<div class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center text-center">' +
        '<p class="font-serif text-3xl text-stone-900">Open the homepage directly</p>' +
        '<p class="mt-3 text-sm leading-relaxed text-stone-600">This entry page reads home.html with a local server. Opening the file by itself blocks that read.</p>' +
        '<a class="mt-6 inline-flex rounded-full bg-rose-900 px-5 py-2.5 text-sm font-medium text-white" href="home.html">Go to home.html</a>' +
        "</div>";
      return false;
    }
  }

  async function loadComponents(root) {
    const slots = [...root.querySelectorAll("[data-component]")];
    await Promise.all(
      slots.map(async function (slot) {
        const url = slot.getAttribute("data-component");
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) {
            throw new Error(url + " did not load");
          }
          const html = await response.text();
          const parsed = new DOMParser().parseFromString(html, "text/html");
          const component = parsed.body.firstElementChild;
          if (!component) {
            throw new Error(url + " is empty");
          }
          slot.replaceWith(document.adoptNode(component));
        } catch (error) {
          slot.innerHTML =
            '<p class="px-5 py-4 text-sm text-stone-600">This section could not be loaded. Open the site from a local server.</p>';
        }
      })
    );
  }

  function setupPage() {
    const header = document.querySelector("[data-header]");
    if (!header || header.dataset.ready === "true") {
      return;
    }
    header.dataset.ready = "true";

    if (!document.querySelector("[data-home]")) {
      header.querySelectorAll("a[href^='#']").forEach(function (link) {
        if (link.getAttribute("href") === "#contact") {
          return;
        }
        link.setAttribute("href", "index.html" + link.getAttribute("href"));
      });
    }

    const dropdown = header.querySelector("[data-dropdown]");
    const dropdownButton = header.querySelector("[data-dropdown-button]");
    const dropdownPanel = header.querySelector("[data-dropdown-panel]");
    const menuButton = header.querySelector("[data-menu-button]");
    const mobilePanel = header.querySelector("[data-mobile-panel]");

    function setDropdown(open) {
      if (!dropdown || !dropdownButton || !dropdownPanel) {
        return;
      }
      dropdown.dataset.open = open ? "true" : "false";
      dropdownButton.setAttribute("aria-expanded", String(open));
      dropdownPanel.classList.toggle("invisible", !open);
      dropdownPanel.classList.toggle("pointer-events-none", !open);
      dropdownPanel.classList.toggle("opacity-0", !open);
      if (open) {
        dropdownPanel.removeAttribute("inert");
      } else {
        dropdownPanel.setAttribute("inert", "");
      }
    }

    function setMobile(open) {
      if (!menuButton || !mobilePanel) {
        return;
      }
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobilePanel.classList.toggle("hidden", !open);
    }

    dropdownButton?.addEventListener("click", function (event) {
      event.stopPropagation();
      const open = dropdownButton.getAttribute("aria-expanded") === "true";
      setDropdown(!open);
    });

    dropdownButton?.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown" || !dropdownPanel) {
        return;
      }
      event.preventDefault();
      setDropdown(true);
      const firstLink = dropdownPanel.querySelector("a");
      if (firstLink) {
        firstLink.focus();
      }
    });

    menuButton?.addEventListener("click", function () {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      setMobile(!open);
    });

    document.addEventListener("click", function (event) {
      if (!(event.target instanceof Node) || header.contains(event.target)) {
        return;
      }
      setDropdown(false);
      setMobile(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }
      const dropdownWasOpen = dropdown?.dataset.open === "true";
      const mobileWasOpen = menuButton?.getAttribute("aria-expanded") === "true";
      setDropdown(false);
      setMobile(false);
      if (dropdownWasOpen && dropdownButton) {
        dropdownButton.focus();
      } else if (mobileWasOpen && menuButton) {
        menuButton.focus();
      }
    });

    dropdownPanel?.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        window.setTimeout(function () {
          setDropdown(false);
        }, 0);
      });
    });

    mobilePanel?.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMobile(false);
      });
    });

    const scroller = document.querySelector("[data-carousel]");
    const prev = document.querySelector("[data-carousel-prev]");
    const next = document.querySelector("[data-carousel-next]");
    if (scroller && prev && next) {
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

      function step() {
        const card = scroller.querySelector("li");
        if (!card) {
          return scroller.clientWidth;
        }
        return card.getBoundingClientRect().width + 16;
      }

      function refreshArrows() {
        const max = scroller.scrollWidth - scroller.clientWidth - 2;
        prev.setAttribute("aria-disabled", scroller.scrollLeft <= 2 ? "true" : "false");
        next.setAttribute("aria-disabled", scroller.scrollLeft >= max ? "true" : "false");
      }

      prev.addEventListener("click", function () {
        scroller.scrollBy({ left: -step(), behavior: motion });
      });
      next.addEventListener("click", function () {
        scroller.scrollBy({ left: step(), behavior: motion });
      });
      scroller.addEventListener("scroll", refreshArrows, { passive: true });
      window.addEventListener("resize", refreshArrows);
      refreshArrows();
    }

    setupReveal();

    const diagram = document.querySelector("[data-diagram]");
    const diagramLines = document.querySelector("[data-diagram-lines]");
    const diagramCenter = document.querySelector("[data-diagram-center]");
    if (diagram && diagramLines && diagramCenter) {
      function drawDiagram() {
        if (diagram.clientWidth === 0) {
          return;
        }
        const width = diagram.clientWidth;
        const height = diagram.clientHeight;
        const rootBox = diagram.getBoundingClientRect();
        const center = diagramCenter.getBoundingClientRect();
        const cx = center.left - rootBox.left + center.width / 2;
        const cy = center.top - rootBox.top + center.height / 2;
        const rx = center.width / 2;
        const ry = center.height / 2;
        const lines = [...diagram.querySelectorAll("[data-dot]")].map(function (dot) {
          const box = dot.getBoundingClientRect();
          const x = box.left - rootBox.left + box.width / 2;
          const y = box.top - rootBox.top + box.height / 2;
          const dx = x - cx;
          const dy = y - cy;
          const distance = Math.hypot(dx, dy) || 1;
          const edge = 1 / Math.hypot(dx / rx, dy / ry);
          const x1 = x - (dx / distance) * (box.width / 2 + 2);
          const y1 = y - (dy / distance) * (box.height / 2 + 2);
          const x2 = cx + dx * edge;
          const y2 = cy + dy * edge;
          return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" />';
        });
        diagramLines.setAttribute("viewBox", "0 0 " + width + " " + height);
        diagramLines.innerHTML =
          '<g fill="none" stroke="#9f1239" stroke-width="1.5" stroke-linecap="round">' + lines.join("") + "</g>";
      }

      drawDiagram();
      window.addEventListener("resize", drawDiagram);
    }
  }

  function setupReveal() {
    const sections = [...document.querySelectorAll(".reveal")];
    if (!sections.length) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      sections.forEach(function (section) {
        section.classList.add("is-in");
      });
      return;
    }

    sections.forEach(function (section, index) {
      const box = section.getBoundingClientRect();
      const onScreen = box.top < window.innerHeight && box.bottom > 0;
      if (onScreen) {
        section.style.animationDelay = 0.2 + index * 0.12 + "s";
      }
    });

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-in");
          entry.target.addEventListener("animationend", function (event) {
            if (event.target !== entry.target) {
              return;
            }
            entry.target.classList.add("reveal-done");
          });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }
})();
