import type { LayerSpecification } from 'maplibre-gl';

type BaseLayerConfig<T = LayerSpecification> = T extends LayerSpecification
  ? Pick<T, 'type' | 'paint' | 'layout'>
  : never;

export type LayerConfig =
  | (Exclude<BaseLayerConfig, { type: 'symbol' }> & { image?: never })
  | (Extract<BaseLayerConfig, { type: 'symbol' }> & {
      image?: {
        id: string;
        url: string;
      };
    });
