import { Injectable, signal } from '@angular/core';
import type { Map } from 'maplibre-gl';

/** Shared map instance for projected map layers. */
@Injectable()
export class RocketMapRef {
  readonly map = signal<Map | null>(null);
}
