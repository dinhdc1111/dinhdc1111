const fs = require("fs");
const axios = require("axios");

const USERNAME = "dinhdc1111";
const PER_PAGE = 100;
const MAX_FOLLOWERS = 42;
const COLUMNS = 6;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function getFollowers() {
  let page = 1;
  let allFollowers = [];

  while (true) {
    const res = await axios.get(
      `https://api.github.com/users/${USERNAME}/followers`,
      {
        params: {
          per_page: PER_PAGE,
          page,
        },
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    if (res.data.length === 0) break;

    allFollowers = [...allFollowers, ...res.data];
    page++;
  }

  return allFollowers.slice(0, MAX_FOLLOWERS);
}

function generateTable(followers) {
  const rows = [];

  for (let i = 0; i < followers.length; i += COLUMNS) {
    const chunk = followers.slice(i, i + COLUMNS);

    const filledChunk = [...chunk];
    while (filledChunk.length < COLUMNS) {
      filledChunk.push(null);
    }

    const row = filledChunk
      .map((f) => {
        if (!f) {
          return `\n<td align="center" valign="top" width="16.66%"></td>`;
        }

        const login = escapeHtml(f.login);
        const profileUrl = escapeHtml(f.html_url);
        const avatarUrl = escapeHtml(f.avatar_url);

        return `\n<td align="center" valign="top" width="16.66%">\n  <br />\n  <a href="${profileUrl}">\n    <img src="${avatarUrl}" width="72" height="72" alt="${login}'s GitHub avatar" loading="lazy" />\n  </a>\n  <br />\n  <a href="${profileUrl}"><strong>@${login}</strong></a>\n  <br />\n  <sub>View profile &#8599;</sub>\n  <br />&nbsp;\n</td>`;
      })
      .join("");

    rows.push(`<tr>${row}</tr>`);
  }

  return `<table width="100%">\n${rows.join("\n")}\n</table>`;
}

function generateSection(followers) {
  const table = generateTable(followers);

  return `<div align="center">
  <p><strong>People who make the journey better</strong></p>
  <p>
    A small wall for the developers and makers following my work.<br />
    <sub>Automatically refreshed every 6 hours.</sub>
  </p>
  <a href="https://github.com/${USERNAME}?tab=followers">
    <img src="https://img.shields.io/github/followers/${USERNAME}?style=for-the-badge&amp;logo=github&amp;label=Community&amp;color=0d9488" alt="GitHub followers" />
  </a>
</div>

<br />

${table}`;
}

function replaceSection(readme, sectionHTML) {
  const start = "<!-- FOLLOWERS:START -->";
  const end = "<!-- FOLLOWERS:END -->";

  const regex = new RegExp(
    `${start}[\\s\\S]*?${end}`,
    "m"
  );

  return readme.replace(
    regex,
    `${start}\n${sectionHTML}\n${end}`
  );
}

async function main() {
  const followers = await getFollowers();
  const sectionHTML = generateSection(followers);

  const readme = fs.readFileSync("README.md", "utf-8");
  const updated = replaceSection(readme, sectionHTML);

  fs.writeFileSync("README.md", updated);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  escapeHtml,
  generateSection,
  generateTable,
  replaceSection,
};
