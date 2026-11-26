import {
  booleanAttribute,
  contentChild,
  Directive,
  effect,
  EmbeddedViewRef,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import type { FeatureCollection } from 'geojson';
import {
  LngLatLike,
  MapLayerMouseEvent,
  Popup,
  type GeoJSONSource,
  type Map as MapLibreMap,
} from 'maplibre-gl';
import { RocketMapRef } from '../map-ref';

let nextMarkerGroupId = 0;

@Directive({
  selector: 'rocket-marker-group',
})
export class RocketMarkerGroup {
  private readonly mapRef = inject(RocketMapRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  readonly popupTmp = contentChild<TemplateRef<unknown>>('popup');
  readonly geojson = input.required<FeatureCollection>();
  private readonly popups = new Map<string, Popup>();

  /** Wether if you want to have more than 1 popup opened */
  readonly multiplePopup = input(false, { transform: booleanAttribute });

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
        promoteId: 'id',
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

    const source = map.getSource(this.sourceId);
    if (source?.type === 'geojson') {
      const bounds = await (source as GeoJSONSource).getBounds();

      if (!bounds.isEmpty() && this.mapRef.map() === map) {
        map.fitBounds(bounds, { padding: 40, duration: 1500 });
      }
    }
  }

  private handleMarkerClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    const geometry = feature?.geometry;
    const map = this.mapRef.map();
    const template = this.popupTmp();

    if (!template || !map || !feature || geometry?.type !== 'Point') {
      return;
    }

    const id = String(feature.id);
    if (this.multiplePopup() && this.popups.has(id)) {
      return;
    }

    const view = this.viewContainerRef.createEmbeddedView(template, {
      $implicit: feature.properties,
    });
    const content = document.createElement('div');
    for (const node of view.rootNodes) {
      content.append(node);
    }

    const popup = new Popup({
      anchor: 'bottom',
      offset: [0, -(this.radius() + 8)],
      closeOnClick: !this.multiplePopup(),
    })
      .setLngLat(geometry.coordinates as LngLatLike)
      .setDOMContent(content)
      .addTo(map);

    if (this.multiplePopup()) {
      this.setPopupAndCloseMethod(id, popup, view);
    }
  };

  private setPopupAndCloseMethod(id: string, popup: Popup, view: EmbeddedViewRef<unknown>) {
    this.popups.set(id, popup);

    popup.on('close', () => {
      this.popups.delete(id);
      view.destroy();
    });
  }

  private removeLayer(map: MapLibreMap): void {
    for (const popup of this.popups.values()) {
      popup.remove();
    }
    this.popups.clear();

    if (map.getLayer(this.layerId)) {
      map.removeLayer(this.layerId);
    }
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
  }
}
