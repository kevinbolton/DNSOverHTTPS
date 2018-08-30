function sendWebFQDN() {
  let webFQDN = `${window.location.hostname}`;
  browser.runtime.sendMessage({"webFQDN": webFQDN});
  /*
  if (!document.title.includes(webFQDN)) {
    document.title = document.title + " - " + webFQDN;
  }
  */
}

window.addEventListener("load", sendWebFQDN());