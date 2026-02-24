const fs = require("fs");
const axios = require("axios");

const USERNAME = "dinhdc1111";
const PER_PAGE = 100;
const MAX_FOLLOWERS = 42;

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
  const columns = 7;
  let rows = [];

  for (let i = 0; i < followers.length; i += columns) {
    const chunk = followers.slice(i, i + columns);

    const row = chunk
      .map(
        (f) => `
<td align="center" valign="top" width="14.28%">
  <a href="${f.html_url}">
    <img src="${f.avatar_url}" width="60" alt="${f.login}"/><br />
    <sub><b>${f.login}</b></sub>
  </a>
</td>`
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