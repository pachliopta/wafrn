import { Component, Injector, OnInit } from '@angular/core'
import { SwUpdate } from '@angular/service-worker'
import { EnvironmentService } from './services/environment.service'
import { TranslateService } from '@ngx-translate/core'
import { SwPush } from '@angular/service-worker'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private swUpdate: SwUpdate,
    private swPush: SwPush,
    private translate: TranslateService
  ) {
    this.translate.addLangs(['en', 'pl'])
    this.translate.setDefaultLang('en')
    try {
      this.translate.use(this.translate.getBrowserLang() || 'en')
    } catch (error) {
      // probably lang not avaiable
    }
  }

  ngOnInit() {
    // unregister serviceworkers
    /*navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (const registration of registrations) {
        registration.unregister();
      }
    });*/

    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate().then((updateAvaiable) => {
        if (updateAvaiable && confirm("You're using an old version of wafrn, do you want to update?")) {
          window.location.reload()
        }
        if (EnvironmentService.environment.disablePWA) {
          if ('caches' in window) {
            caches.keys().then(function (keyList) {
              return Promise.all(
                keyList.map(function (key) {
                  return caches.delete(key)
                })
              )
            })
          }
          if (window.navigator && navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
              for (const registration of registrations) {
                registration.unregister()
              }
            })
          }
        }
      })
    }
    // TODO lets keep with this later
    if (false && this.swPush.isEnabled && EnvironmentService.environment.webpushPublicKey) {
      this.swPush
        .requestSubscription({
          serverPublicKey: EnvironmentService.environment.webpushPublicKey
        })
        .then((notificationSubscription) => {
          console.log(notificationSubscription)
        })
    }
  }
}
