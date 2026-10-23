'use client';
import { useEffect, useState } from 'react';
import * as topojson from 'topojson-client';
import type { Feature, Geometry } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';

export type Country = Feature<Geometry, { name: string }>;

let cache: Country[] | null = null;
let pending: Promise<Country[]> | null = null;

export function loadWorld(): Promise<Country[]> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch('/world/countries-110m.json')
      .then(r => r.json())
      .then((world: Topology<{ countries: GeometryCollection<{ name: string }> }>) => {
        const fc = topojson.feature(world, world.objects.countries);
        cache = (fc.features as Country[]).filter(f => f.properties.name !== 'Antarctica');
        return cache;
      });
  }
  return pending;
}

export function useWorld(): Country[] | null {
  const [w, setW] = useState<Country[] | null>(cache);
  useEffect(() => { let on = true; loadWorld().then(c => { if (on) setW(c); }); return () => { on = false; }; }, []);
  return w;
}
