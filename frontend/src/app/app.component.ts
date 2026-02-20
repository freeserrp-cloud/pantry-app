import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen app-root-shell px-4 py-6">
      <div class="app-shell">
        <header class="app-header">
          <div class="title">Pantry</div>
          <div class="subtitle">Fast, simple household inventory</div>
        </header>
        <main class="app-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrls: ["./app.component.css"]
})
export class AppComponent {}
