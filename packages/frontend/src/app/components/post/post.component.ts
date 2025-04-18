import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, Input, model, OnChanges, OnDestroy, OnInit, output, Output, signal } from '@angular/core'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { EditorService } from 'src/app/services/editor.service'
import { LoginService } from 'src/app/services/login.service'
import { PostsService } from 'src/app/services/posts.service'

import { DeletePostService } from 'src/app/services/delete-post.service'
import { Action } from 'src/app/interfaces/editor-launcher-data'
import { MessageService } from 'src/app/services/message.service'
import {
  faArrowUpRightFromSquare,
  faChevronDown,
  faHeart,
  faHeartBroken,
  faShareNodes,
  faTrash,
  faGlobe,
  faEnvelope,
  faServer,
  faUser,
  faUnlock,
  faPen,
  faClose,
  faReply,
  faRepeat,
  faQuoteLeft,
  faCheck
} from '@fortawesome/free-solid-svg-icons'
import { EnvironmentService } from 'src/app/services/environment.service'
import { SimplifiedUser } from 'src/app/interfaces/simplified-user'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostComponent implements OnInit, OnDestroy {
  post = model.required<ProcessedPost[]>();
  showFull = signal<boolean>(false);
  postsExpanded = signal<number>(EnvironmentService.environment.shortenPosts);
  expanded = signal(false)
  originalPostContent = signal<ProcessedPost[]>([]);
  finalPosts = signal<ProcessedPost[]>([]);
  headerText = signal<string>('');

  userLoggedIn = false
  followedUsers: string[] = []
  notYetAcceptedFollows: string[] = []
  myId: string = ''

  // icons
  shareIcon = faShareNodes
  expandDownIcon = faChevronDown
  solidHeartIcon = faHeart
  clearHeartIcon = faHeartBroken
  replyIcon = faReply
  reblogIcon = faRepeat
  quoteIcon = faQuoteLeft
  shareExternalIcon = faArrowUpRightFromSquare
  deleteIcon = faTrash
  closeIcon = faClose
  worldIcon = faGlobe
  unlockIcon = faUnlock
  envelopeIcon = faEnvelope
  serverIcon = faServer
  userIcon = faUser
  editedIcon = faPen
  checkIcon = faCheck

  // subscriptions
  updateFollowersSubscription
  updateLikesSubscription

  // Computed Vars
  // 0 no display at all 1 display like 2 display dislike
  finalPost = computed(() => {
    const postToEvaluate =
      this.isEmptyReblog() && this.post().length > 1 ? this.post()[this.post().length - 2] : this.post()[this.post().length - 1];
    return postToEvaluate;
  });

  postCanExpand = computed(() => {
    let textLength = 0
    if (this.originalPostContent()) {
      textLength = this.originalPostContent().map((elem) => elem.content).join('').length
      this.originalPostContent().map((block) => block.content).join('').length
    }
    return (
      ((textLength > 2500 || !this.showFull()) && !this.expanded()) ||
      !(this.post().length === this.originalPostContent().length)
    )
  })

  notes = computed<string>(() => {
    let notes = this.post()[this.post().length - 1].notes;
    return notes.toString();
  });

  constructor(
    public postService: PostsService,
    private loginService: LoginService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn()
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID()
    }
    this.updateFollowersSubscription = this.postService.updateFollowers.subscribe(() => {
      this.followedUsers = this.postService.followedUserIds
      this.notYetAcceptedFollows = this.postService.notYetAcceptedFollowedUsersIds
    })

    this.updateLikesSubscription = this.postService.postLiked.subscribe((likeEvent) => {
      if (likeEvent.id === this.post()[this.post().length - 1].id) {
        if (likeEvent.like) {
          this.originalPostContent()[this.originalPostContent().length - 1].userLikesPostRelations = [
            this.loginService.getLoggedUserUUID()
          ]
        } else {
          this.originalPostContent()[this.originalPostContent().length - 1].userLikesPostRelations = []
        }
      }
    })
  }

  ngOnDestroy(): void {
    this.updateFollowersSubscription.unsubscribe()
    this.updateLikesSubscription.unsubscribe()
  }

  ngOnInit(): void {
    this.followedUsers = this.postService.followedUserIds
    this.notYetAcceptedFollows = this.postService.notYetAcceptedFollowedUsersIds
    this.originalPostContent.set(this.post());
    this.finalPosts.set(this.originalPostContent().slice(-5));
    if (!this.showFull()) {
      this.post.update((post) => { return post.slice(0, EnvironmentService.environment.shortenPosts) });

      if (this.originalPostContent().length === this.post().length) {
        this.showFull.set(true);
      }
    }
    // If user has marked autoexpand we force 1 expand. Doing full could cause EXPLOSIONS
    if (localStorage.getItem('automaticalyExpandPosts') === 'true') {
      this.expandPost()
    }
    this.headerText.set(this.isEmptyReblog() ? 'rewooted' : 'replied');
  }

  isEmptyReblog() {
    const finalOne = this.post()[this.post().length - 1]
    return (
      finalOne.content == '' &&
      finalOne.tags.length == 0 &&
      finalOne.quotes.length == 0 &&
      !finalOne.questionPoll &&
      finalOne.medias?.length == 0
    )
  }

  expandPost() {
    this.expanded.set(true)
    this.postsExpanded.update((pe) => { return pe + 100 });
    this.post.update(() => { return this.originalPostContent().slice(0, this.postsExpanded()) });
  }
}
