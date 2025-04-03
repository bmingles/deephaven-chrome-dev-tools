console.log("[TESTING] Deephaven Chrome");

const INLINE_EDIT_SELECTOR =
  '[data-testid="issue-field-inline-edit-read-view-container.ui.container"]';

const SINGLE_SELECT =
  '[data-testid="issue-field-single-select-inline-edit-full.ui.single-select.field-inline-edit-state-less--container"]';

const fieldSelectors = {
  fixedInBuild: [
    '[data-testid="issue.views.field.single-line-text-inline-edit.customfield_10037"]',
    INLINE_EDIT_SELECTOR,
  ].join(" "),
  certifiedInBuild: [
    '[data-testid="issue.views.field.single-line-text-inline-edit.customfield_10038"]',
    INLINE_EDIT_SELECTOR,
  ].join(" "),
  documentationRequired: [
    '[data-testid="issue.issue-view-layout.issue-view-single-select-field.customfield_10032"]',
    SINGLE_SELECT,
  ].join(" "),
};

// Highlight Required Jira fields
for (const selector of Object.values(fieldSelectors)) {
  const el = document.querySelector(selector);
  if (el && ["None", "Undefined"].includes(el.textContent)) {
    el.style.backgroundColor = "yellow";
  }
}
