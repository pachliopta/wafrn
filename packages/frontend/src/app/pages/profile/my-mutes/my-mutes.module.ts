import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { MyMutesComponent } from './my-mutes.component'
import { MatTableModule } from '@angular/material/table'
import { MatCardModule } from '@angular/material/card'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatButtonModule } from '@angular/material/button'
import { AvatarSmallComponent } from 'src/app/components/avatar-small/avatar-small.component'
import { LoaderComponent } from 'src/app/components/loader/loader.component'

@NgModule({
  declarations: [MyMutesComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: MyMutesComponent
      }
    ]),
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,
    MatButtonModule,
    AvatarSmallComponent,
    LoaderComponent
  ]
})
export class MyMutesModule { }
