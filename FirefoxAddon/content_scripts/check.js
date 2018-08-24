const title = document.querySelector('title');
const config = { subtree: true, characterData: true, childList: true };
let observer = new MutationObserver(function(mutations) {
  change_title();
});

function change_title() {
  let hostname = `${window.location.hostname}`;
  browser.runtime.sendMessage({"domain_name": hostname});
  if (!document.title.includes(hostname)) {
    observer.disconnect();
    document.title = document.title + " - " + hostname;
    observer.observe(title, config);
  }
}

observer.observe(title, config);
window.addEventListener ("load", change_title, false);