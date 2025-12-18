import { CommonModule } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { IEntity } from 'src/common';
import { SelectionService } from 'src/app/services/selection.service';
import { SelectionBox } from 'src/app/pages/profile-page/selection-box/selection-box.component';

@Component({
  selector: 'app-selection-container',
  templateUrl: './selection-container.component.html',
  styleUrls: ['./selection-container.component.scss'],
  standalone: true,
  providers: [SelectionService],
  imports: [CommonModule, SelectionBox],
})
export class SelectionContainerComponent {
  public selectionService = inject(SelectionService);

  public selectionServiceSignal = computed(() => this.selectionService);

  public onMouseDown(event: MouseEvent) {
    this.selectionService.onMouseDown(event);
  }
}
