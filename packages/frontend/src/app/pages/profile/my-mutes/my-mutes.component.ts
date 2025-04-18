import { Component, signal } from '@angular/core'
import { BlocksService } from 'src/app/services/blocks.service'

@Component({
  selector: 'app-my-mutes',
  templateUrl: './my-mutes.component.html',
  styleUrls: ['./my-mutes.component.scss'],
  standalone: false
})
export class MyMutesComponent {
  loading = signal<boolean>(true);
  mutedUsers: Array<any> = []
  displayedColumns = ['muted', 'actions']

  constructor(private blocksService: BlocksService) {
    this.blocksService.getMuteList().then((response) => {
      this.mutedUsers = response
      this.loading.set(false);
    })
  }

  async unmuteUser(id: string) {
    this.loading.set(true);
    this.mutedUsers = await this.blocksService.unmuteUser(id)
    this.loading.set(false);
  }
}
