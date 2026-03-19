"use client";

interface ScreenRendererProps {
  htmlContent: string;
  theme: string;
}

/**
 * Renders screen HTML content inside a sandboxed iframe with injected wireframe
 * styles. The theme prop controls light/dark and color variant classes on body.
 */
export default function ScreenRenderer({
  htmlContent,
  theme,
}: ScreenRendererProps) {
  // "dark" => no body class; everything else is "light" + optional theme class
  const isDark = theme === "dark";
  const bodyClasses: string[] = [];
  if (!isDark) {
    bodyClasses.push("light");
    // Named themes (sky, sage, lavender, sand, rose) get an extra class
    if (theme && theme !== "light") {
      bodyClasses.push(`theme-${theme}`);
    }
  }

  const srcDoc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #000;
    font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
    color: #aaa;
    font-size: 13px;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }
  body.light { background: #fff; color: #555; }

  /* Screen container */
  .screen {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 40px 24px 32px;
    position: relative;
    color: inherit;
    font-size: 13px;
    animation: slideIn 0.15s ease-out;
  }
  @keyframes slideIn { from { opacity: 0; } to { opacity: 1; } }

  /* Typography */
  .title { color: #fff; font-size: 16px; text-align: center; font-weight: normal; }
  .subtitle { color: #666; font-size: 12px; text-align: center; margin-top: 6px; line-height: 1.5; }
  .label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
  body.light .title { color: #111; }
  body.light .subtitle { color: #888; }
  body.light .label { color: #777; }

  /* Inputs */
  .ascii-input {
    background: none; border: 1px solid #555; border-radius: 8px;
    color: #fff; font-family: inherit; font-size: 13px;
    padding: 10px 14px; outline: none; width: 100%;
  }
  .ascii-input::placeholder { color: #444; }
  .ascii-input:focus { border-color: #888; }
  body.light .ascii-input { border-color: #bbb; color: #111; }
  body.light .ascii-input::placeholder { color: #bbb; }

  .input-row { display: flex; gap: 8px; margin-top: 24px; }
  .input-row .ascii-input { flex: 1; }

  .arrow-btn {
    border: 1px solid #fff; border-radius: 8px; background: none;
    color: #fff; font-family: inherit; font-size: 16px; width: 42px;
    cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .arrow-btn:hover { background: #222; }
  body.light .arrow-btn { border-color: #111; color: #111; }
  body.light .arrow-btn:hover { background: #eee; }

  .primary-btn {
    border: 1px solid #fff; border-radius: 8px; background: none;
    color: #fff; font-family: inherit; font-size: 13px; padding: 12px;
    cursor: pointer; text-align: center; width: 100%; letter-spacing: 1px;
  }
  .primary-btn:hover { background: #222; }
  .primary-btn.disabled { border-color: #333; color: #333; cursor: default; }
  .primary-btn.disabled:hover { background: none; }
  body.light .primary-btn { border-color: #111; color: #111; }
  body.light .primary-btn:hover { background: #eee; }
  body.light .primary-btn.disabled { border-color: #ccc; color: #ccc; }

  /* Box elements */
  .box { border: 1px solid #555; border-radius: 8px; padding: 10px 14px; cursor: pointer; transition: border-color 0.1s; }
  .box:hover { border-color: #888; }
  .box-dashed { border: 1px dashed #444; border-radius: 8px; padding: 10px 14px; cursor: pointer; text-align: center; color: #666; }
  .box-dashed:hover { border-color: #777; color: #999; }
  .divider { border-top: 1px solid #333; margin: 8px 0; }
  body.light .box { border-color: #bbb; }
  body.light .box:hover { border-color: #888; }
  body.light .box-dashed { border-color: #ccc; color: #aaa; }
  body.light .divider { border-color: #ddd; }

  /* Back / close */
  .back-btn { position: absolute; top: 38px; left: 24px; background: none; border: none; color: #555; font-family: inherit; font-size: 12px; cursor: pointer; z-index: 10; }
  .back-btn:hover { color: #aaa; }
  body.light .back-btn { color: #aaa; }
  body.light .back-btn:hover { color: #555; }
  .close-btn { position: absolute; top: 38px; right: 24px; color: #555; font-size: 12px; cursor: pointer; z-index: 10; }
  .close-btn:hover { color: #aaa; }

  /* Member rows */
  .member-row { display: flex; align-items: center; padding: 10px 14px; border: 1px solid #333; border-radius: 8px; gap: 12px; margin-bottom: 6px; }
  .member-name { flex: 1; color: #ccc; }
  .member-role { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; border: 1px solid #444; border-radius: 4px; padding: 2px 8px; }
  .member-role.organizer { color: #fff; border-color: #666; }
  .member-role.packer { color: #6af; border-color: #346; }
  .member-role.dependent { color: #c8f; border-color: #436; }
  .member-delete { background: none; border: none; color: #444; font-family: inherit; font-size: 14px; cursor: pointer; }
  .member-delete:hover { color: #f66; }
  .member-list { margin-top: 16px; display: flex; flex-direction: column; }
  body.light .member-row { border-color: #ddd; }
  body.light .member-name { color: #333; }
  body.light .member-role { color: #777; border-color: #ccc; }

  /* Tab bar */
  .tab-bar { position: absolute; bottom: 0; left: 0; right: 0; display: flex; border-top: 1px solid #333; padding-bottom: 16px; }
  .tab { flex: 1; text-align: center; padding: 12px 0; background: none; border: none; color: #444; font-family: inherit; font-size: 12px; cursor: pointer; }
  .tab.active { color: #fff; }
  .tab + .tab { border-left: 1px solid #333; }
  body.light .tab-bar { border-color: #ddd; }
  body.light .tab { color: #ccc; }
  body.light .tab.active { color: #111; }
  body.light .tab + .tab { border-color: #ddd; }

  /* Progress dots */
  .dots { display: flex; justify-content: center; gap: 10px; margin-top: auto; padding-top: 16px; font-size: 14px; }
  .dot { color: #333; }
  .dot.active { color: #fff; }
  body.light .dot { color: #ccc; }
  body.light .dot.active { color: #111; }

  /* Walkthrough */
  .wt-content { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px 0; }
  .wt-title { color: #fff; font-size: 15px; text-align: center; margin-bottom: 8px; font-weight: normal; }
  .wt-body { color: #666; font-size: 12px; text-align: center; line-height: 1.5; max-width: 260px; }
  .wt-dots { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 12px 0 4px; }
  .wt-dot { width: 6px; height: 6px; border-radius: 3px; background: #333; }
  .wt-dot.active { background: #fff; width: 16px; }
  body.light .wt-title { color: #111; }
  body.light .wt-body { color: #888; }
  body.light .wt-dot { background: #ccc; }
  body.light .wt-dot.active { background: #333; }

  /* Screen label */
  .screen-label { position: absolute; top: 28px; right: 24px; font-size: 10px; color: #333; }
  body.light .screen-label { color: #ccc; }

  /* Carousel */
  .carousel-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; border-bottom: 1px solid #222; margin-bottom: 16px; }
  .carousel-track { display: flex; flex: 1; transition: transform 0.3s ease; }
  .carousel-slide { min-width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px 16px; }
  .slide-icon { font-family: inherit; font-size: 13px; color: #888; white-space: pre; line-height: 1.3; text-align: left; margin-bottom: 48px; }
  .slide-title { color: #fff; font-size: 16px; text-align: center; margin-bottom: 8px; }
  .slide-desc { color: #666; font-size: 12px; text-align: center; line-height: 1.5; max-width: 280px; }
  body.light .slide-title { color: #111; }
  body.light .slide-desc { color: #888; }
  body.light .slide-icon { color: #777; }
  body.light .carousel-wrap { border-color: #eee; }

  /* Home / trip cards */
  .home-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #333; }
  .home-title { color: #fff; font-size: 14px; }
  .trip-card { border: 1px solid #444; border-radius: 8px; margin-bottom: 12px; cursor: pointer; }
  .trip-card:hover { border-color: #666; }
  body.light .home-header { border-color: #ddd; }
  body.light .home-title { color: #111; }
  body.light .trip-card { border-color: #ccc; }

  /* Auth */
  .auth-content { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .auth-logo { font-size: 14px; color: #fff; margin-bottom: 20px; text-align: center; white-space: pre; line-height: 1.3; }

  /* App name bar */
  .app-name-bar { padding: 8px 16px; color: #555; font-size: 10px; letter-spacing: 1px; border-bottom: 1px solid #222; }
  body.light .app-name-bar { color: #aaa; border-color: #ddd; }

  /* Misc buttons */
  .skip-btn { text-align: center; color: #555; font-size: 12px; cursor: pointer; padding: 8px; }
  .skip-btn:hover { color: #888; }
  .new-trip-btn { border: 1px dashed #333; border-radius: 8px; background: none; color: #555; font-family: inherit; font-size: 12px; padding: 14px; cursor: pointer; text-align: center; width: 100%; }
  .new-trip-btn:hover { border-color: #555; color: #888; }
  .add-btn { flex: 1; border: 1px dashed #444; border-radius: 8px; background: none; color: #888; font-family: inherit; font-size: 12px; padding: 14px 8px; cursor: pointer; text-align: center; }
  .add-btn:hover { border-color: #777; color: #ccc; }

  /* Permission dialog */
  .permission-dialog { border: 1px solid #555; border-radius: 12px; padding: 24px 20px; text-align: center; }
  .permission-title { color: #fff; font-size: 14px; margin-bottom: 12px; font-weight: normal; }
  .permission-body { color: #666; font-size: 12px; line-height: 1.5; margin-bottom: 20px; }
  body.light .permission-dialog { border-color: #bbb; }
  body.light .permission-title { color: #111; }
  body.light .permission-body { color: #888; }

  /* Bottom section */
  .bottom-section { padding-top: 12px; display: flex; flex-direction: column; gap: 12px; }

  /* Role picker */
  .role-picker { display: flex; gap: 8px; }
  .role-option { flex: 1; border: 1px solid #333; border-radius: 8px; padding: 12px 10px; cursor: pointer; text-align: center; }
  .role-option:hover { border-color: #555; }
  .role-option.selected { border-color: #fff; color: #fff; }
  .role-label { color: inherit; font-size: 12px; margin-bottom: 4px; }
  .role-desc { color: #555; font-size: 10px; line-height: 1.4; }

  /* Add form */
  .add-form { display: none; flex-direction: column; gap: 4px; border: 1px solid #444; border-radius: 8px; padding: 18px; margin-top: 6px; }
  .add-form.visible { display: flex; }

  /* Form actions */
  .form-actions { display: flex; gap: 8px; }
  .cancel-btn { flex: 1; border: 1px solid #333; border-radius: 8px; background: none; color: #666; font-family: inherit; font-size: 12px; padding: 8px; cursor: pointer; text-align: center; }
  .add-confirm-btn { flex: 1; border: 1px solid #fff; border-radius: 8px; background: none; color: #fff; font-family: inherit; font-size: 12px; padding: 8px; cursor: pointer; text-align: center; }
  .add-confirm-btn:hover { background: #222; }

  /* Contact rows */
  .contact-row { display: flex; align-items: center; padding: 12px 24px; border-bottom: 1px solid #222; cursor: pointer; gap: 12px; }
  .contact-row:hover { background: #111; }
  .contact-name { color: #ccc; flex: 1; font-size: 13px; }
  .contact-phone { color: #555; font-size: 11px; }

  /* Settings button */
  .settings-btn { background: none; border: 1px solid #333; border-radius: 6px; color: #555; font-family: inherit; font-size: 11px; padding: 4px 8px; cursor: pointer; }

  /* Trip sub elements */
  .trip-header { display: flex; justify-content: space-between; padding: 12px 14px 0; }
  .trip-dest { color: #fff; font-size: 14px; }
  .trip-progress { color: #6f6; font-size: 12px; }
  .trip-dates { color: #666; font-size: 11px; padding: 4px 14px; }
  .trip-avatars { display: flex; gap: 8px; padding: 8px 14px 12px; font-size: 11px; color: #888; }

  /* Wt actions */
  .wt-actions { display: flex; flex-direction: column; gap: 8px; padding: 16px 8px; }

  /* Member name input */
  .member-name-input { flex: 1; color: #ccc; background: none; border: none; font-family: inherit; font-size: inherit; padding: 0; outline: none; }
  .member-done-btn { background: none; border: 1px solid #555; border-radius: 4px; color: #ccc; font-family: inherit; font-size: 11px; padding: 2px 10px; cursor: pointer; white-space: nowrap; }

  /* Member phone */
  .member-phone { color: #555; font-size: 11px; }

  /* Add buttons row */
  .add-buttons-row { display: flex; gap: 8px; margin-top: 12px; }
</style>
</head>
<body class="${bodyClasses.join(" ")}">
${htmlContent}
</body>
</html>`;

  return (
    <iframe
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      title="Prototype screen"
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: "51px",
        display: "block",
      }}
    />
  );
}
