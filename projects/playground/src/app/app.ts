import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { RocketButton } from 'rocket-lib/button';
import { RocketCard } from 'rocket-lib/card';
import { ColDef, GetDataSource, RocketDataTable } from 'rocket-lib/data-table';
import { RocketLine, RocketMap, RocketMarker, RocketMarkerGroup } from 'rocket-lib/map';
import { interval, of, tap } from 'rxjs';
import { ELEMENT_DATA, MOCK_FEATURE_COLLECTION, MOCK_LINE_GEOJSON } from './mocks/mocks';
import { PeriodicElement } from './models/periodic-element.interface';

@Component({
  imports: [
    RouterOutlet,
    RocketButton,
    RocketCard,
    RocketDataTable,
    RocketMap,
    RocketMarker,
    RocketMarkerGroup,
    RocketLine,
  ],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('playground');
  protected readonly second = signal(0);

  protected readonly dataSource = new GetDataSource<PeriodicElement>(() =>
    of({ records: ELEMENT_DATA, totalRecords: ELEMENT_DATA.length }),
  );
  protected readonly markerGroupGeoJSON = MOCK_FEATURE_COLLECTION;
  protected readonly lineGeoJSON = signal(MOCK_LINE_GEOJSON);

  columns: ColDef<PeriodicElement>[] = [
    { key: 'position', label: 'Position' },
    { key: 'name', label: 'Name' },
    { key: 'weight', label: 'Weight' },
    { key: 'symbol', label: 'Symbol' },
  ];

  constructor() {
    interval(1000)
      .pipe(
        tap(() => this.second.update((x) => x + 1)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
