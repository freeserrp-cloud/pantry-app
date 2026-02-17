import { enableProdMode, isDevMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideServiceWorker } from "@angular/service-worker";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";

import { AppComponent } from "./app/app.component";
import { appRoutes } from "./app/app.routes";
import { environment } from "./environments/environment";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(),
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000"
    })
  ]
}).catch((err) => console.error(err));
