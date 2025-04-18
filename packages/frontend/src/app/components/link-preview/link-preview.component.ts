import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal, SimpleChanges } from '@angular/core'
import { EnvironmentService } from 'src/app/services/environment.service'
import { MediaService } from 'src/app/services/media.service'
import { MatCardModule } from '@angular/material/card'
import { CommonModule } from '@angular/common'
@Component({
  selector: 'app-link-preview',
  imports: [CommonModule, MatCardModule],
  templateUrl: './link-preview.component.html',
  styleUrl: './link-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkPreviewComponent implements OnInit {
  private mediaService = inject(MediaService)

  link = input.required<string>();

  loading = signal<boolean>(true);
  url = signal<string>('...');
  title = signal<string>('...');
  description = signal<string>('...');
  img = signal<string>('');
  forceTenorGif = signal<boolean>(false);
  forceYoutube = signal<boolean>(false);

  hostname = computed<string>(() => {
    return new URL(this.url()).hostname;
  });

  ngOnInit(): void {
    this.forceTenorGif.set(false);
    this.forceYoutube.set(false);
    if (this.link) {
      if (this.url().startsWith('https://media.tenor.com/')) {
        this.loading.set(false);
        this.forceTenorGif.set(true);
        return
      }
      this.loading.set(true);
      const linkToGet = this.link().startsWith(EnvironmentService.environment.externalCacheurl)
      this.url.set(linkToGet ? (new URL(this.link(), EnvironmentService.environment.frontUrl).searchParams.get('media') as string) : this.link());
      this.mediaService.getLinkPreview(this.url()).then((data) => {
        this.loading.set(false);
        if (data.images && data.images.length) {
          this.img.set(EnvironmentService.environment.externalCacheurl + encodeURIComponent(data.images[0]));
        }
        if (!this.img() && data.favicons && data.favicons.length) {
          this.img.set(EnvironmentService.environment.externalCacheurl +
            encodeURIComponent(data.favicons[data.favicons.length - 1]));
        }
        let sitenamePrefix = ''
        if (data.siteName) {
          sitenamePrefix = data.siteName + ' - '
        }
        if (data.title) {
          this.title.set(sitenamePrefix + data.title);
        }
        if (data.description) {
          this.description.set(data.description);
        }
      })
    }
  }
}
