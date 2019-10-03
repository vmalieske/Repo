import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'anim-img',
  templateUrl: './animated-image.component.html',
  styleUrls: ['./animated-image.component.scss'],
})
export class AnimatedImageComponent implements OnInit {
  @Input('src') public src: string | undefined;
  @Input('alt') public alt = '';

  public imgLoadedEvent(element: HTMLImageElement) {
    element.classList.add('loaded');
  }

  ngOnInit() {}
}
