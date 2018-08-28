function change_title() {
  let hostname = `${window.location.hostname}`;
  browser.runtime.sendMessage({"domain_name": hostname});
  if (!document.title.includes(hostname)) {
    document.title = document.title + " - " + hostname;
  }
}

window.addEventListener("load", change_title());