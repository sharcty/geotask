import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as L from 'leaflet';
import { MapService } from './services/map.service';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit{
  title = 'geotask';
  map: L.Map | undefined;
  data: any;

  constructor(private mapService: MapService, private dataService: DataService) {}

  ngOnInit() {
    this.map = this.mapService.initializeMap();
  }

  async ngAfterViewInit() {
    try {
      this.data = await this.dataService.fetchData();
      this.dataService.recalculateCoordinates(this.data);

      this.mapService.drawHexagons(this.map as L.Map, this.data);

      this.map?.on('zoomend', ()=>this.mapService.drawHexagons(this.map as L.Map, this.data));
      this.map?.on('moveend', ()=>this.mapService.drawHexagons(this.map as L.Map, this.data));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

}
