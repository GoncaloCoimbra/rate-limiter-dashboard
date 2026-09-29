import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Activity, BookOpen, CircleHelp, KeyRound, LucideAngularModule, Search, Settings, SlidersHorizontal, Users } from 'lucide-angular';
import { TranslationService } from '../shared/translation.service';

interface HelpQuestion { questionKey: string; answerKey: string; sectionKey: string; route: string; }

@Component({
	selector: 'app-documentation',
	standalone: true,
	imports: [CommonModule, RouterLink, LucideAngularModule],
	template: `
		<section class="help-page">
			<header class="help-header">
				<span class="help-mark" aria-hidden="true"><lucide-icon [img]="BookOpen" size="22" /></span>
				<div>
					<p>{{ i18n.translate('helpEyebrow') }}</p>
					<h1>{{ i18n.translate('helpTitle') }}</h1>
					<span>{{ i18n.translate('helpDescription') }}</span>
				</div>
			</header>

			<label class="help-search">
				<lucide-icon [img]="Search" size="17" aria-hidden="true" />
				<input type="search" [attr.aria-label]="i18n.translate('helpSearch')" [placeholder]="i18n.translate('helpSearch')" [value]="searchTerm" (input)="searchTerm = $any($event.target).value" />
			</label>

			<div class="help-layout">
				<nav class="help-shortcuts" [attr.aria-label]="i18n.translate('helpQuickLinks')">
					<h2>{{ i18n.translate('helpQuickLinks') }}</h2>
					<a routerLink="/policies"><lucide-icon [img]="SlidersHorizontal" size="17" />{{ i18n.translate('policies') }}</a>
					<a routerLink="/clients"><lucide-icon [img]="Users" size="17" />{{ i18n.translate('clients') }}</a>
					<a routerLink="/keys"><lucide-icon [img]="KeyRound" size="17" />{{ i18n.translate('keys') }}</a>
					<a routerLink="/settings"><lucide-icon [img]="Settings" size="17" />{{ i18n.translate('settings') }}</a>
					<a routerLink="/simulator"><lucide-icon [img]="Activity" size="17" />{{ i18n.translate('simulator') }}</a>
				</nav>

				<section class="help-questions" [attr.aria-label]="i18n.translate('helpFaqTitle')">
					<h2><lucide-icon [img]="CircleHelp" size="18" aria-hidden="true" />{{ i18n.translate('helpFaqTitle') }}</h2>
					<p *ngIf="!visibleQuestions().length" class="help-empty">{{ i18n.translate('helpNoResults') }}</p>
					<details *ngFor="let question of visibleQuestions()">
						<summary>
							<span>{{ i18n.translate(question.sectionKey) }}</span>
							<strong>{{ i18n.translate(question.questionKey) }}</strong>
						</summary>
						<div class="answer">
							<p>{{ i18n.translate(question.answerKey) }}</p>
							<a [routerLink]="question.route">{{ i18n.translate('helpOpenSection') }} <span aria-hidden="true">→</span></a>
						</div>
					</details>
				</section>
			</div>
		</section>
	`,
	styles: [`
		:host { display: block; }
		.help-page { display: grid; gap: 20px; max-width: 1120px; }
		.help-header { display: flex; align-items: center; gap: 16px; padding: 22px 24px; border: 1px solid var(--border); border-radius: 14px; background: linear-gradient(120deg, var(--card), rgba(53, 200, 207, 0.06)); }
		.help-mark { display: grid; place-items: center; width: 48px; height: 48px; flex: 0 0 48px; border: 1px solid rgba(53, 200, 207, 0.28); border-radius: 12px; background: rgba(53, 200, 207, 0.1); color: var(--cyan); }
		.help-header p { color: var(--cyan); font-size: 10px; font-weight: 800; margin: 0 0 8px; }
		.help-header h1 { font: 500 30px 'Space Grotesk'; margin: 0; }
		.help-header > div > span { display: block; color: var(--muted); font-size: 14px; margin-top: 7px; }
		.help-search { display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 0 14px; border: 1px solid var(--border); border-radius: 10px; background: var(--input-bg); color: var(--muted); }
		.help-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text); font: inherit; }
		.help-layout { display: grid; grid-template-columns: minmax(190px, 240px) minmax(0, 1fr); gap: 28px; align-items: start; }
		.help-shortcuts { display: grid; gap: 5px; }
		.help-shortcuts h2, .help-questions h2 { display: flex; align-items: center; gap: 9px; font: 500 17px 'Space Grotesk'; margin: 0 0 10px; }
		.help-shortcuts a { display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 10px; border-radius: 8px; color: var(--muted); text-decoration: none; }
		.help-shortcuts a:hover { background: var(--hover-bg); color: var(--text); }
		.help-shortcuts lucide-icon { color: var(--cyan); }
		.help-questions { min-width: 0; padding: 20px 22px; border: 1px solid var(--border); border-radius: 12px; background: var(--card); }
		.help-questions h2 { margin-bottom: 8px; }
		.help-questions h2 lucide-icon { color: var(--cyan); }
		.help-questions details { border-bottom: 1px solid var(--border); }
		.help-questions details:last-child { border-bottom: 0; }
		.help-questions summary { display: grid; gap: 5px; padding: 15px 2px; cursor: pointer; list-style: none; }
		.help-questions summary::-webkit-details-marker { display: none; }
		.help-questions summary::after { content: '+'; position: absolute; right: 0; top: 14px; color: var(--cyan); font-size: 18px; }
		.help-questions summary { position: relative; padding-right: 28px; }
		.help-questions details[open] summary::after { content: '−'; }
		.help-questions summary span { color: var(--cyan); font-size: 10px; font-weight: 800; text-transform: uppercase; }
		.help-questions summary strong { color: var(--text); font-size: 14px; font-weight: 600; }
		.answer { padding: 0 2px 16px; }
		.answer p, .help-empty { color: var(--muted); font-size: 13px; line-height: 1.65; margin: 0 0 10px; }
		.answer a { color: var(--cyan); font-size: 12px; font-weight: 700; text-decoration: none; }
		.answer a:hover { text-decoration: underline; }
		@media (max-width: 720px) { .help-layout { grid-template-columns: 1fr; gap: 20px; } .help-shortcuts { grid-template-columns: repeat(2, minmax(0, 1fr)); } .help-shortcuts h2 { grid-column: 1 / -1; } .help-header { align-items: flex-start; padding: 18px; } .help-header h1 { font-size: 25px; } }
	`]
})
export class DocumentationComponent {
	readonly i18n = inject(TranslationService);
	readonly BookOpen = BookOpen;
	readonly Activity = Activity;
	readonly CircleHelp = CircleHelp;
	readonly Search = Search;
	readonly Settings = Settings;
	readonly SlidersHorizontal = SlidersHorizontal;
	readonly KeyRound = KeyRound;
	readonly Users = Users;
	searchTerm = '';
	readonly questions: HelpQuestion[] = [
		{ questionKey: 'helpFirstStepsQuestion', answerKey: 'helpFirstStepsAnswer', sectionKey: 'helpGettingStarted', route: '/policies' },
		{ questionKey: 'helpPolicyQuestion', answerKey: 'helpPolicyAnswer', sectionKey: 'policies', route: '/policies' },
		{ questionKey: 'helpClientQuestion', answerKey: 'helpClientAnswer', sectionKey: 'clients', route: '/clients' },
		{ questionKey: 'helpKeyQuestion', answerKey: 'helpKeyAnswer', sectionKey: 'keys', route: '/keys' },
		{ questionKey: 'helpSettingsQuestion', answerKey: 'helpSettingsAnswer', sectionKey: 'settings', route: '/settings' },
		{ questionKey: 'helpEventsQuestion', answerKey: 'helpEventsAnswer', sectionKey: 'simulator', route: '/simulator' },
		{ questionKey: 'helpChartsQuestion', answerKey: 'helpChartsAnswer', sectionKey: 'dashboard', route: '/' },
		{ questionKey: 'helpDashboardQuestion', answerKey: 'helpDashboardAnswer', sectionKey: 'dashboard', route: '/' },
	];

	visibleQuestions(): HelpQuestion[] {
		const query = this.searchTerm.trim().toLocaleLowerCase();
		if (!query) return this.questions;
		return this.questions.filter((question) =>
			`${this.i18n.translate(question.questionKey)} ${this.i18n.translate(question.answerKey)}`
				.toLocaleLowerCase().includes(query)
		);
	}
}
