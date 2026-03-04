import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, ToastModule, AppFloatingConfigurator],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">歡迎回來！</div>
                            <span class="text-muted-color font-medium">登入以繼續使用</span>
                        </div>

                        <div>
                            <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">使用者名稱</label>
                            <input pInputText id="username" type="text" placeholder="輸入使用者名稱" class="w-full md:w-120 mb-8" [(ngModel)]="username" (keydown.enter)="onLogin()" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">密碼</label>
                            <p-password id="password1" [(ngModel)]="password" placeholder="輸入密碼" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false" (keydown.enter)="onLogin()"></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="checked" id="rememberme1" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1">記住我</label>
                                </div>
                                <a routerLink="/auth/register" class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">還沒有帳號？註冊</a>
                            </div>
                            <p-button label="登入" styleClass="w-full" (onClick)="onLogin()" [loading]="loading"></p-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    username = '';
    password = '';
    checked = false;
    loading = false;

    constructor(
        private authService: AuthService,
        private messageService: MessageService,
        private router: Router,
    ) {}

    onLogin(): void {
        if (!this.username || !this.password) {
            this.messageService.add({ severity: 'warn', summary: '提示', detail: '請輸入使用者名稱和密碼' });
            return;
        }

        this.loading = true;
        this.authService.login({ username: this.username, password: this.password }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: '成功', detail: '登入成功' });
                setTimeout(() => this.router.navigate(['/']), 500);
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: '登入失敗',
                    detail: err.error?.message || '使用者名稱或密碼錯誤',
                });
            },
        });
    }
}
