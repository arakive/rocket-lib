import type { FeatureCollection, LineString, Point } from 'geojson';
import { PeriodicElement } from '../models/periodic-element.interface';

export interface GironaPlaceProperties {
  id: string;
  name: string;
  category: 'monument' | 'bridge' | 'park';
  description: string;
}

/** Approximate public landmark locations in Girona, for map examples. */
export const MOCK_FEATURE_COLLECTION: FeatureCollection<Point, GironaPlaceProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'girona-cathedral',
      geometry: { type: 'Point', coordinates: [2.8269, 41.9871] },
      properties: {
        id: 'girona-cathedral',
        name: 'Catedral de Girona',
        category: 'monument',
        description: 'Catedral de Santa Maria, al Barri Vell.',
      },
    },
    {
      type: 'Feature',
      id: 'arab-baths',
      geometry: { type: 'Point', coordinates: [2.8259, 41.9881] },
      properties: {
        id: 'arab-baths',
        name: 'Banys Arabs',
        category: 'monument',
        description: 'Historic public baths in Girona.',
      },
    },
    {
      type: 'Feature',
      id: 'eiffel-bridge',
      geometry: { type: 'Point', coordinates: [2.8246, 41.9838] },
      properties: {
        id: 'eiffel-bridge',
        name: 'Pont de les Peixateries Velles',
        category: 'bridge',
        description: 'Metal bridge also known as the Eiffel Bridge.',
      },
    },
    {
      type: 'Feature',
      id: 'sant-feliu-basilica',
      geometry: { type: 'Point', coordinates: [2.8231, 41.9851] },
      properties: {
        id: 'sant-feliu-basilica',
        name: 'Basilica de Sant Feliu',
        category: 'monument',
        description: 'Historic basilica in the old town.',
      },
    },
    {
      type: 'Feature',
      id: 'devesa-park',
      geometry: { type: 'Point', coordinates: [2.8157, 41.9855] },
      properties: {
        id: 'devesa-park',
        name: 'Parc de la Devesa',
        category: 'park',
        description: 'Large public park in Girona.',
      },
    },
  ],
};

export const MOCK_LINE_GEOJSON: FeatureCollection<LineString, unknown> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { color: '#e63946' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [2.8269, 41.9871],
          [2.8259, 41.9881],
          [2.8246, 41.9838],
          [2.8231, 41.9851],
        ],
      },
    },
  ],
};

export const MOCK_LINE_GEOJSON_2: FeatureCollection<LineString, unknown> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { color: '#457b9d' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [2.829, 41.989],
          [2.8269, 41.9871],
          [2.8259, 41.9881],
          [2.8246, 41.9838],
          [2.8231, 41.9851],
          [2.819, 41.986],
          [2.8157, 41.9855],
        ],
      },
    },
  ],
};

export const ELEMENT_DATA: PeriodicElement[] = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];
