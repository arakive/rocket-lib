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
import type { LayerConfig } from '../models/layer.interface';

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

  /** Optional advanced MapLibre layer configuration. */
  readonly layer = input<LayerConfig>();

  /** Wether if you want to have more than 1 popup opened */
  readonly multiplePopup = input(false, { transform: booleanAttribute });

  /** Circle fill color used when no advanced layer is provided. */
  readonly color = input('#dc2626');
  /** Circle radius in pixels, used when no advanced layer is provided. */
  readonly radius = input(7);
  readonly popupOffset = input(15);

  /** Wether if you want to have clusters or not */
  readonly cluster = input(false, { transform: booleanAttribute });

  /** Radius of the cluster */
  readonly clusterRadius = input(50);

  private readonly sourceId = `rocket-marker-group-source-${nextMarkerGroupId++}`;
  private readonly layerId = `${this.sourceId}-layer`;
  private readonly clusterLayerId = `${this.sourceId}-cluster`;

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
      const color = this.color();
      const radius = this.radius();

      if (map?.getLayer(this.layerId) && !this.layer()) {
        map.setPaintProperty(this.layerId, 'circle-color', color);
        map.setPaintProperty(this.layerId, 'circle-radius', radius);
      }
    });
  }

  private async addLayerWhenReady(map: MapLibreMap) {
    if (!map.getSource(this.sourceId)) {
      map.addSource(this.sourceId, {
        type: 'geojson',
        data: this.geojson(),
        promoteId: 'id',
        cluster: this.cluster(),
        clusterRadius: this.clusterRadius(),
      });
    }

    if (this.cluster() && !map.getLayer(this.clusterLayerId)) {
      this.addClusterLayers(map);
    }

    if (!map.getLayer(this.layerId)) {
      const layerConfig = this.layer() ?? {
        type: 'circle' as const,
        filter: ['!', ['has', 'point_count']] as ['!', ['has', string]],
        paint: {
          'circle-color': this.color(),
          'circle-radius': this.radius(),
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      };
      const { image, ...mapLayerConfig } = layerConfig as LayerConfig & {
        image?: { id: string; url: string };
      };
      if (image && !map.hasImage(image.id)) {
        const { data } = await map.loadImage(image.url);
        map.addImage(image.id, data);
      }

      const layer = {
        ...mapLayerConfig,
        id: this.layerId,
        source: this.sourceId,
      };
      map.addLayer(layer);
    }

    map.off('click', this.layerId, this.handleMarkerClick);
    map.on('click', this.layerId, this.handleMarkerClick);
    if (this.cluster()) {
      map.off('click', this.clusterLayerId, this.handleClusterClick);
      map.on('click', this.clusterLayerId, this.handleClusterClick);
      map.off('mouseenter', this.clusterLayerId, this.handleMarkerMouseEnter);
      map.off('mouseleave', this.clusterLayerId, this.handleMarkerMouseLeave);
      map.on('mouseenter', this.clusterLayerId, this.handleMarkerMouseEnter);
      map.on('mouseleave', this.clusterLayerId, this.handleMarkerMouseLeave);
    }

    const source = map.getSource(this.sourceId);
    if (source?.type === 'geojson') {
      const bounds = await (source as GeoJSONSource).getBounds();

      if (!bounds.isEmpty() && this.mapRef.map() === map) {
        map.fitBounds(bounds, { padding: 40, duration: 1500 });
      }
    }
  }

  private handleMarkerMouseEnter = (): void => {
    const map = this.mapRef.map();
    if (map?.getLayer(this.clusterLayerId)) {
      map.getCanvas().style.cursor = 'pointer';
    }
  };

  private handleMarkerMouseLeave = (): void => {
    const map = this.mapRef.map();
    if (map?.getLayer(this.clusterLayerId)) {
      map.getCanvas().style.cursor = '';
    }
  };

  private addClusterLayers(map: MapLibreMap) {
    map.addLayer({
      id: this.clusterLayerId,
      type: 'circle',
      source: this.sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
      },
    });

    map.addLayer({
      id: `${this.clusterLayerId}-count`,
      type: 'symbol',
      source: this.sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 12,
      },
    });
  }

  private handleClusterClick = async (event: MapLayerMouseEvent): Promise<void> => {
    const map = this.mapRef.map();
    if (!map) {
      return;
    }

    const features = map.queryRenderedFeatures(event.point, {
      layers: [this.clusterLayerId],
    });

    const feature = features[0];
    if (!feature || feature.geometry.type !== 'Point') {
      return;
    }

    const clusterId = feature.properties?.['cluster_id'];
    const source = map.getSource(this.sourceId);

    if (source?.type !== 'geojson' || typeof clusterId !== 'number') {
      return;
    }

    const zoom = await (source as GeoJSONSource).getClusterExpansionZoom(clusterId);

    if (this.mapRef.map() !== map || !map.getLayer(this.clusterLayerId)) {
      return;
    }

    map.easeTo({
      center: feature.geometry.coordinates as LngLatLike,
      zoom,
    });
  };

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
      offset: [0, -this.popupOffset()],
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

    map.off('click', this.layerId, this.handleMarkerClick);
    map.off('click', this.clusterLayerId, this.handleClusterClick);
    map.off('mouseenter', this.clusterLayerId, this.handleMarkerMouseEnter);
    map.off('mouseleave', this.clusterLayerId, this.handleMarkerMouseLeave);

    const countLayerId = `${this.clusterLayerId}-count`;
    for (const layerId of [countLayerId, this.clusterLayerId, this.layerId]) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    }
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
  }
}
