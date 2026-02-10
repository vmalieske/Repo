import { CommonModule } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { SelectionService } from 'src/app/services/selection.service';

@Component({
  selector: 'app-selection-box',
  templateUrl: './selection-box.component.html',
  styleUrl: './selection-box.component.scss',
  imports: [CommonModule],
  standalone: true,
})
export class SelectionBox {
  #selectionService = inject(SelectionService);

  public readonly selectionBoxStyle = computed(() => this.#selectionService.selectionBoxStyle());
  public readonly isDragging = computed(() => this.#selectionService.isDragging());
}
