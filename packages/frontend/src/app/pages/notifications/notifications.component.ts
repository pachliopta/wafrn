import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core'
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons'
import { UserNotifications } from 'src/app/interfaces/user-notifications'
import { NotificationsService } from 'src/app/services/notifications.service'
import { ThemeService } from 'src/app/services/theme.service'

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsComponent implements OnInit {
  page = 0
  observer: IntersectionObserver
  reloadIcon = faArrowsRotate


  notificationsToShow = signal<UserNotifications[]>([]);
  loading = signal<boolean>(true);


  constructor(
    private notificationsService: NotificationsService,
    private themeService: ThemeService
  ) {
    this.themeService.setMyTheme()
    this.observer = new IntersectionObserver((intersectionEntries: IntersectionObserverEntry[]) => {
      if (intersectionEntries.some((elem) => elem.isIntersecting)) {
        this.page = this.page + 1
        this.loadNotificationsV2(this.page)
      }
    })
  }

  reload() {
    this.page = 0
    this.notificationsToShow.set([]);
    this.loadNotificationsV2(0);
  }

  ngOnInit(): void {
    localStorage.setItem('lastTimeCheckNotifications', new Date().toISOString());
    this.loadNotificationsV2(0);
  }

  async loadNotificationsV2(page: number) {
    this.loading.set(true);
    const notifications = await this.notificationsService.getNotificationsScrollV2(page);
    // this waythe whole object is not recreated from scratch
    notifications.forEach((notif) => this.notificationsToShow.update((n) => { n.push(notif); return n; }));
    this.notificationsToShow.set(this.notificationsToShow());
    this.loading.set(false);
    setTimeout(() => {
      const elements = document.querySelectorAll('.load-more-notifications-intersector');
      if (elements) {
        elements.forEach((element) => {
          this.observer.observe(element)
        })
      } else {
        console.log('observer not ready')
      }
    })
  }
}
