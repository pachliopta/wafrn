import { Component, signal } from '@angular/core'
import { BlocksService } from 'src/app/services/blocks.service'

@Component({
  selector: 'app-my-blocks',
  templateUrl: './my-blocks.component.html',
  styleUrls: ['./my-blocks.component.scss'],
  standalone: false
})
export class MyBlocksComponent {
  blocks: Array<any> = []
  loading = signal<boolean>(true);
  displayedColumns = ['muted', 'actions']

  constructor(private blocksService: BlocksService) {
    this.blocksService.getBlockList().then((response) => {
      this.blocks = response
      this.loading.set(false);
    })
  }

  async unblockUser(id: string) {
    this.loading.set(true);
    this.blocks = await this.blocksService.unblockUser(id)
    this.loading.set(false);
  }
}
