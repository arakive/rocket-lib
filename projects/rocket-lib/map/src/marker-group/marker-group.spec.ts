import { createDirectiveFactory } from '@ngneat/spectator/vitest';
import type { FeatureCollection } from 'geojson';
import { RocketMapRef } from '../map-ref';
import { RocketMarkerGroup } from './marker-group';

describe('RocketMarkerGroup', () => {
  const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  const map = {
    isStyleLoaded: vi.fn(() => true),
    getSource: vi.fn(() => undefined),
    getLayer: vi.fn(() => undefined),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    fitBounds: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
  };

  const createDirective = createDirectiveFactory({
    directive: RocketMarkerGroup,
    template: '<rocket-marker-group [geojson]="geojson"></rocket-marker-group>',
    providers: [
      {
        provide: RocketMapRef,
        useValue: { map: () => map },
      },
    ],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    map.isStyleLoaded.mockReturnValue(true);
    map.getSource.mockReturnValue(undefined);
    map.getLayer.mockReturnValue(undefined);
  });

  it('creates the GeoJSON source and circle layer with the default styles', async () => {
    createDirective(undefined, { hostProps: { geojson } });
    await Promise.resolve();

    expect(map.addSource).toHaveBeenCalledWith(
      expect.stringMatching(/^rocket-marker-group-source-/),
      expect.objectContaining({ type: 'geojson', data: geojson, promoteId: 'id' }),
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'circle',
        paint: expect.objectContaining({
          'circle-color': '#dc2626',
          'circle-radius': 7,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        }),
      }),
    );
    expect(map.on).toHaveBeenCalledWith(
      'click',
      expect.stringMatching(/^rocket-marker-group-source-\d+-layer$/),
      expect.any(Function),
    );
  });

  it('removes its layer and source when the directive is destroyed', () => {
    map.getLayer.mockReturnValue({} as never);
    map.getSource.mockReturnValue({} as never);

    const spectator = createDirective(undefined, { hostProps: { geojson } });
    spectator.fixture.destroy();

    expect(map.removeLayer).toHaveBeenCalledWith(expect.stringMatching(/-layer$/));
    expect(map.removeSource).toHaveBeenCalledWith(expect.stringMatching(/^rocket-marker-group-source-/));
  });
});
