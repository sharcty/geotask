import { Injectable } from '@angular/core';
import axios from 'axios';
import proj4 from 'proj4';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  recalculateCoordinates(data: any) {
    data.features.forEach((feature: any) => {
      feature.geometry.coordinates.forEach((polygon: any) => {
        polygon.forEach((param: any) => {
          param.forEach((coordinatePair: any, index: number) => {
            const [x, y] = coordinatePair;
            const projectedCoordinates = proj4('EPSG:3857', 'EPSG:4326', [x, y]);
            param[index] = projectedCoordinates;
          });
        });
      });
    });
  }

  async fetchData() {
    try {
      const response = (await axios.get('../assets/data.json')).data;
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
