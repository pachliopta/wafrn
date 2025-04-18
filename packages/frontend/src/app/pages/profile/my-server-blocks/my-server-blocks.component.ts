import { Component, signal } from '@angular/core'
import { BlocksService } from 'src/app/services/blocks.service'

@Component({
  selector: 'app-my-server-blocks',
  templateUrl: './my-server-blocks.component.html',
  styleUrls: ['./my-server-blocks.component.scss'],
  standalone: false
})
export class MyServerBlocksComponent {
  serverBlocks: any[] = []
  loading = signal<boolean>(true);
  displayedColumns = ['muted', 'actions']

  constructor(private blocksService: BlocksService) {
    this.blocksService.getMyServerBlockList().then((backendResponse) => {
      this.serverBlocks = backendResponse
      this.loading.set(false);
    })
  }

  unblockServer(id: string) {
    this.loading.set(true);
    this.blocksService.unblockServer(id).then((response) => {
      this.serverBlocks = response
      this.loading.set(false);
    })
  }
}
