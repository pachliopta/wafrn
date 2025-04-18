import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router'
import {
  faArrowUpRightFromSquare,
  faClockRotateLeft,
  faHeart,
  faHeartBroken,
  faHome,
  faReply,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { Subscription, filter } from 'rxjs'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { BlocksService } from 'src/app/services/blocks.service'
import { DashboardService } from 'src/app/services/dashboard.service'
import { LoginService } from 'src/app/services/login.service'
import { ThemeService } from 'src/app/services/theme.service'

import { MatDialog } from '@angular/material/dialog'
import { AcceptThemeComponent } from 'src/app/components/accept-theme/accept-theme.component'
import { BlogDetails } from 'src/app/interfaces/blogDetails'
import { EnvironmentService } from 'src/app/services/environment.service'
@Component({
  selector: 'app-view-blog',
  templateUrl: './view-blog.component.html',
  styleUrls: ['./view-blog.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewBlogComponent implements OnInit, OnDestroy {
  loading = signal<boolean>(false);
  noMorePosts = signal<boolean>(false);
  found = true
  viewedPosts = 0
  currentPage = 0
  posts: ProcessedPost[][] = []
  blogUrl: string = ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blogDetails = signal<BlogDetails | undefined>(undefined);
  userLoggedIn = false
  avatarUrl = ''
  navigationSubscription!: Subscription
  endSubscription!: Subscription
  showModalTheme = false
  viewedPostsIds: string[] = []
  intersectionObserverForLoadPosts!: IntersectionObserver

  shareExternalIcon = faArrowUpRightFromSquare
  solidHeartIcon = faHeart
  clearHeartIcon = faHeartBroken
  reblogIcon = faReply
  quickReblogIcon = faClockRotateLeft
  reportIcon = faTriangleExclamation
  homeIcon = faHome

  constructor(
    private activatedRoute: ActivatedRoute,
    private dashboardService: DashboardService,
    private loginService: LoginService,
    public router: Router,
    private titleService: Title,
    private metaTagService: Meta,
    private themeService: ThemeService,
    public blockService: BlocksService,
    private dialog: MatDialog
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn()

  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe()
    }
  }

  async ngOnInit() {
    this.navigationSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((e) => {
        // Avoid reloading if user has selected the same user they are already
        // viewing.
        if (this.userLoggedIn) { this.themeService.setMyTheme(); }
        if (this.blogUrl == this.activatedRoute.snapshot.paramMap.get('url')) {
          // Possibly a little ugly, but NavigationEnd fires when navigating
          // away too!
          if (!e.url.includes(this.blogUrl)) {
            return;
          }
          // Have to reload the theme in case it got unloaded elsewhere.
          this.handleTheme()
          return;
        }
        this.loading.set(true);
        this.blogUrl = ''
        this.avatarUrl = ''
        this.configureUser(true)
      })

    this.currentPage = 0;
    await this.configureUser(false);
    this.loadPosts(this.currentPage).then(() => {
      setTimeout(() => {
        const element = document.querySelector('#if-you-see-this-load-more-posts')
        if (element) {
          this.intersectionObserverForLoadPosts.observe(element)
        }
      })
    })
  }


  async configureUser(reload: boolean) {
    const blogUrl = this.activatedRoute.snapshot.paramMap.get('url')
    if (blogUrl) {
      this.blogUrl = blogUrl
    }

    const blogResponse = await this.dashboardService.getBlogDetails(this.blogUrl).catch(() => {
      this.found = false
      this.loading.set(false);
    })
    if (blogResponse) {
      this.blogDetails.set(blogResponse);
      this.avatarUrl = blogResponse.url.startsWith('@')
        ? EnvironmentService.environment.externalCacheurl + encodeURIComponent(blogResponse.avatar)
        : EnvironmentService.environment.externalCacheurl +
        encodeURIComponent(EnvironmentService.environment.baseMediaUrl + blogResponse.avatar)
      this.titleService.setTitle(`${blogResponse.url}'s blog`)
      this.metaTagService.addTags([
        {
          name: 'description',
          content: `${blogResponse.url}'s wafrn blog`
        },
        { name: 'author', content: blogResponse.url },
        { name: 'image', content: this.avatarUrl }
      ])
      if (reload) {
        this.loading.set(false);
        this.reloadPosts()

      }
    }
    this.handleTheme()
    this.intersectionObserverForLoadPosts = new IntersectionObserver(
      (intersectionEntries: IntersectionObserverEntry[]) => {
        if (intersectionEntries[0].isIntersecting) {
          this.currentPage++
          this.loadPosts(this.currentPage);
        }
      }
    )
  }


  handleTheme() {
    const userHasCustomTheme = !this.blogDetails()!.url.startsWith('@') //await this.themeService.checkThemeExists(this.blogDetails?.id);

    if (userHasCustomTheme) {
      let userResponseToCustomThemes = this.themeService.hasUserAcceptedCustomThemes()

      if (userResponseToCustomThemes === 2) {
        this.themeService.setTheme(this.blogDetails()!.id)
      }

      if (userResponseToCustomThemes === 0) {
        const dialogRef = this.dialog.open(AcceptThemeComponent)
        dialogRef.afterClosed().subscribe(() => {
          userResponseToCustomThemes = this.themeService.hasUserAcceptedCustomThemes()
          if (userResponseToCustomThemes === 2) {
            this.themeService.setTheme(this.blogDetails()!.id)
          }
        })
      }
    } else {
      this.themeService.setTheme('')
    }
  }


  reloadPosts() {
    if (this.loading()) return;
    window.scrollTo(0, 0)
    this.posts = []
    this.currentPage = 0
    this.viewedPosts = 0
    this.viewedPostsIds = []
    this.loadPosts(this.currentPage)
  }

  async loadPosts(page: number) {
    if (this.blogUrl === '') { return };

    if (this.blogDetails === undefined) { return }
    if (!this.userLoggedIn && this.blogDetails()!.url.startsWith('@')) {
      this.loading.set(false);
      this.noMorePosts.set(true);
      return;
    }
    this.loading.set(true);
    const tmpPosts = await this.dashboardService.getBlogPage(page, this.blogUrl)
    const filteredPosts = tmpPosts.filter((post: ProcessedPost[]) => {
      let allFragmentsSeen = true
      post.forEach((component) => {
        const thisFragmentSeen = this.viewedPostsIds.includes(component.id)
        allFragmentsSeen = thisFragmentSeen && allFragmentsSeen
        if (!thisFragmentSeen) {
          this.viewedPostsIds.push(component.id)
        }
      })
      return !allFragmentsSeen
    })
    filteredPosts.forEach((post) => {
      this.posts.push(post)
    })
    this.loading.set(false);
    if (tmpPosts.length === 0) {
      this.noMorePosts.set(true);
    }
  }
}
