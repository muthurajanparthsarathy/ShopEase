import { Component, inject } from '@angular/core';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-loader-overlay',
  standalone: true,
  templateUrl: './loader-overlay.component.html',
})
export class LoaderOverlayComponent {
  loader = inject(LoaderService);
}
