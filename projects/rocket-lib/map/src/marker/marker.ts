import { Directive, effect, inject, input } from '@angular/core';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { RocketMapRef } from '../map-ref';

/** MapLibre source and layer IDs must be unique within a map. */
let nextMarkerId = 0;

/** Renders one GeoJSON point as a circle layer in its containing rocket-map. */
@Directive({
  selector: 'rocket-marker',
})
export class RocketMarker {
  /** Point coordinates as [longitude, latitude]. */
  readonly coordinates = input.required<[longitude: number, latitude: number]>();

  /** Circle fill color. */
  readonly color = input('#dc2626');

  /** Circle radius in pixels. */
  readonly radius = input(7);

  private readonly mapRef = inject(RocketMapRef);

  private readonly sourceId = `rocket-marker-source-${nextMarkerId++}`;
  private readonly layerId = `${this.sourceId}-layer`;

  constructor() {
    // Register each marker's resources against the current map instance.
    effect((onCleanup) => {
      const map = this.mapRef.map();
      if (!map) {
        return;
      }

      // Register the layer as soon as the style is ready; waiting for `load`
      // would also wait for the first fully rendered frame and its tile requests.
      const addLayer = () => this.addLayerWhenReady(map);
      if (map.isStyleLoaded()) {
        addLayer();
      } else {
        map.once('style.load', addLayer);
      }

      // Remove the listener and resources when the map changes or this directive is destroyed.
      onCleanup(() => {
        map.off('style.load', addLayer);
        this.removeLayer(map);
      });
    });

    effect(() => {
      const map = this.mapRef.map();
      const coordinates = this.coordinates();
      const source = map?.getSource(this.sourceId);

      if (source?.type === 'geojson') {
        (source as GeoJSONSource).setData(this.toFeature(coordinates));
      }
    });

    effect(() => {
      const map = this.mapRef.map();
      const color = this.color();
      const radius = this.radius();

      if (map?.getLayer(this.layerId)) {
        map.setPaintProperty(this.layerId, 'circle-color', color);
        map.setPaintProperty(this.layerId, 'circle-radius', radius);
      }
    });
  }

  /** Adds the point source and circle layer once the style is ready. */
  private addLayerWhenReady(map: MapLibreMap): void {
    if (map.getSource(this.sourceId)) {
      return;
    }

    map.addSource(this.sourceId, {
      type: 'geojson',
      data: this.toFeature(this.coordinates()),
    });
    map.addLayer({
      id: this.layerId,
      type: 'circle',
      source: this.sourceId,
      paint: {
        'circle-color': this.color(),
        'circle-radius': this.radius(),
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });
  }

  /** Removes the layer before its source, as required by MapLibre. */
  private removeLayer(map: MapLibreMap): void {
    if (map.getLayer(this.layerId)) {
      map.removeLayer(this.layerId);
    }
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
  }

  private toFeature(coordinates: [longitude: number, latitude: number]) {
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates,
      },
      properties: {},
    };
  }
}
