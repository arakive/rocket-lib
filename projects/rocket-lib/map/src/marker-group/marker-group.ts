import { Directive, effect, inject, input } from '@angular/core';
import type { FeatureCollection } from 'geojson';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { RocketMapRef } from '../map-ref';

let nextMarkerGroupId = 0;

@Directive({
  selector: 'rocket-marker-group',
})
export class RocketMarkerGroup {
  private readonly mapRef = inject(RocketMapRef);
  readonly geojson = input.required<FeatureCollection>();

  /** Circle fill color. */
  readonly color = input('#dc2626');

  /** Circle radius in pixels. */
  readonly radius = input(7);

  private readonly sourceId = `rocket-marker-group-source-${nextMarkerGroupId++}`;
  private readonly layerId = `${this.sourceId}-layer`;

  constructor() {
    effect((onCleanup) => {
      const map = this.mapRef.map();
      if (!map) {
        return;
      }

      const addLayer = () => this.addLayerWhenReady(map);
      if (map.isStyleLoaded()) {
        addLayer();
      } else {
        map.once('style.load', addLayer);
      }

      onCleanup(() => {
        map.off('style.load', addLayer);
        this.removeLayer(map);
      });
    });
  }

  private async addLayerWhenReady(map: MapLibreMap) {
    if (!map.getSource(this.sourceId)) {
      map.addSource(this.sourceId, {
        type: 'geojson',
        data: this.geojson(),
      });
    }

    if (!map.getLayer(this.layerId)) {
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

    const source = map.getSource(this.sourceId);
    if (source?.type === 'geojson') {
      const bounds = await (source as GeoJSONSource).getBounds();

      if (!bounds.isEmpty() && this.mapRef.map() === map) {
        map.fitBounds(bounds, { padding: 40, duration: 1500 });
      }
    }
  }

  private removeLayer(map: MapLibreMap): void {
    if (map.getLayer(this.layerId)) {
      map.removeLayer(this.layerId);
    }
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
  }
}
