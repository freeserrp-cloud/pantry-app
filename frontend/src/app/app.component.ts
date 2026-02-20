import { Component, signal } from "@angular/core";
import { NgIf } from "@angular/common";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  template: `
    <div class="min-h-screen app-root-shell px-4 py-6">
      <div class="app-shell">
        <header class="app-header">
          <div class="header-top">
            <button class="menu-btn" (click)="toggleMenu()" aria-label="Menü öffnen">
              ☰
            </button>
            <div>
              <div class="title">Pantry</div>
              <div class="subtitle">Fast, simple household inventory</div>
            </div>
          </div>
        </header>
        <main class="app-main">
          <router-outlet />
        </main>
      </div>
    </div>

    <div class="menu-overlay" *ngIf="menuOpen()" (click)="closeMenu()"></div>
    <aside class="menu-drawer" *ngIf="menuOpen()">
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">
          Inventar
        </a>
        <a routerLink="/shopping-list" routerLinkActive="active" (click)="closeMenu()">
          Einkaufsliste
        </a>
        <a routerLink="/items/new" routerLinkActive="active" (click)="closeMenu()">
          Produkt anlegen
        </a>
      </nav>
    </aside>
  `,
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  menuOpen = signal(false);

  toggleMenu() {
    this.menuOpen.update((state) => !state);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
