import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, input, model, OnInit, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatTooltipModule } from '@angular/material/tooltip'
import { RouterModule } from '@angular/router'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import {
  faShareNodes,
  faChevronDown,
  faHeart,
  faHeartBroken,
  faReply,
  faRepeat,
  faQuoteLeft,
  faArrowUpRightFromSquare,
  faTrash,
  faClose,
  faGlobe,
  faUnlock,
  faEnvelope,
  faServer,
  faUser,
  faPen,
  faCheck,
  faBookBookmark,
  faBookmark
} from '@fortawesome/free-solid-svg-icons'
import { firstValueFrom, Observable } from 'rxjs'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { DeletePostService } from 'src/app/services/delete-post.service'
import { EditorService } from 'src/app/services/editor.service'
import { LoginService } from 'src/app/services/login.service'
import { MessageService } from 'src/app/services/message.service'
import { PostsService } from 'src/app/services/posts.service'

@Component({
  selector: 'app-bottom-reply-bar',
  imports: [CommonModule, RouterModule, FontAwesomeModule, MatButtonModule, MatTooltipModule],
  templateUrl: './bottom-reply-bar.component.html',
  styleUrl: './bottom-reply-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BottomReplyBarComponent implements OnInit {
  fragment = model.required<ProcessedPost>();
  notes = input<string>('');
  loadingAction = signal<boolean>(false);
  bookmarked = signal<boolean>(false);
  myRewootsIncludePost = signal<boolean>(false);

  userLoggedIn = false;
  myId = '';


  // icons
  shareIcon = faShareNodes
  expandDownIcon = faChevronDown
  solidHeartIcon = faHeart
  clearHeartIcon = faHeartBroken
  reblogIcon = faReply
  quickReblogIcon = faRepeat
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
  bookmarkIcon = faBookmark
  unbookmarkIcon = faBookBookmark

  constructor(
    loginService: LoginService,
    private postService: PostsService,
    private editorService: EditorService,
    private deletePostService: DeletePostService,
    private messages: MessageService,
    private editor: EditorService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn()
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID();
    }
  }

  ngOnInit(): void {
    this.bookmarked.set(this.fragment().bookmarkers.includes(this.myId));
    this.myRewootsIncludePost.set(this.postService.rewootedPosts.includes(this.fragment().id));
  }

  async replyPost(post: ProcessedPost) {
    await this.editorService.replyPost(post)
  }

  async quotePost(post: ProcessedPost) {
    await this.editorService.quotePost(post)
  }

  async editPost(post: ProcessedPost) {
    await this.editorService.replyPost(post, true)
  }

  async deletePost(id: string) {
    this.deletePostService.openDeletePostDialog(id)
  }

  async deleteRewoots(id: string) {
    this.loadingAction.set(true);
    const success = await firstValueFrom(this.deletePostService.deleteRewoots(id))
    if (success) {
      this.myRewootsIncludePost.set(false);
      this.messages.add({
        severity: 'success',
        summary: 'You successfully deleted your rewoot'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong! Check your internet connectivity and try again'
      })
    }
    this.loadingAction.set(false);
  }

  async likePost(postToLike: ProcessedPost) {
    this.loadingAction.set(true);
    if (await this.postService.likePost(postToLike.id)) {
      postToLike.userLikesPostRelations.push(this.myId)
      const enableConfetti = localStorage.getItem('enableConfetti') == 'true'
      this.messages.add({
        severity: 'success',
        summary: 'You successfully liked this woot',
        confettiEmojis: enableConfetti ? ['❤️', '💚', '💙'] : []
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
    this.loadingAction.set(false);
  }

  async unlikePost(postToUnlike: ProcessedPost) {
    this.loadingAction.set(true);
    if (await this.postService.unlikePost(postToUnlike.id)) {
      postToUnlike.userLikesPostRelations = postToUnlike.userLikesPostRelations.filter((elem) => elem != this.myId)
      this.messages.add({
        severity: 'success',
        summary: 'You no longer like this woot'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
    this.loadingAction.set(false);
  }

  async unbookmarkPost() {
    if (await this.postService.unbookmarkPost(this.fragment().id)) {
      this.fragment.update((f) => {
        f.bookmarkers = f.bookmarkers.filter((elem) => elem != this.myId);
        return f;
      });
      this.messages.add({
        severity: 'success',
        summary: 'You successfully unbookmarked this woot'
      })
      this.bookmarked.set(false);
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
  }

  async bookmarkPost() {
    if (await this.postService.bookmarkPost(this.fragment().id)) {
      this.fragment.update((f) => {
        f.bookmarkers.push(this.myId);
        return f;
      });
      const enableConfetti = localStorage.getItem('enableConfetti') == 'true'
      this.messages.add({
        severity: 'success',
        summary: 'You successfully bookmarked this woot',
        confettiEmojis: enableConfetti ? ['💾'] : []
      })
      this.bookmarked.set(true);
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
  }

  async quickReblog(postToBeReblogged: ProcessedPost) {
    this.loadingAction.set(true);
    if (postToBeReblogged?.privacy !== 10) {
      const response = await this.editor.createPost({
        content: '',
        idPostToReblog: postToBeReblogged.id,
        privacy: 0,
        media: []
      })
      if (response) {
        const enableConfetti = localStorage.getItem('enableConfetti') == 'true'

        this.myRewootsIncludePost.set(true);
        this.messages.add({
          severity: 'success',
          summary: 'You rewooted the woot!',
          confettiEmojis: enableConfetti ? ['🔁'] : []
        })
      } else {
        this.messages.add({
          severity: 'error',
          summary: 'Something went wrong! Check your internet conectivity and try again'
        })
      }
    } else {
      this.messages.add({
        severity: 'warn',
        summary: 'Sorry, this woot is not rebloggeable as requested by the user'
      })
    }
    this.loadingAction.set(false);
  }
}
