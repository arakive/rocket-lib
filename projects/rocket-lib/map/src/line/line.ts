import {
  booleanAttribute,
  contentChild,
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { FeatureCollection } from 'geojson';
import { GeoJSONSource, MapLayerMouseEvent, MapLibreMap, Popup } from 'maplibre-gl';
import { RocketMapRef } from '../map-ref';

let nextLineId = 0;

@Directive({
  selector: 'rocket-line',
})
export class RocketLine {
  private readonly mapRef = inject(RocketMapRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  readonly popupTmp = contentChild<TemplateRef<unknown>>('popup');
  /** Line coordinates as LineString */
  readonly geojson = input.required<FeatureCollection>();

  /** Line widht */
  readonly width = input(4);

  /** Wether if selectable or not */
  readonly selectable = input(false, { transform: booleanAttribute });

  private readonly sourceId = `rocket-line-source-${nextLineId}`;
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

    effect(() => {
      const map = this.mapRef.map();
      const geojson = this.geojson();
      const source = map?.getSource(this.sourceId);

      if (source?.type === 'geojson') {
        (source as GeoJSONSource).setData(geojson);
      }
    });

    effect(() => {
      const map = this.mapRef.map();
      const widht = this.width();

      if (map?.getLayer(this.layerId)) {
        map.setPaintProperty(this.layerId, 'line-width', widht);
      }
    });
  }

  private addLayerWhenReady(map: MapLibreMap) {
    if (!map.getSource(this.sourceId)) {
      map.addSource(this.sourceId, {
        type: 'geojson',
        data: this.geojson(),
      });
    }

    if (!map.getLayer(this.layerId)) {
      map.addLayer({
        id: this.layerId,
        type: 'line',
        source: this.sourceId,
        layout: { 'line-cap': 'round', 'line-join': 'round' },

        paint: {
          'line-width': this.width(),
          'line-color': ['coalesce', ['get', 'color'], '#3388ff'],
        },
      });
    }

    if (this.selectable()) {
      map.off('mouseenter', this.layerId, this.handleLineMouseEnter);
      map.off('mouseleave', this.layerId, this.handleLineMouseLeave);
      map.on('mouseenter', this.layerId, this.handleLineMouseEnter);
      map.on('mouseleave', this.layerId, this.handleLineMouseLeave);
    }

    if (this.popupTmp()) {
      map.off('click', this.layerId, this.handleLineClick);
      map.on('click', this.layerId, this.handleLineClick);
    }
  }

  private handleLineClick = (event: MapLayerMouseEvent) => {
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

    new Popup({ anchor: 'bottom' }).setLngLat(event.lngLat).setDOMContent(content).addTo(map);
  };

  private handleLineMouseEnter = () => {
    const map = this.mapRef.map();
    if (map?.getLayer(this.layerId)) {
      map.setPaintProperty(this.layerId, 'line-width', (this.width() ?? 4) + 2);
      map.getCanvas().style.cursor = 'pointer';
    }
  };

  private handleLineMouseLeave = () => {
    const map = this.mapRef.map();
    if (map?.getLayer(this.layerId)) {
      map.setPaintProperty(this.layerId, 'line-width', this.width());
      map.getCanvas().style.cursor = '';
    }
  };

  private removeLayer(map: MapLibreMap) {
    map.off('mouseenter', this.layerId, this.handleLineMouseEnter);
    map.off('mouseleave', this.layerId, this.handleLineMouseLeave);
    map.off('click', this.layerId, this.handleLineClick);

    if (map.getLayer(this.layerId)) {
      map.removeLayer(this.layerId);
    }

    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
  }
}
