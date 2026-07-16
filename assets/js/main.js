const header = document.querySelector("#header");
const menu = document.querySelector("#nav-menu");
const menuToggle = document.querySelector("#nav-toggle");
const navLinks = [...document.querySelectorAll(".nav__link")];
const sections = [...document.querySelectorAll("main section[id]")];
const pageContent = [document.querySelector("main"), document.querySelector("footer")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setMenu(open) {
    menu.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.querySelector(".nav__toggle-label").textContent = open ? "Close" : "Menu";
    document.body.classList.toggle("menu-open", open);
    pageContent.forEach((element) => {
        element.inert = open;
    });

    if (open) navLinks[0].focus();
}

menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

navLinks.forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        setMenu(false);
        menuToggle.focus();
    }
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) setMenu(false);
});

function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const revealItems = document.querySelectorAll(".reveal");

if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
}

const sectionObserver = new IntersectionObserver(
    (entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        navLinks.forEach((link) => {
            const isCurrent = link.getAttribute("href") === `#${visible.target.id}`;
            link.classList.toggle("active-link", isCurrent);

            if (isCurrent) {
                link.setAttribute("aria-current", "true");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    },
    { threshold: [0.2, 0.45], rootMargin: "-20% 0px -45% 0px" }
);

sections.forEach((section) => sectionObserver.observe(section));

document.querySelector("#year").textContent = new Date().getFullYear();
