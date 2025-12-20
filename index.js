const fs = require("node:fs");
const https = require("node:https");

const REPOS = [
  "https://aetherment.sevii.dev/plugin",
  "https://puni.sh/api/plugins",
  "https://puni.sh/api/repository/croizat",
  "https://puni.sh/api/repository/herc",
  "https://puni.sh/api/repository/kawaii",
  "https://puni.sh/api/repository/veyn",
  "https://raw.githubusercontent.com/Aether-Tools/DalamudPlugins/main/repo.json",
  "https://raw.githubusercontent.com/Aireil/MyDalamudPlugins/master/pluginmaster.json",
  "https://raw.githubusercontent.com/Eternita-S/MyDalamudPlugins/main/pluginmaster.json",
  "https://raw.githubusercontent.com/Etheirys/Brio/main/repo.json",
  "https://raw.githubusercontent.com/FFXIV-CombatReborn/CombatRebornRepo/main/pluginmaster.json",
  "https://raw.githubusercontent.com/KangasZ/DalamudPluginRepository/refs/heads/main/plugin_repository.json",
  "https://raw.githubusercontent.com/NightmareXIV/MyDalamudPlugins/main/pluginmaster.json",
  "https://raw.githubusercontent.com/Ottermandias/Glamourer/main/repo.json",
  "https://raw.githubusercontent.com/UnknownX7/DalamudPluginRepo/master/pluginmaster.json",
  "https://raw.githubusercontent.com/jawslouis/MakePlacePlugin/master/MakePlacePlugin.json",
  "https://raw.githubusercontent.com/lichie567/LMeter/main/repo.json",
  "https://raw.githubusercontent.com/marzent/IINACT/main/repo.json",
  "https://raw.githubusercontent.com/paissaheavyindustries/Dalamud-Repo/main/repo.json",
  "https://raw.githubusercontent.com/reckhou/DalamudPlugins-Ori/api6/pluginmaster.json",
  "https://repo.caraxian.com",
];

function compareVersions(v1, v2) {
  const v1Parts = v1.split(".");
  const v2Parts = v2.split(".");

  const maxLength = Math.max(v1Parts.length, v2Parts.length);

  for (let i = 0; i < maxLength; i++) {
    const v1Part = Number.parseInt(v1Parts[i] || "0", 10);
    const v2Part = Number.parseInt(v2Parts[i] || "0", 10);

    if (v1Part !== v2Part) {
      return v1Part > v2Part ? 1 : -1;
    }
  }

  return 0;
}

async function getJson(url) {
  const response = await fetch(url);

  // This specific url is text; need to parse it as JSON after getting it as text
  if (url === "https://repo.caraxian.com") {
    const text = await response.text();
    return JSON.parse(text);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Failed to parse JSON from ${url}: ${err.message}`);
  }
}

async function fetchPlugins() {
  let allPlugins = [];

  const results = await Promise.allSettled(
    REPOS.map((repo) => getJson(repo).then((response) => ({ repo, response })))
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { repo, response } = result.value;
      if (response) {
        if (Array.isArray(response)) {
          allPlugins = allPlugins.concat(response);
          console.log(`Added ${response.length} plugin(s) from ${repo}`);
        } else {
          allPlugins.push(response);
          console.log(`Added 1 plugin from ${repo}`);
        }
      }
    } else {
      console.error(`Error fetching: ${result.reason}`);
    }
  }

  // Remove duplicates if there are any
  const unique = new Map();
  for (const plugin of allPlugins) {
    const pluginName = plugin.Name;
    if (unique.has(pluginName)) {
      // Check if the version is higher, and if so, replace the current one
      if (
        compareVersions(
          plugin.AssemblyVersion,
          unique.get(pluginName).AssemblyVersion
        ) > 0
      ) {
        console.log(
          `Found duplicate, updating ${pluginName} from ${
            unique.get(pluginName).AssemblyVersion
          } to ${plugin.AssemblyVersion}`
        );
        unique.set(pluginName, plugin);
      }
    } else {
      unique.set(pluginName, plugin);
    }
  }

  allPlugins = Array.from(unique.values());

  allPlugins.sort((a, b) => a.Name.localeCompare(b.Name));
  fs.writeFileSync("repo.json", JSON.stringify(allPlugins, null, 2));
}

fetchPlugins();
