import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '../core/services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ButtonModule, InputTextModule, PasswordModule, FormsModule, RouterModule, ToastModule, AppFloatingConfigurator],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">建立帳號</div>
                            <span class="text-muted-color font-medium">註冊以開始使用</span>
                        </div>

                        <div>
                            <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">使用者名稱</label>
                            <input pInputText id="username" type="text" placeholder="至少 3 個字元" class="w-full md:w-120 mb-6" [(ngModel)]="username" />

                            <label for="displayName" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">顯示名稱（選填）</label>
                            <input pInputText id="displayName" type="text" placeholder="你的暱稱" class="w-full md:w-120 mb-6" [(ngModel)]="displayName" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">密碼</label>
                            <p-password id="password1" [(ngModel)]="password" placeholder="至少 6 個字元" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="true"></p-password>

                            <label for="password2" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2 mt-4">確認密碼</label>
                            <p-password id="password2" [(ngModel)]="confirmPassword" placeholder="再次輸入密碼" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false" (keydown.enter)="onRegister()"></p-password>

                            <div class="flex items-center justify-end mt-2 mb-8">
                                <a routerLink="/auth/login" class="font-medium no-underline cursor-pointer text-primary">已有帳號？登入</a>
                            </div>
                            <p-button label="註冊" styleClass="w-full" (onClick)="onRegister()" [loading]="loading"></p-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Register {
    username = '';
    displayName = '';
    password = '';
    confirmPassword = '';
    loading = false;

    constructor(
        private authService: AuthService,
        private messageService: MessageService,
        private router: Router,
    ) {}

    onRegister(): void {
        if (!this.username || !this.password) {
            this.messageService.add({ severity: 'warn', summary: '提示', detail: '請填寫必要欄位' });
            return;
        }
        if (this.username.length < 3) {
            this.messageService.add({ severity: 'warn', summary: '提示', detail: '使用者名稱至少 3 個字元' });
            return;
        }
        if (this.password.length < 6) {
            this.messageService.add({ severity: 'warn', summary: '提示', detail: '密碼至少 6 個字元' });
            return;
        }
        if (this.password !== this.confirmPassword) {
            this.messageService.add({ severity: 'warn', summary: '提示', detail: '兩次密碼不一致' });
            return;
        }

        this.loading = true;
        this.authService.register({
            username: this.username,
            password: this.password,
            displayName: this.displayName || undefined,
        }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: '成功', detail: '註冊成功！' });
                setTimeout(() => this.router.navigate(['/']), 500);
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: '註冊失敗',
                    detail: err.error?.message || '註冊時發生錯誤',
                });
            },
        });
    }
}
