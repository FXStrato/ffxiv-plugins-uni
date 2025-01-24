const fs = require("node:fs");
const https = require("node:https");

const REPOS = [
	"https://plugins.carvel.li",
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
	"https://raw.githubusercontent.com/Penumbra-Sync/repo/main/plogonmaster.json",
	"https://raw.githubusercontent.com/UnknownX7/DalamudPluginRepo/master/pluginmaster.json",
	"https://raw.githubusercontent.com/jawslouis/MakePlacePlugin/master/MakePlacePlugin.json",
	"https://raw.githubusercontent.com/lichie567/LMeter/main/repo.json",
	"https://raw.githubusercontent.com/marzent/IINACT/main/repo.json",
	"https://raw.githubusercontent.com/paissaheavyindustries/Dalamud-Repo/main/repo.json",
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

function getJson(url) {
	return new Promise((resolve, reject) => {
		let data = "";
		https
			.get(url, (resp) => {
				if (resp.statusCode !== 200) {
					reject(new Error(`Failed to fetch ${url}: ${resp.statusCode}`));
				}

				resp.on("data", (chunk) => {
					data += chunk;
				});

				resp.on("end", () => {
					try {
						resolve(JSON.parse(data));
					} catch (err) {
						reject(
							new Error(`Failed to parse JSON from ${url}: ${err.message}`),
						);
					}
				});
			})
			.on("error", (err) => {
				reject(err);
			});
	});
}

async function fetchPlugins() {
	let allPlugins = [];

	for (const repo of REPOS) {
		try {
			const response = await getJson(repo);
			if (response) {
				if (Array.isArray(response)) {
					allPlugins = allPlugins.concat(response);
				} else {
					allPlugins.push(response);
				}
				console.log(`Added ${response.length} plugin(s) from ${repo}`);
			} else {
				console.error(`Failed to fetch ${repo}: ${response}`);
			}
		} catch (error) {
			console.error(`Error fetching ${repo}: ${error}`);
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
					unique.get(pluginName).AssemblyVersion,
				) > 0
			) {
				console.log(
					`Found duplicate, updating ${pluginName} from ${unique.get(pluginName).AssemblyVersion} to ${plugin.AssemblyVersion}`,
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
