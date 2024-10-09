import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import axios from 'axios';
import proj4 from 'proj4';
import geojson2h3 from 'geojson2h3';
import * as L from 'leaflet';
import * as h3 from 'h3-js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'geotask';
  map: L.Map | undefined;
  data: any;
  boundaries: any = [];
  hexagonsLayer: L.LayerGroup | undefined;
  hexagonCache: Map<string, [number, number][]> = new Map();

  ngOnInit() {
    this.initializeMap();
  }

  async ngAfterViewInit() {
    this.fetchData().then(() => {
      this.recalculateCoordinates();
      this.drawHexagons();

      const debouncedDraw = this.debounce(() => this.drawHexagons(), 100);
      this.map?.on('zoomend', debouncedDraw);
      this.map?.on('moveend', debouncedDraw);
    });
  }

  debounce(func: Function, wait: number) {
    let timeout: any;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  drawHexagons() {
    if (!this.map || !this.data) return;

    if (this.hexagonsLayer) {
      this.hexagonsLayer.clearLayers();
    } else {
      this.hexagonsLayer = L.layerGroup().addTo(this.map);
    }

    const zoomLevel = this.map.getZoom();
    const h3Resolution = this.getH3ResolutionForZoom(zoomLevel);
    const mapBounds = this.map.getBounds();

    this.data.features.forEach((feature: any) => {
      geojson2h3.featureToH3Set(feature, h3Resolution).forEach(
        (el) => {
          const [hexLat, hexLng] = h3.cellToLatLng(el);
          if (mapBounds.contains([hexLat, hexLng])) {
            const latLngBoundary = h3.cellToBoundary(el).map(([lat, lng]: [number, number]) => [lat, lng]);
            L.polygon(latLngBoundary as [number, number][], { fillColor: '#' + feature.properties.COLOR_HEX, color: 'black', fillOpacity: 0.7 }).addTo(this.hexagonsLayer as L.LayerGroup);
          }
        }
      )
    });
  }

  getH3ResolutionForZoom(zoomLevel: number): number {
    if (zoomLevel >= 15) return 8;
    if (zoomLevel >= 13) return 7;
    if (zoomLevel >= 11) return 6;
    if (zoomLevel >= 9) return 5;
    if (zoomLevel >= 7) return 4;
    if (zoomLevel >= 5) return 3;
    if (zoomLevel >= 3) return 2;
    return 1;
  }

  recalculateCoordinates() {
    this.data.features.forEach((feature: any) => {
      feature.geometry.coordinates.forEach((polygon: any) => {
        polygon.forEach((ring: any) => {
          ring.forEach((coordinatePair: any, index: number) => {
            const [x, y] = coordinatePair;
            const projectedCoordinates = proj4('EPSG:3857', 'EPSG:4326', [x, y]);
            ring[index] = projectedCoordinates;
          });
        });
      });
    });
  }

  initializeMap() {
    const mapOptions: L.MapOptions = {
      center: [21.487876, 39.799194],
      zoom: 4
    };

    this.map = L.map('map', mapOptions);
    const layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    this.map.addLayer(layer);
  }

  async fetchData() {
    try {
      this.data = (await axios.get('../assets/data.json')).data;
    } catch (error) {
      console.error(error);
    }
  }
}
