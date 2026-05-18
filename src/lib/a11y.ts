export const MAIN_CONTENT_ID = 'main-content';

export function skipToMain() {
  const el = document.getElementById(MAIN_CONTENT_ID);
  if (el) {
    el.setAttribute('tabindex', '-1');
    el.focus();
  }
}
