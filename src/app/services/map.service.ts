import { Injectable } from '@angular/core';
import L from 'leaflet';
import * as h3 from 'h3-js';
import geojson2h3 from 'geojson2h3';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  map: L.Map | undefined;
  hexagonsLayer: L.LayerGroup | undefined;

  drawHexagons(map: L.Map, data: any){
    if (this.hexagonsLayer) {
      this.hexagonsLayer.clearLayers();
    } else {
      this.hexagonsLayer = L.layerGroup().addTo(map);
    }

    const zoomLevel = map.getZoom();
    const h3Resolution = this.getH3ResolutionForZoom(zoomLevel);
    const mapBounds = map.getBounds();
    const polygons: L.Polygon[] = [];

    data.features.forEach((feature: any) => {
      geojson2h3.featureToH3Set(feature, h3Resolution).forEach(
        (hex) => {
          const [hexLat, hexLng] = h3.cellToLatLng(hex);
          if (mapBounds.contains([hexLat, hexLng])) {
            const latLngBoundary = h3.cellToBoundary(hex).map(([lat, lng]: [number, number]) => [lat, lng]);
            const polygon = L.polygon(latLngBoundary as [number, number][], {
              fillColor: '#' + feature.properties.COLOR_HEX,
              color: 'black',
              fillOpacity: 0.7
            });
            polygons.push(polygon);
          }
        }
      )
    });

    L.layerGroup(polygons).addTo(this.hexagonsLayer);
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

  initializeMap() {
    const mapOptions: L.MapOptions = {
      center: [21.487876, 39.799194],
      zoom: 4
    };

    this.map = L.map('map', mapOptions);
    const layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    this.map.addLayer(layer);
    return this.map;
  }

}
