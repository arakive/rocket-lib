import type { TemplateRef } from '@angular/core';
import { contentChild, Directive, effect, inject, input, ViewContainerRef } from '@angular/core';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { Popup } from 'maplibre-gl';
import { RocketMapRef } from '../map-ref';

/** MapLibre source and layer IDs must be unique within a map. */
let nextMarkerId = 0;

/** Renders one GeoJSON point as a circle layer in its containing rocket-map. */
@Directive({
  selector: 'rocket-marker',
})
export class RocketMarker {
  private readonly mapRef = inject(RocketMapRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  readonly popupTmp = contentChild<TemplateRef<unknown>>('popup');

  /** Point coordinates as [longitude, latitude]. */
  readonly coordinates = input.required<[longitude: number, latitude: number]>();

  /** Circle fill color. */
  readonly color = input('#dc2626');

  /** Circle radius in pixels. */
  readonly radius = input(7);

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
    if (!map.getSource(this.sourceId)) {
      map.addSource(this.sourceId, {
        type: 'geojson',
        data: this.toFeature(this.coordinates()),
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

    map.off('click', this.layerId, this.handleMarkerClick);
    map.on('click', this.layerId, this.handleMarkerClick);
    map.off('mouseenter', this.layerId, this.handleMarkerMouseEnter);
    map.off('mouseleave', this.layerId, this.handleMarkerMouseLeave);
    map.on('mouseenter', this.layerId, this.handleMarkerMouseEnter);
    map.on('mouseleave', this.layerId, this.handleMarkerMouseLeave);
  }

  private handleMarkerMouseEnter = (): void => {
    const map = this.mapRef.map();
    if (map?.getLayer(this.layerId)) {
      map.setPaintProperty(this.layerId, 'circle-radius', this.radius() + 2);
      map.getCanvas().style.cursor = 'pointer';
    }
  };

  private handleMarkerMouseLeave = (): void => {
    const map = this.mapRef.map();
    if (map?.getLayer(this.layerId)) {
      map.setPaintProperty(this.layerId, 'circle-radius', this.radius());
      map.getCanvas().style.cursor = '';
    }
  };

  private handleMarkerClick = () => {
    const map = this.mapRef.map();
    const template = this.popupTmp();

    if (!template || !map) {
      return;
    }

    const view = this.viewContainerRef.createEmbeddedView(template);
    const content = document.createElement('div');
    for (const node of view.rootNodes) {
      content.append(node);
    }

    new Popup({ anchor: 'bottom', offset: [0, -(this.radius() + 8)] })
      .setLngLat(this.coordinates())
      .setDOMContent(content)
      .addTo(map);
  };

  /** Removes the layer before its source, as required by MapLibre. */
  private removeLayer(map: MapLibreMap): void {
    map.off('click', this.layerId, this.handleMarkerClick);
    map.off('mouseenter', this.layerId, this.handleMarkerMouseEnter);
    map.off('mouseleave', this.layerId, this.handleMarkerMouseLeave);
    map.getCanvas().style.cursor = '';

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
