import { useEffect, useRef, useState } from "react";
import "./styles.css";

const asset = (filename) => `${import.meta.env.BASE_URL}${filename}`;

function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      ↗
    </span>
  );
}

function ExternalLink({ href, children, className = "text-link" }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
      <Arrow />
    </a>
  );
}



function createKnotMesh() {
  const positions = [];
  const normals = [];
  const indices = [];
  const segments = 200;
  const sides = 24;

  const normalize = (vector) => {
    const length = Math.hypot(...vector) || 1;
    return vector.map((value) => value / length);
  };

  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];

  const point = (t) => {
    const radius = 1 + 0.34 * Math.cos(3 * t);

    return [
      radius * Math.cos(2 * t),
      radius * Math.sin(2 * t),
      0.46 * Math.sin(3 * t),
    ];
  };

  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    const center = point(t);
    const next = point(t + 0.001);
    const tangent = normalize(
      next.map((value, index) => value - center[index]),
    );
    const normal = normalize(cross(tangent, [0, 0, 1]));
    const binormal = cross(tangent, normal);

    for (let j = 0; j <= sides; j += 1) {
      const angle = (j / sides) * Math.PI * 2;
      const direction = normal.map(
        (value, index) =>
          value * Math.cos(angle) + binormal[index] * Math.sin(angle),
      );

      positions.push(
        ...center.map((value, index) => value + 0.23 * direction[index]),
      );
      normals.push(...direction);

      if (i < segments && j < sides) {
        const a = i * (sides + 1) + j;
        const b = a + sides + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }

  return { positions, normals, indices };
}

const VERTEX_SHADER = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;

  uniform vec2 uRotation;
  uniform float uAspect;

  varying mediump vec3 vNormal;
  varying mediump vec3 vPosition;

  vec3 rotate(vec3 p) {
    float cx = cos(uRotation.x);
    float sx = sin(uRotation.x);
    float cy = cos(uRotation.y);
    float sy = sin(uRotation.y);

    p = vec3(
      p.x,
      cx * p.y - sx * p.z,
      sx * p.y + cx * p.z
    );

    return vec3(
      cy * p.x + sy * p.z,
      p.y,
      -sy * p.x + cy * p.z
    );
  }

  void main() {
    vec3 p = rotate(aPosition);
    p.z -= 4.8;

    vPosition = p;
    vNormal = rotate(aNormal);

    float focal = 2.35 * min(uAspect, 1.0);

    gl_Position = vec4(
      p.x * focal / uAspect,
      p.y * focal,
      -1.00669 * p.z - 0.20067,
      -p.z
    );
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  varying mediump vec3 vNormal;
  varying mediump vec3 vPosition;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 view = normalize(-vPosition);
    vec3 reflection = reflect(-view, n);

    float sky = smoothstep(-0.45, 0.95, reflection.y);

    vec3 color = mix(
      vec3(0.025, 0.034, 0.048),
      vec3(0.38, 0.46, 0.55),
      sky
    );

    float stripe =
      smoothstep(0.35, 0.42, reflection.y) *
      (1.0 - smoothstep(0.52, 0.61, reflection.y));

    color += stripe * vec3(0.6, 0.67, 0.72);

    color += pow(
      max(dot(reflection, normalize(vec3(-0.8, 1.0, 1.0))), 0.0),
      26.0
    ) * vec3(1.8);

    color += pow(
      max(dot(reflection, normalize(vec3(1.0, 0.1, 0.6))), 0.0),
      15.0
    ) * vec3(1.0, 0.21, 0.045);

    float rim = pow(
      1.0 - max(dot(n, view), 0.0),
      3.0
    );

    color += rim * vec3(0.16, 0.19, 0.23);

    gl_FragColor = vec4(pow(color, vec3(0.4545)), 1.0);
  }
`;

function ChromeSculpture({ motion = true }) {
  const canvasRef = useRef(null);
  const angle = useRef(0.35);
  const pointer = useRef([0, 0]);
  const [contextVersion, setContextVersion] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const parent = canvas.parentElement;
    if (parent) parent.dataset.noWebgl = "true";

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });

    if (!gl) return undefined;

    const shaders = [];
    const buffers = [];
    const program = gl.createProgram();

    let frame = 0;
    let last = 0;
    let visible = true;
    let lost = false;

    const dispose = () => {
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(program);
    };

    try {
      const sources = [
        [gl.VERTEX_SHADER, VERTEX_SHADER],
        [gl.FRAGMENT_SHADER, FRAGMENT_SHADER],
      ];

      for (const [type, source] of sources) {
        const shader = gl.createShader(type);
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          throw new Error("Shader unavailable");
        }

        gl.attachShader(program, shader);
      }

      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("WebGL unavailable");
      }
    } catch {
      dispose();
      return undefined;
    }

    gl.useProgram(program);

    const mesh = createKnotMesh();
    const attributes = [
      ["aPosition", mesh.positions],
      ["aNormal", mesh.normals],
    ];

    for (const [name, values] of attributes) {
      const buffer = gl.createBuffer();
      buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);

      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    }

    const indexBuffer = gl.createBuffer();
    buffers.push(indexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(mesh.indices),
      gl.STATIC_DRAW,
    );

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);

    const rotation = gl.getUniformLocation(program, "uRotation");
    const aspect = gl.getUniformLocation(program, "uAspect");

    canvas.style.opacity = "1";
    if (parent) delete parent.dataset.noWebgl;

    function draw(now) {
      frame = 0;

      if (!visible || document.hidden || lost) {
        last = 0;
        return;
      }

      if (motion && last) {
        angle.current += Math.min(now - last, 50) * 0.00016;
      }

      last = now;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(aspect, canvas.width / canvas.height);
      gl.uniform2f(
        rotation,
        0.35 + pointer.current[1],
        angle.current + pointer.current[0],
      );
      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);

      if (motion) frame = requestAnimationFrame(draw);
    }

    function wake() {
      if (!frame && !lost && visible && !document.hidden) {
        frame = requestAnimationFrame(draw);
      }
    }

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      wake();
    }

    function move(event) {
      if (!motion || event.pointerType !== "mouse") return;

      const rect = canvas.getBoundingClientRect();
      pointer.current = [
        ((event.clientX - rect.left) / rect.width) * 0.6 - 0.3,
        ((event.clientY - rect.top) / rect.height) * 0.4 - 0.2,
      ];
    }

    function leave() {
      pointer.current = [0, 0];
    }

    function visibility() {
      document.hidden ? stop() : wake();
    }

    function contextLost(event) {
      event.preventDefault();
      lost = true;
      canvas.style.opacity = "0";
      if (parent) parent.dataset.noWebgl = "true";
      stop();
    }

    function contextRestored() {
      setContextVersion((value) => value + 1);
    }

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? wake() : stop();
    });

    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);
    document.addEventListener("visibilitychange", visibility);

    resize();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      document.removeEventListener("visibilitychange", visibility);
      dispose();
    };
  }, [motion, contextVersion]);

  return (
    <canvas ref={canvasRef} className="chrome-sculpture" aria-hidden="true" />
  );
}

const projects = [
  {
    number: "01",
    id: "career-tracker",
    type: "Completed · Full-stack application",
    status: "Completed",
    title: "Career Tracker",
    intro:
      "Because apparently applying for jobs needed its own software project.",
    description:
      "A full-stack application for organising job applications, interviews, follow-ups and career progress in one place instead of trusting twelve browser tabs and human memory.",
    features: [
      "User registration and JWT authentication",
      "Job application and status management",
      "Interview tracking",
      "Notifications and unread state",
      "Dashboard statistics and analytics",
      "Protected frontend routes",
      "REST API integration",
    ],
    stack:
      "Java · Spring Boot · Spring Security · Spring Data JPA · REST APIs · MySQL · React · Vite · Axios · ECharts",
    takeaway:
      "This is the project that proves I can connect a secured Java backend, database layer and React frontend into one working product.",
    fun: "The job search was already complicated, so naturally I gave it a database.",
    image: "project-career-tracker.png",
    imageAlt: "Career Tracker dashboard interface",
    links: [
      {
        label: "Backend repository",
        href: "https://github.com/Dev-Venom/career-tracker-api",
      },
      {
        label: "Frontend repository",
        href: "https://github.com/Dev-Venom/career-tracker-ui",
      },
    ],
  },
  {
    number: "02",
    id: "pour-dor",
    type: "Completed · Java web application",
    status: "Completed",
    title: "Pour d’Or",
    intro: "Started learning Servlets. Somehow ended up opening a coffee shop.",
    description:
      "A premium coffee-ordering web application built while learning how Java web applications work underneath the convenience of modern frameworks.",
    features: [
      "Registration and login",
      "Customer and admin flows",
      "Product catalogue and categories",
      "Cart and order management",
      "Addresses and reviews",
      "DAO-based persistence",
      "MVC-style separation",
    ],
    stack: "Java · Servlets · JSP · JDBC · MySQL · Tomcat · HTML · CSS",
    takeaway:
      "Pour d’Or shows the foundation behind my Spring Boot work: JDBC, request/response handling, Servlets, DAO architecture and server-side Java.",
    fun: "No microservices were harmed during the making of this coffee shop.",
    image: "project-pour-dor.png",
    imageAlt: "Pour d'Or coffee application homepage",
    links: [
      {
        label: "View repository",
        href: "https://github.com/Dev-Venom/Cafe-Application",
      },
    ],
  },
  {
    number: "03",
    id: "gitpath",
    type: "Live · Interactive learning product",
    status: "Live",
    title: "GitPath",
    intro: "Because “just memorise the commands” is not a learning strategy.",
    description:
      "An interactive Git learning experience that teaches Git as a workflow. It helps beginners understand commands, stages and decisions through structured lessons and visual feedback.",
    features: [
      "Guided learning stages",
      "Git command references",
      "Workflow explanations",
      "Visual learning aids",
      "Quizzes",
      "Progress tracking",
    ],
    stack: "React · JavaScript · CSS · Git · GitHub Pages",
    takeaway:
      "GitPath shows the product side of my work: taking a confusing technical topic and turning it into something easier to understand and use.",
    fun: "Git is confusing enough. The website doesn’t need to be.",
    image: "project-gitpath.png",
    imageAlt: "GitPath interactive Git learning website",
    links: [
      {
        label: "Visit live project",
        href: "https://dev-venom.github.io/gitpath/",
      },
    ],
  },
];

const journey = [
  {
    number: "01",
    title: "Foundation",
    stack: "Java · OOP · SQL · JDBC",
    note: "Learned what happens before a framework starts doing things for you.",
  },
  {
    number: "02",
    title: "Java web",
    stack: "Servlets · JSP · DAO · Tomcat",
    note: "Pour d’Or",
  },
  {
    number: "03",
    title: "Modern backend",
    stack: "Spring Boot · REST · Security · JWT",
    note: "Career Tracker",
  },
  {
    number: "04",
    title: "Products",
    stack: "React · APIs · UX · Visual systems",
    note: "Career Tracker · GitPath · AstroVerse",
  },
  {
    number: "05",
    title: "Systems",
    stack: "PostgreSQL · Webhooks · Kafka · Redis · Testing · CI",
    note: "CodePulse · learning now",
  },
  {
    number: "06",
    title: "Next",
    stack: "Cloud · Kubernetes · AI-assisted systems",
    note: "Learning, not pretending to be an expert yet.",
  },
];

const notes = [
  {
    number: "001",
    category: "REST APIs",
    title: "What I wish I knew before building my first backend",
    summary:
      "REST concepts, beginner mistakes and the practical decisions tutorials often skip.",
    status: "Published",
    href: "https://buildbreaklearndev.hashnode.dev/rest-api-beginners-spring-boot",
  },
  {
    number: "002",
    category: "Security",
    title: "Authentication worked. Then I learned why that wasn’t enough.",
    summary:
      "A planned write-up on JWT, Spring Security, protected endpoints, token expiry and the mistakes I made while securing Career Tracker.",
    status: "Planned",
  },
  {
    number: "003",
    category: "Git",
    title: "Stop memorising Git. Understand what it moves.",
    summary:
      "A mental model of the working tree, staging area, commits, branches and HEAD — the ideas behind GitPath.",
    status: "Planned",
  },
  {
    number: "004",
    category: "Architecture",
    title: "Why I’m not starting CodePulse with microservices",
    summary:
      "A future note on modular monoliths, premature complexity and making architecture earn its place.",
    status: "Planned",
  },
];

const capabilities = [
  {
    title: "Backend",
    skills:
      "Java · Spring Boot · REST APIs · Spring Security · JWT · JDBC · Servlets · JSP · JPA / Hibernate",
    evidence: "Career Tracker · Pour d’Or",
  },
  {
    title: "Frontend",
    skills: "React · JavaScript · HTML · CSS · Vite · Axios · ECharts",
    evidence: "Career Tracker · GitPath · AstroVerse",
  },
  {
    title: "Data & tools",
    skills:
      "MySQL · SQL · Git · GitHub · Postman · Maven · Tomcat · Eclipse · VS Code",
    evidence: "Used across completed projects",
  },
  {
    title: "Product thinking",
    skills:
      "Responsive UI · Component design · UX thinking · Accessibility basics",
    evidence: "Applied across the portfolio and project interfaces",
  },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [motion, setMotion] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setMotion(!query.matches);

    updateMotion();
    query.addEventListener("change", updateMotion);

    return () => query.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;

      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      const progress =
        scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;

      setScrollProgress(progress);
    };

    updateScrollProgress();

    window.addEventListener("scroll", updateScrollProgress, {
      passive: true,
    });

    window.addEventListener("resize", updateScrollProgress);

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="portfolio" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header shell">
        <a className="brand" href="#top" aria-label="Kumaravel, back to top">
          K<span>.</span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#lab">Lab</a>
          <a href="#notes">Notes</a>
          <a href="#contact">Contact</a>
        </nav>

        <button
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(true)}
        >
          Menu
        </button>
        <div className="header-progress" aria-hidden="true">
          <span
            style={{
              transform: `scaleX(${scrollProgress / 100})`,
            }}
          />
        </div>
      </header>

      <div
        className={`mobile-menu ${menuOpen ? "is-open" : ""}`}
        id="mobile-menu"
        aria-hidden={!menuOpen}
      >
        <div className="mobile-menu-top">
          <span>Kumaravel.</span>
          <button type="button" onClick={closeMenu}>
            Close
          </button>
        </div>

        <nav aria-label="Mobile navigation">
          <a href="#work" onClick={closeMenu}>
            <span>01</span>Work
          </a>
          <a href="#about" onClick={closeMenu}>
            <span>02</span>About
          </a>
          <a href="#lab" onClick={closeMenu}>
            <span>03</span>Lab
          </a>
          <a href="#notes" onClick={closeMenu}>
            <span>04</span>Notes
          </a>
          <a href="#contact" onClick={closeMenu}>
            <span>05</span>Contact
          </a>
        </nav>
      </div>

      <main id="main">
        <section className="hero shell">
          <div className="hero-copy reveal">
            <p className="hero-kicker">Portfolio / 2026 · India</p>

            <h1>
              Kumaravel<span>.</span>
            </h1>

            <p className="hero-role">Java Full-Stack Developer</p>

            <p className="hero-intro">
              I build Java systems, occasionally argue with APIs, and turn the
              useful parts into products people can actually use.
            </p>

            <p className="hero-description">
              Spring Boot on the backend. React when pixels are required.
              Currently moving beyond CRUD and learning how reliable backend
              systems behave when things stop being simple.
            </p>

            <p className="availability">
              <span aria-hidden="true" />
              Available for junior Java and full-stack opportunities
            </p>

            <div className="hero-actions">
              <a className="primary-link" href="#work">
                See what I’ve built <span className="arrow">↓</span>
              </a>

              <ExternalLink href="https://github.com/Dev-Venom">
                GitHub
              </ExternalLink>
            </div>
          </div>

          <div
            className="hero-visual reveal"
            aria-label="Kumaravel portrait with interactive 3D sculpture"
          >
            <ChromeSculpture motion={motion} />

            <figure className="portrait-card">
              <img
                src={asset("profile-hoodie.png")}
                alt="Kumaravel wearing a dark hoodie"
                fetchPriority="high"
              />
              <figcaption className="portrait-caption">
                <span>Kumaravel</span>
                <span>Developer · India</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <div className="hero-footer shell">
          <span>Yes, there’s more. Keep scrolling.</span>
          <a href="#intro" aria-label="Continue to introduction">
            ↓
          </a>
        </div>

        <section className="section shell" id="intro">
          <header className="section-heading reveal">
            <p className="section-label">
              <span>01</span> So, what do I actually do?
            </p>
            <h2>Backend first. Pretty screens are a nice bonus.</h2>
          </header>

          <div className="intro-grid reveal">
            <p>
              I’m a Computer Science and Business Systems graduate building my
              career around Java and backend engineering. I started with Core
              Java, JDBC and Servlets, moved into Spring Boot, REST APIs,
              authentication and React, and I’m now learning the parts that make
              backend systems reliable when they grow beyond CRUD.
            </p>

            <div>
              <p>
                I like understanding why something works instead of collecting
                frameworks until LinkedIn runs out of space.
              </p>
              <a className="text-link" href="#work">
                Meet the projects →
              </a>
            </div>
          </div>
        </section>

        <section className="section section-dark" id="work">
          <div className="shell">
            <header className="section-heading reveal">
              <p className="section-label">
                <span>02</span> Things that actually run
              </p>
              <h2>Built things. Broke things. Fixed most of them.</h2>
              <p className="section-subtext">
                Three completed projects that show different parts of how I
                build. CodePulse stays in the Lab until it genuinely earns
                featured-project status.
              </p>
            </header>

            <div className="project-list">
              {projects.map((project) => (
                <article
                  className={`project project--${project.id} reveal`}
                  key={project.id}
                >
                  <div className="project-meta">
                    <span>{project.number}</span>
                    <p>{project.type}</p>
                    <span className="project-status">● {project.status}</span>
                  </div>

                  <div className="project-grid">
                    <div className="project-copy">
                      <h3>{project.title}</h3>
                      <p className="project-intro">{project.intro}</p>
                      <p className="project-description">
                        {project.description}
                      </p>

                      <div className="project-detail">
                        <p className="micro-label">What it includes</p>
                        <ul className="feature-list">
                          {project.features.map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="project-detail">
                        <p className="micro-label">Built with</p>
                        <p className="stack-line">{project.stack}</p>
                      </div>

                      <p className="project-takeaway">{project.takeaway}</p>
                      <p className="project-fun">{project.fun}</p>

                      <div className="project-links">
                        {project.links.map((link) => (
                          <ExternalLink key={link.href} href={link.href}>
                            {link.label}
                          </ExternalLink>
                        ))}
                      </div>
                    </div>

                    <div className="project-visual">
                      <div className="project-frame">
                        <img
                          src={asset(project.image)}
                          alt={project.imageAlt}
                          loading="lazy"
                        />
                      </div>
                      <p>{project.title} / selected work</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section shell" id="about">
          <header className="section-heading reveal">
            <p className="section-label">
              <span>03</span> The human causing all of this
            </p>
            <h2>Started with Java. Kept asking, “but how does it work?”</h2>
          </header>

          <div className="about-grid reveal">
            <div className="about-copy">
              <p>
                I’m Kumaravel Saravanan, a Computer Science and Business Systems
                graduate focused on Java backend and full-stack development.
              </p>
              <p>
                Pour d’Or gave me the Java web foundation: JDBC, Servlets, JSP,
                DAO architecture and MySQL. Career Tracker pushed that into
                Spring Boot, REST APIs, security, JWT, React and analytics.
              </p>
              <p>
                Now CodePulse is the project I’m using to learn what comes after
                ordinary CRUD: webhooks, reliable processing, PostgreSQL,
                event-driven thinking, testing, containers and CI.
              </p>
              <p className="about-fun">
                Basically, every time I understand one layer, I discover three
                more underneath it. Very efficient.
              </p>
            </div>

            <aside className="about-statement">
              <span>Current direction</span>
              <strong>Java backend engineering with product sense.</strong>
              <p>
                I care about the architecture underneath and the experience
                people touch on top of it.
              </p>
            </aside>
          </div>

          <div className="journey reveal">
            <p className="micro-label">The route so far</p>
            <div className="journey-list">
              {journey.map((item) => (
                <article key={item.number}>
                  <span>{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.stack}</p>
                  <small>{item.note}</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section lab-section" id="lab">
          <div className="shell">
            <div className="lab-header reveal">
              <div>
                <p className="section-label">
                  <span>04</span> Currently breaking
                </p>
                <p className="lab-status">
                  <span aria-hidden="true" /> System in development
                </p>
                <h2>CodePulse is where things stop being CRUD.</h2>
              </div>

              <p>
                A backend-first developer observability and CI intelligence
                project. It stays here in the Lab while I build the features for
                real.
              </p>
            </div>

            <div className="codepulse-grid reveal">
              <article className="codepulse-card codepulse-card--main">
                <div>
                  <p className="micro-label">The idea</p>
                  <h3>
                    Receive GitHub events, verify them, process them reliably
                    and turn them into useful engineering metrics.
                  </h3>
                </div>
                <p>
                  The goal is not to collect technologies. The goal is to move
                  from ordinary CRUD APIs toward a system where webhooks,
                  security, asynchronous processing, analytics and failure
                  handling all have a reason to exist.
                </p>
              </article>

              <article className="codepulse-card">
                <p className="micro-label">Current</p>
                <h3>Foundation</h3>
                <p>
                  Java 17 · Spring Boot 3 · Maven · HTTP/REST · Swagger/OpenAPI
                  · testing foundations
                </p>
              </article>

              <article className="codepulse-card">
                <p className="micro-label">Next</p>
                <h3>Persistence & GitHub</h3>
                <p>
                  PostgreSQL · JPA/Hibernate · Flyway · repository management ·
                  webhooks · HMAC verification
                </p>
              </article>

              <article className="codepulse-card">
                <p className="micro-label">Later</p>
                <h3>Reliable processing</h3>
                <p>
                  Kafka · Redis · InfluxDB · Testcontainers · Docker · GitHub
                  Actions
                </p>
              </article>

              <article className="codepulse-card">
                <p className="micro-label">Optional after MVP</p>
                <h3>Deployment learning</h3>
                <p>
                  Kubernetes — only after the Docker-based backend genuinely
                  works.
                </p>
              </article>
            </div>

            <div className="lab-rule reveal">
              <span>Build rule</span>
              <p>Learn → Document → Implement → Test → Commit → Revise.</p>
              <small>
                If I cannot explain why a technology exists in CodePulse, it
                does not get added yet.
              </small>
            </div>

            <div className="drawing-board reveal">
              <div>
                <p className="micro-label">On the drawing board</p>
                <h3>Industrial Drone Gas Monitoring Platform</h3>
              </div>
              <p>
                A future mission-control platform for hazardous-gas readings,
                drone telemetry, alerts, mission history and environmental
                analytics. Planned direction: Spring Boot · React + TypeScript ·
                PostgreSQL · MQTT.
              </p>
              <span className="planned-badge">Planned</span>
            </div>

            <div className="playground reveal">
              <div className="playground-heading">
                <div>
                  <p className="micro-label">Side quests</p>
                  <h3>Not everything needs seventeen architecture diagrams.</h3>
                </div>
                <p>
                  Smaller experiments where I explore frontend ideas, APIs and
                  browser experiences.
                </p>
              </div>

              <div className="playground-grid">
                <article className="side-project">
                  <div className="side-project-image">
                    <img
                      src={asset("project-astroverse.png")}
                      alt="AstroVerse astronomy website"
                      loading="lazy"
                    />
                  </div>
                  <p className="micro-label">React · NASA APIs</p>
                  <h4>AstroVerse</h4>
                  <p>
                    An interactive astronomy experience covering NASA imagery,
                    the ISS, cosmic theories, timelines, galleries and black
                    holes.
                  </p>
                  <ExternalLink href="https://astro-stellar-verse.vercel.app/">
                    Launch AstroVerse
                  </ExternalLink>
                </article>

                <article className="side-project">
                  <div className="focus-preview" aria-hidden="true">
                    <span>FOCUS / TAB</span>
                    <strong>One tab. Less chaos.</strong>
                    <div>
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                  <p className="micro-label">Chrome extension</p>
                  <h4>Focus Tab</h4>
                  <p>
                    A productivity-focused browser workspace built to make a new
                    tab slightly more useful than opening another distraction.
                  </p>
                  <span className="quiet-link">Workspace project</span>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="section notes-section" id="notes">
          <div className="shell">
            <header className="section-heading reveal">
              <p className="section-label">
                <span>05</span> Notes from the damage
              </p>
              <h2>Build. Break. Figure out why.</h2>
              <p className="section-subtext">
                Projects show the result. These notes are where I explain what I
                learned while getting there.
              </p>
            </header>

            <div className="notes-list reveal">
              {notes.map((note) => (
                <article className="note" key={note.number}>
                  <span className="note-number">{note.number}</span>

                  <div>
                    <p className="micro-label">{note.category}</p>
                    <h3>{note.title}</h3>
                    <p>{note.summary}</p>
                    {note.href && (
                      <ExternalLink className="note-link" href={note.href}>
                        Read article
                      </ExternalLink>
                    )}
                  </div>

                  <span className="note-status">{note.status}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section shell" id="capabilities">
          <header className="section-heading reveal">
            <p className="section-label">
              <span>06</span> Things I can currently defend in an interview
            </p>
            <h2>Skills backed by projects, not decorative progress bars.</h2>
          </header>

          <div className="capabilities-grid reveal">
            {capabilities.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.skills}</p>
                <small>{item.evidence}</small>
              </article>
            ))}
          </div>

          <blockquote className="skills-quote reveal">
            I don’t collect technologies. If a project doesn’t need Kafka, I’m
            not adding Kafka just so the README looks expensive.
          </blockquote>
        </section>

        <section className="section support-section">
          <div className="shell support-grid reveal">
            <div>
              <p className="micro-label">Experience</p>
              <h2>Software Development Intern</h2>
              <p className="support-strong">Tap Academy</p>
              <p>
                Worked with Java web development concepts and applied them while
                building a database-backed application using Java, JDBC,
                Servlets, JSP, DAO architecture and MySQL.
              </p>
            </div>

            <div className="support-side">
              <article>
                <p className="micro-label">Education</p>
                <h3>B.E. Computer Science and Business Systems</h3>
                <p>Excel Engineering College</p>
              </article>

              <article>
                <p className="micro-label">Certifications</p>
                <h3>Walmart USA · Advanced Software Engineering Simulation</h3>
                <p>AWS · Solutions Architecture Virtual Job Simulation</p>
                <p>GitHub · Github Foundations</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <div className="shell reveal">
            <p className="availability availability--contact">
              <span aria-hidden="true" />
              Available for opportunities
            </p>

            <div className="contact-grid">
              <div>
                <p className="contact-small">
                  Junior Java role? Backend problem? Interesting product?
                </p>
                <h2>Give me a problem worth debugging.</h2>
              </div>

              <div className="contact-links">
                <a
                  className="contact-email"
                  href="mailto:kumaravel007650@gmail.com"
                >
                  kumaravel007650@gmail.com
                </a>

                <div>
                  <ExternalLink href="https://github.com/Dev-Venom">
                    GitHub
                  </ExternalLink>
                  <ExternalLink href="https://www.linkedin.com/in/kumaravel-saravanan/">
                    LinkedIn
                  </ExternalLink>
                </div>

                <p>
                  Preferably Java. But I’ve made questionable technology
                  decisions before.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer shell">
        <div>
          <strong>Kumaravel Saravanan</strong>
          <span>Java Full-Stack Developer</span>
        </div>

        <p>India · Open to on-site and remote opportunities</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </div>
  );
}
