const loader = document.getElementById("loader");
const nav = document.getElementById("nav");
const menu = document.getElementById("menu");

window.addEventListener("load", () => {
  setTimeout(() => {
    if (loader) loader.classList.add("hide");
  }, 650);
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

window.addEventListener(
  "scroll",
  () => {
    if (!nav) return;
    const y = window.scrollY;
    if (y > 40) {
      nav.style.borderBottom = "1px solid rgba(217,182,106,.1)";
      nav.style.background = "rgba(5,6,8,.88)";
    } else {
      nav.style.borderBottom = "1px solid transparent";
      nav.style.background = "linear-gradient(180deg,rgba(5,6,8,.92),transparent)";
    }
  },
  { passive: true }
);

if (menu && nav) {
  menu.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", isOpen ? "true" : "false");
    menu.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
    if (nav) {
      nav.classList.remove("open");
      if (menu) {
        menu.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-label", "Open menu");
      }
    }
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav && nav.classList.contains("open")) {
    nav.classList.remove("open");
    if (menu) {
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open menu");
      menu.focus();
    }
  }
});
