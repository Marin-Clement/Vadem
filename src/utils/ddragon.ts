import { useState, useEffect } from "react";

interface DDragonCache {
  version: string;
  champByName: Record<string, string>; // lowercase name/id → DDragon champion id
  itemByName: Record<string, string>;  // lowercase name → DDragon item id string
}

let cache: DDragonCache | null = null;

export async function getDDragon(): Promise<DDragonCache> {
  if (cache) return cache;

  const verRes = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
  const versions: string[] = await verRes.json();
  const version = versions[0];

  const [champData, itemData] = await Promise.all([
    fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`).then(r => r.json()),
    fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`).then(r => r.json()),
  ]);

  const champByName: Record<string, string> = {};
  for (const [id, data] of Object.entries(champData.data as Record<string, { name: string }>)) {
    champByName[data.name.toLowerCase()] = id;
    champByName[id.toLowerCase()] = id;
  }

  const itemByName: Record<string, string> = {};
  for (const [id, data] of Object.entries(itemData.data as Record<string, { name: string }>)) {
    itemByName[data.name.toLowerCase()] = id;
  }

  cache = { version, champByName, itemByName };
  return cache;
}

export function champIconUrl(version: string, champId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champId}.png`;
}

export function itemIconUrl(version: string, itemId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
}

export function resolveChampId(name: string, champByName: Record<string, string>): string {
  return champByName[name.toLowerCase()] ?? name.replace(/[^a-zA-Z0-9]/g, "");
}

export function resolveItemId(name: string, itemByName: Record<string, string>): string | null {
  return itemByName[name.toLowerCase()] ?? null;
}

export function useDDragon(): DDragonCache | null {
  const [data, setData] = useState<DDragonCache | null>(null);
  useEffect(() => { getDDragon().then(setData); }, []);
  return data;
}
