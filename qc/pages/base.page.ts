import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly logo: Locator;
  readonly findTalentLink: Locator;
  readonly loginLink: Locator;
  readonly registerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('header img[alt="Belooga"]');
    this.findTalentLink = page.locator('header a:has-text("Find Talent")');
    this.loginLink = page.locator('header a:has-text("Login")');
    this.registerButton = page.locator('header button:has-text("Register")');
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async expectHeaderVisible() {
    await expect(this.logo).toBeVisible();
    const src = await this.logo.getAttribute('src');
    expect(src).toContain('logo-big.png');
  }
}
