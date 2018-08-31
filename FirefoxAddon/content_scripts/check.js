function sendWebFqdnFromWindow() {
  let webFqdnFromWindow = `${window.location.hostname}`;
  browser.runtime.sendMessage({"webFqdnFromWindow": webFqdnFromWindow});
  /*
  if (!document.title.includes(webFqdnFromWindow)) {
    document.title = document.title + " - " + webFqdnFromWindow;
  }
  */
}
window.addEventListener("load", sendWebFqdnFromWindow());