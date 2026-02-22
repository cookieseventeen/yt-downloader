import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchResponse } from '../models/video.model';

@Injectable({
  providedIn: 'root',
})
export class YoutubeService {
  private readonly apiUrl = '/api/youtube';

  constructor(private http: HttpClient) {}

  /**
   * 搜尋 YouTube 影片
   */
  search(query: string, maxResults: number = 10): Observable<SearchResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('maxResults', maxResults.toString());

    return this.http.get<SearchResponse>(`${this.apiUrl}/search`, { params });
  }
}
