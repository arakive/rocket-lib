import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import type { Map as MapLibreMap, MapOptions } from 'maplibre-gl';
import { RocketMapRef } from '../map-ref';

@Component({
  selector: 'rocket-map',
  template: `
    <div #viewport class="rocket-map__viewport" role="region" aria-label="Mapa interactivo"></div>
    <div class="rocket-map__layers"><ng-content /></div>
  `,
  styleUrl: './map.css',
  providers: [RocketMapRef],
  host: {
    class: 'rocket-map',
  },
})
export class RocketMap implements OnDestroy {
  readonly center = input<[longitude: number, latitude: number]>([0, 0]);
  readonly zoom = input(2);
  readonly mapStyle = input('https://demotiles.maplibre.org/style.json');
  readonly showNavigationControl = input(true);
  readonly workerUrl = input('assets/maplibre-gl-worker.mjs');

  private readonly viewport = viewChild.required<ElementRef<HTMLDivElement>>('viewport');
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly mapRef = inject(RocketMapRef);
  private map: MapLibreMap | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private destroyed = false;

  constructor() {
    afterNextRender(() => void this.initializeMap());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.mapRef.map.set(null);
    this.map?.remove();
    this.map = null;
  }

  private async initializeMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.destroyed) {
      return;
    }

    const { Map, NavigationControl, setWorkerUrl } = await import('maplibre-gl');
    if (this.destroyed) {
      return;
    }

    // MapLibre GL JS v6 needs its ESM worker URL explicitly configured when bundled.
    setWorkerUrl(new URL(this.workerUrl(), this.document.baseURI).toString());

    const options: MapOptions = {
      container: this.viewport().nativeElement,
      style: this.mapStyle(),
      center: this.center(),
      zoom: this.zoom(),
      fadeDuration: 0,
    };

    this.map = new Map(options);
    if (this.showNavigationControl()) {
      this.map.addControl(new NavigationControl(), 'top-right');
    }
    this.mapRef.map.set(this.map);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.map?.resize());
      this.resizeObserver.observe(this.viewport().nativeElement);
    }
  }
}
