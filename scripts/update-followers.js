const fs = require("fs");
const axios = require("axios");

const USERNAME = "dinhdc1111";
const PER_PAGE = 100;
const MAX_FOLLOWERS = 42;
const MAX_NAME_LENGTH = 10;

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + "…" : str;
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
  const columns = 8;
  let rows = [];

  for (let i = 0; i < followers.length; i += columns) {
    const chunk = followers.slice(i, i + columns);

    const filledChunk = [...chunk];
    while (filledChunk.length < columns) {
      filledChunk.push(null);
    }

    const row = filledChunk
      .map((f) =>
        f
          ? `\n<td align="center" valign="top" width="12.5%">\n  <a href="${f.html_url}">\n    <img src="${f.avatar_url}" width="60" alt="${f.login}"/><br />\n    <sub><b>${truncate(f.login, MAX_NAME_LENGTH)}</b></sub>\n  </a>\n</td>`
          : `\n<td align="center" valign="top" width="12.5%"></td>`
      )
      .join("");

    rows.push(`<tr>${row}</tr>`);
  }

  return `<table>\n${rows.join("\n")}\n</table>`;
}

function replaceSection(readme, tableHTML) {
  const start = "<!-- FOLLOWERS:START -->";
  const end = "<!-- FOLLOWERS:END -->";

  const regex = new RegExp(
    `${start}[\\s\\S]*?${end}`,
    "m"
  );

  return readme.replace(
    regex,
    `${start}\n${tableHTML}\n${end}`
  );
}

async function main() {
  const followers = await getFollowers();
  const tableHTML = generateTable(followers);

  const readme = fs.readFileSync("README.md", "utf-8");
  const updated = replaceSection(readme, tableHTML);

  fs.writeFileSync("README.md", updated);
}

main().catch(console.error);