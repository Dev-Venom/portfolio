import { useEffect, useState } from "react";

const projects = [
  {
    number: "01",
    title: "Career Tracker",
    type: "Full-stack application",
    image: "/project-career-tracker.png",
    alt: "Career Tracker application dashboard",
    story: "A focused career command centre that turns scattered applications, interviews and follow-ups into one dependable system.",
    stack: ["Spring Boot", "React", "JWT", "MySQL"],
    links: [
      { label: "Frontend repository", href: "https://github.com/Dev-Venom/career-tracker-ui" },
      { label: "Backend repository", href: "https://github.com/Dev-Venom/career-tracker-api" },
    ],
    tone: "yellow",
  },
  {
    number: "02",
    title: "Pour d’Or",
    type: "Java commerce experience",
    image: "/project-pour-dor.png",
    alt: "Pour d'Or premium coffee application homepage",
    story: "A premium coffee-ordering experience where a structured Java backend meets a calm, hospitality-led interface.",
    stack: ["Java", "Servlets", "JSP", "JDBC"],
    links: [{ label: "View repository", href: "https://github.com/Dev-Venom/Cafe-Application" }],
    tone: "gold",
  },
  {
    number: "03",
    title: "GitPath",
    type: "Interactive learning product",
    image: "/project-gitpath.png",
    alt: "GitPath guided Git workspace homepage",
    story: "A practical learning environment that helps developers understand Git through stages, commands, decisions and visual feedback.",
    stack: ["React", "JavaScript", "Learning UX", "CSS"],
    links: [{ label: "Visit live project", href: "https://dev-venom.github.io/gitpath/" }],
    tone: "lime",
  },
  {
    number: "04",
    title: "AstroVerse",
    type: "Interactive space experience",
    image: "/project-astroverse.png",
    alt: "AstroVerse interactive astronomy homepage",
    story: "An immersive journey through astronomy, the ISS, cosmic theories, timelines, galleries and black holes.",
    stack: ["React", "NASA APIs", "JavaScript", "CSS"],
    links: [{ label: "Visit live project", href: "https://astro-stellar-verse.vercel.app/" }],
    tone: "cosmic",
  },
];

const notes = [
  {
    number: "001",
    category: "REST APIs",
    title: "What I wish I knew before building my first backend",
    summary: "The practical decisions, common mistakes and trade-offs beginners rarely see in tutorials.",
    status: "Published",
    href: "https://buildbreaklearndev.hashnode.dev/rest-api-beginners-spring-boot",
  },
  {
    number: "002",
    category: "Security",
    title: "How JWT authentication secured Career Tracker",
    summary: "A clear account of protecting routes, handling tokens and learning where authentication can fail.",
    status: "Publishing soon",
    href: null,
  },
  {
    number: "003",
    category: "Git",
    title: "Stop memorizing Git. Understand how it moves.",
    summary: "Why a mental model of commits, branches and state is more useful than another command cheat sheet.",
    status: "Publishing soon",
    href: null,
  },
];

const capabilities = [
  {
    title: "Backend engineering",
    skills: "Java · Spring Boot · REST APIs · Spring Security · JWT · JDBC · Servlets",
    evidence: "Career Tracker / Pour d’Or",
  },
  {
    title: "Frontend development",
    skills: "React · JavaScript · TypeScript · HTML · CSS · Vite · ECharts",
    evidence: "GitPath / AstroVerse",
  },
  {
    title: "Data & tools",
    skills: "MySQL · PostgreSQL · Git · GitHub · Postman · Tomcat",
    evidence: "Across the full stack",
  },
  {
    title: "Product thinking",
    skills: "Responsive design · Component systems · UI/UX · Figma · Accessibility",
    evidence: "Every interface",
  },
];

const navItems = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Notes", href: "#notes" },
  { label: "Contact", href: "#contact" },
];

function ExternalArrow() {
  return <span className="external-arrow" aria-hidden="true">↗</span>;
}

export default function Home() {
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(available > 0 ? window.scrollY / available : 0);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.12 },
    );

    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <main>
      <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />

      <nav className="site-nav" aria-label="Primary navigation">
        <a className="site-nav__brand" href="#top" aria-label="Kumaravel, back to top">
          Kumaravel<span>.</span>
        </a>
        <div className="site-nav__links">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </div>
        <button
          className="site-nav__menu"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          Menu
        </button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu__top">
          <b className="mobile-menu__title">Kumaravel.</b>
          <button aria-label="Close navigation" onClick={() => setMenuOpen(false)}>Close</button>
        </div>
        <div className="mobile-menu__links">
          {navItems.map((item, index) => (
            <a href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>
              <span>0{index + 1}</span>{item.label}
            </a>
          ))}
        </div>
      </div>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <img
          className="hero__image"
          src="/hero-007.png"
          alt="Kumaravel in a black suit against a cinematic 007 background"
        />
        <div className="hero__shade" aria-hidden="true" />
        <div className="hero__identity">
          <p>Java full-stack developer</p>
          <h1 id="hero-title">Kumaravel</h1>
          <span>Product-minded · India</span>
        </div>
        <div className="hero__status">
          <i aria-hidden="true" />
          <span>Available for opportunities</span>
        </div>
        <a className="hero__scroll" href="#introduction">
          <span>Enter portfolio</span>
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="introduction section-light" id="introduction">
        <div className="section-index reveal"><span>01</span><p>Introduction</p></div>
        <div className="introduction__body reveal">
          <p className="eyebrow">ENGINEERING × PRODUCT THINKING</p>
          <h2>I build systems that feel as good as they <em>work.</em></h2>
          <div className="introduction__detail">
            <p>I turn complex requirements into dependable full-stack products—from secure Java APIs to interfaces people can understand immediately.</p>
            <a href="#work">Explore selected work <ExternalArrow /></a>
          </div>
        </div>
      </section>

      <section className="work section-dark" id="work">
        <div className="section-index section-index--dark reveal"><span>02</span><p>Selected work</p></div>
        <header className="work__header reveal">
          <p className="eyebrow">FOUR BUILDS · FOUR DIFFERENT PROBLEMS</p>
          <h2>Proof, not<br /><em>promises.</em></h2>
        </header>

        <div className="project-list">
          {projects.map((project) => (
            <article className={`project project--${project.tone} reveal`} key={project.number}>
              <div className="project__visual">
                <img src={project.image} alt={project.alt} loading="lazy" />
                <span className="project__number">{project.number}</span>
              </div>
              <div className="project__content">
                <div className="project__heading">
                  <p>{project.type}</p>
                  <h3>{project.title}</h3>
                </div>
                <p className="project__story">{project.story}</p>
                <div className="project__footer">
                  <ul aria-label={`${project.title} technologies`}>
                    {project.stack.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                  <div className="project__links">
                    {project.links.map((link) => (
                      <a href={link.href} target="_blank" rel="noreferrer" key={link.href}>
                        {link.label} <ExternalArrow />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about section-light" id="about">
        <div className="section-index reveal"><span>03</span><p>The builder</p></div>
        <div className="about__body reveal">
          <div>
            <p className="eyebrow">ABOUT / KUMARAVEL</p>
            <h2>Building the engineering underneath—and caring about every detail people <em>touch.</em></h2>
          </div>
          <div className="about__story">
            <p>I’m a Computer Science and Business Systems graduate focused on Java full-stack development. I started with Java, JDBC and Servlets, then moved into Spring Boot APIs, React applications and product design.</p>
            <p>For me, development is more than making a feature work. It means understanding the problem, engineering a reliable system and presenting it through an interface that feels considered.</p>
          </div>
          <div className="journey" aria-label="Learning journey">
            {[
              ["01", "Foundation", "Java · OOP · JDBC"],
              ["02", "Backend", "Servlets · Spring Boot · REST"],
              ["03", "Products", "React · Security · Analytics"],
              ["04", "Next", "Cloud · AI · Product Design"],
            ].map(([number, title, detail]) => (
              <div className="journey__step" key={number}>
                <span>{number}</span><div><b>{title}</b><p>{detail}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lab section-dark" id="lab">
        <div className="section-index section-index--dark reveal"><span>04</span><p>The lab</p></div>
        <div className="lab__body reveal">
          <div className="lab__copy">
            <p className="eyebrow"><span className="status-dot" /> SYSTEM IN DEVELOPMENT</p>
            <h2>The next system is already taking <em>flight.</em></h2>
            <h3>Industrial Drone Gas Monitoring Platform</h3>
            <p>A mission-control platform for hazardous-gas readings, live drone telemetry, alerts, mission logs and historical environmental analytics.</p>
            <ul>
              <li>React + TypeScript</li><li>Spring Boot</li><li>PostgreSQL</li><li>MQTT</li>
            </ul>
          </div>
          <div className="telemetry" aria-label="Conceptual drone telemetry panel">
            <div className="telemetry__header"><span>MISSION / ALPHA-01</span><span>LIVE SIMULATION</span></div>
            <div className="telemetry__plot" aria-hidden="true">
              <i className="telemetry__ring telemetry__ring--one" />
              <i className="telemetry__ring telemetry__ring--two" />
              <i className="telemetry__route" />
              <b className="telemetry__point telemetry__point--one" />
              <b className="telemetry__point telemetry__point--two" />
              <b className="telemetry__point telemetry__point--three" />
            </div>
            <div className="telemetry__data">
              <div><span>CH₄</span><b>08.2</b><small>PPM</small></div>
              <div><span>CO₂</span><b>412</b><small>PPM</small></div>
              <div><span>ALT</span><b>36.4</b><small>M</small></div>
            </div>
          </div>
        </div>
        <p className="lab__statement reveal">Completed work shows what I can deliver. <span>The Lab shows where I’m heading.</span></p>
      </section>

      <section className="notes section-paper" id="notes">
        <div className="section-index reveal"><span>05</span><p>Field notes</p></div>
        <header className="notes__header reveal">
          <p className="eyebrow">ENGINEERING JOURNAL</p>
          <h2>Built, broken,<br />understood.</h2>
          <p>Projects show the result. Field Notes reveal the decisions behind it.</p>
        </header>
        <div className="note-list">
          {notes.map((note) => (
            <article className="note reveal" key={note.number}>
              <div className="note__meta"><span>{note.number}</span><p>{note.category}</p><i>{note.status}</i></div>
              <h3>{note.title}</h3>
              <div className="note__summary">
                <p>{note.summary}</p>
                {note.href ? (
                  <a href={note.href} target="_blank" rel="noreferrer">Read article <ExternalArrow /></a>
                ) : (
                  <span>Article in progress</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="capabilities section-light" id="capabilities">
        <div className="section-index reveal"><span>06</span><p>Capabilities</p></div>
        <div className="capabilities__body reveal">
          <header>
            <p className="eyebrow">HOW I BUILD</p>
            <h2>From database schema to the final <em>interaction.</em></h2>
          </header>
          <div className="capability-list">
            {capabilities.map((capability, index) => (
              <article className="capability" key={capability.title}>
                <span>0{index + 1}</span>
                <div><h3>{capability.title}</h3><p>{capability.skills}</p></div>
                <small>{capability.evidence}</small>
              </article>
            ))}
          </div>
          <blockquote>I don’t collect technologies. I use them together to turn an idea into a dependable product.</blockquote>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="contact__line" aria-hidden="true" />
        <div className="contact__status reveal"><i /><span>AVAILABLE FOR OPPORTUNITIES</span></div>
        <div className="contact__body reveal">
          <p>Have a role, product or problem worth solving?</p>
          <h2>Let’s build<br />something <em>real.</em></h2>
          <a className="contact__email" href="mailto:kumaravel007650@gmail.com">kumaravel007650@gmail.com</a>
          <div className="contact__actions">
            <a className="contact__primary" href="mailto:kumaravel007650@gmail.com">Email me <ExternalArrow /></a>
            <a href="https://github.com/Dev-Venom" target="_blank" rel="noreferrer">GitHub <ExternalArrow /></a>
            <a href="https://www.linkedin.com/in/kumaravel-saravanan/" target="_blank" rel="noreferrer">LinkedIn <ExternalArrow /></a>
          </div>
        </div>
        <footer className="footer">
          <div><b>Kumaravel</b><span>Java full-stack developer</span></div>
          <p>India · Open to on-site and remote opportunities</p>
          <a href="#top">Back to top ↑</a>
        </footer>
      </section>
    </main>
  );
}
