import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[appPortalTeleport]',
  standalone: true,
})
export class PortalTeleportDirective implements OnInit, OnDestroy {
  private readonly elRef = inject(ElementRef<HTMLElement>);
  private teleported = false;

  ngOnInit(): void {
    document.body.appendChild(this.elRef.nativeElement);
    this.teleported = true;
  }

  ngOnDestroy(): void {
    if (this.teleported && this.elRef.nativeElement.parentElement === document.body) {
      this.elRef.nativeElement.remove();
    }
  }
}
