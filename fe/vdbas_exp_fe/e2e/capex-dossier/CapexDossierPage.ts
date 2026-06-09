import { Page, Locator, expect } from '@playwright/test';

export class CapexDossierPage {
  readonly page: Page;

  // List Screen Selectors
  readonly btnCreateNew: Locator;
  readonly searchInput: Locator;
  readonly filterStatus: Locator;
  readonly btnSearch: Locator;
  readonly listTableBody: Locator;

  // Detail Screen Selectors - Common Actions
  readonly btnSave: Locator;
  readonly btnSaveDraft: Locator;
  readonly btnSubmit: Locator;
  readonly btnCancel: Locator;
  readonly btnDelete: Locator;
  readonly btnEditTop: Locator;
  readonly btnBack: Locator;

  // Detail Screen Selectors - Form Fields
  readonly inputDossierId: Locator;
  readonly inputSendDate: Locator;
  readonly selectSource: Locator;
  readonly inputProjectId: Locator;
  readonly btnLookupProject: Locator;
  readonly inputProjectName: Locator;
  readonly inputProjectSpecId: Locator;
  readonly inputProjectSpecName: Locator;
  readonly inputBoardId: Locator;
  readonly inputBoardName: Locator;
  readonly inputStatus: Locator;

  // Tabs
  readonly tabGeneral: Locator;
  readonly tabDocuments: Locator;
  readonly tabHistory: Locator;
  readonly tabApproval: Locator;

  // Delete Dialog
  readonly inputDeleteReason: Locator;
  readonly checkboxConfirmReviewed: Locator;
  readonly btnConfirmDelete: Locator;

  constructor(page: Page) {
    this.page = page;

    // List Screen
    this.btnCreateNew = page.getByTestId('btn-create-new');
    this.searchInput = page.getByTestId('search-input');
    this.filterStatus = page.getByTestId('filter-status');
    this.btnSearch = page.getByTestId('btn-search');
    this.listTableBody = page.getByTestId('list-tbody');

    // Detail Screen Actions
    this.btnSave = page.getByTestId('btn-save');
    this.btnSaveDraft = page.getByTestId('btn-save-draft');
    this.btnSubmit = page.getByTestId('btn-submit');
    this.btnCancel = page.getByTestId('btn-cancel');
    this.btnDelete = page.getByTestId('btn-delete');
    this.btnEditTop = page.getByTestId('btn-edit-top');
    this.btnBack = page.getByTestId('btn-back');

    // Detail Screen Fields
    this.inputDossierId = page.getByTestId('input-payment-dossier-id');
    this.inputSendDate = page.getByTestId('input-send-date');
    this.selectSource = page.getByTestId('select-source');
    this.inputProjectId = page.getByTestId('input-project-id');
    this.btnLookupProject = page.getByTestId('btn-lookup-project');
    this.inputProjectName = page.getByTestId('input-project-name');
    this.inputProjectSpecId = page.getByTestId('input-project-spec-id');
    this.inputProjectSpecName = page.getByTestId('input-project-spec-name');
    this.inputBoardId = page.getByTestId('input-project-management-board-id');
    this.inputBoardName = page.getByTestId('input-project-management-board-name');
    this.inputStatus = page.getByTestId('input-status');

    // Tabs
    this.tabGeneral = page.getByTestId('tab-general');
    this.tabDocuments = page.getByTestId('tab-documents');
    this.tabHistory = page.getByTestId('tab-history');
    this.tabApproval = page.getByTestId('tab-approval');

    // Delete Dialog
    this.inputDeleteReason = page.getByTestId('input-delete-reason');
    this.checkboxConfirmReviewed = page.getByTestId('checkbox-confirm-reviewed');
    this.btnConfirmDelete = page.getByTestId('btn-confirm-delete');
  }

  async login(username = 'maker01', password = '123') {
    await this.page.goto('/');
    
    // Check if we are redirected to Keycloak (wait for either the app or the login page)
    await this.page.waitForLoadState('networkidle');

    if (this.page.url().includes('protocol/openid-connect/auth')) {
      // Wait for login fields to be visible
      await this.page.waitForSelector('#username', { state: 'visible', timeout: 30000 });
      await this.page.fill('#username', username);
      await this.page.fill('#password', password);
      await this.page.click('#kc-login');
      
      // Wait for navigation back to the app (port 3000)
      await this.page.waitForURL(url => url.origin.includes('localhost:3000') && !url.href.includes('keycloak'), { timeout: 60000 });
    }
    
    // Ensure the app is loaded
    await this.page.waitForLoadState('networkidle');
  }

  async gotoList() {
    // 1. Navigate to the Exp module within the Host shell
    await this.page.goto('/exp');
    await this.page.waitForLoadState('networkidle');
    
    // 2. Click the sidebar menu item for CAPEX Dossiers
    // Wait for the sidebar to be visible and have items
    await this.page.waitForSelector('.vdbas-sidebar-menu', { state: 'visible', timeout: 20000 });
    
    // Click parent menu "Quản lý Chi" to expand it first
    const parentMenu = this.page.locator('.vdbas-sidebar-menu').getByText('Quản lý Chi');
    if (await parentMenu.isVisible()) {
      await parentMenu.click();
      // Wait for slide down transition
      await this.page.waitForTimeout(500);
    }
    
    const menuDossier = this.page.locator('.vdbas-sidebar-menu').getByText('Quản lý hồ sơ Chi đầu tư');
    await menuDossier.waitFor({ state: 'visible' });
    await menuDossier.click();
    
    // Wait for the grid or form to appear
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: any) {
    if (data.PROJECT_ID) {
      await this.inputProjectId.fill(data.PROJECT_ID);
      // Simulating blur or enter if needed by the system to trigger lookups
      await this.inputProjectId.press('Tab');
    }
    if (data.SEND_DATE) {
      await this.inputSendDate.fill(data.SEND_DATE);
    }
    if (data.SOURCE) {
      await this.selectSource.click();
      await this.page.locator('.ant-select-item-option-content').getByText(data.SOURCE, { exact: true }).click();
    }
    if (data.PROJECT_MANAGEMENT_BOARD_ID) {
      await this.inputBoardId.fill(data.PROJECT_MANAGEMENT_BOARD_ID);
      await this.inputBoardId.press('Tab');
    }
  }

  async verifyErrorMessage(fieldName: string, expectedMessage: string) {
    const errorLocator = this.page.locator(`[data-field-code="${fieldName}"] + .error-msg`);
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toHaveText(expectedMessage);
  }
}
