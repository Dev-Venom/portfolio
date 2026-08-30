# Kumaravel Portfolio

A standalone React + Vite portfolio. This edition contains only the files required to run, edit and build the website.

## Run locally

Use Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Open the URL shown in the terminal, normally `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Essential structure

```text
Kumaravel-Portfolio/
├── public/          Hero and project images
├── src/
│   ├── App.jsx      All portfolio content and sections
│   ├── main.jsx     React entry point
│   └── styles.css   Complete visual design
├── index.html
├── package.json
└── vite.config.js
```

## Add a project

1. Put its cover image inside `public/`.
2. Open `src/App.jsx`.
3. Add another object to the `projects` array:

```jsx
{
  number: "05",
  title: "Project name",
  type: "Project category",
  image: "/project-cover.png",
  alt: "Accessible image description",
  story: "A concise explanation of the problem and solution.",
  stack: ["React", "Spring Boot"],
  links: [{ label: "Visit live project", href: "https://example.com" }],
  tone: "cosmic",
},
```

Available tones: `yellow`, `gold`, `lime`, and `cosmic`.

## Add a Field Note

Find the `notes` array in `src/App.jsx`.

Published article:

```jsx
{
  number: "004",
  category: "Spring Boot",
  title: "Article title",
  summary: "What the reader will learn.",
  status: "Published",
  href: "https://your-article-link.com",
},
```

Article still being written:

```jsx
{
  number: "005",
  category: "System Design",
  title: "Upcoming article title",
  summary: "A short preview.",
  status: "Publishing soon",
  href: null,
},
```

## Replace an image

Replace the relevant file inside `public/` while keeping the same filename. The hero image is `public/hero-007.png`.
