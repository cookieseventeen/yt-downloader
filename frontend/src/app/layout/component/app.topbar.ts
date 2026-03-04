import { Component, inject, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';
import { DownloadsOverlayComponent } from './downloads-overlay.component';
import { DownloadQueueService } from '@/app/pages/core/services/download-queue.service';
import { AuthService } from '@/app/pages/core/services/auth.service';
import { PopoverModule } from 'primeng/popover';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [
        RouterModule, 
        CommonModule, 
        StyleClassModule, 
        AppConfigurator, 
        BadgeModule,
        ButtonModule,
        DownloadsOverlayComponent,
        PopoverModule
    ],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <span class="text-2xl font-bold text-primary">SAKAI DOWNLOADER</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <!-- 下載按鈕 (Overlay) -->
             <div class="relative">
                <button 
                  class="layout-topbar-action" 
                  (click)="downloadsPopover.toggle($event)"
                  pBadge 
                  [value]="queueService.activeCount().toString()" 
                  [badgeDisabled]="queueService.activeCount() === 0"
                  severity="danger"
                >
                    <i class="pi pi-download" style="font-size: 1.5rem"></i>
                </button>
                <p-popover #downloadsPopover>
                    <app-downloads-overlay></app-downloads-overlay>
                </p-popover>
            </div>

            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    @if (authService.isLoggedIn()) {
                        <span class="flex items-center gap-2 px-3 text-sm text-muted-color">
                            <i class="pi pi-user"></i>
                            {{ authService.currentUser()?.displayName }}
                        </span>
                        <button type="button" class="layout-topbar-action" routerLink="/youtube/operations">
                            <i class="pi pi-list"></i>
                            <span>操作紀錄</span>
                        </button>
                        <button type="button" class="layout-topbar-action" (click)="authService.logout()">
                            <i class="pi pi-sign-out"></i>
                            <span>登出</span>
                        </button>
                    } @else {
                        <a routerLink="/auth/login" class="layout-topbar-action">
                            <i class="pi pi-sign-in"></i>
                            <span>登入</span>
                        </a>
                        <a routerLink="/auth/register" class="layout-topbar-action">
                            <i class="pi pi-user-plus"></i>
                            <span>註冊</span>
                        </a>
                    }
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];

    layoutService = inject(LayoutService);
    queueService = inject(DownloadQueueService);
    authService = inject(AuthService);

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }
}
