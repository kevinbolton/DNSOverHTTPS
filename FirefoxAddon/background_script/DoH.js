function handleMessage(message) {
    console.log("Message from the content script: " + message.domain_name);

//    var web_site_ip;
//    var web_site_ip_trr;
    
    function resolved(record) {
        console.log("Resolved by OS' DNS...");
        console.log("canonicalName: ", record.canonicalName);
        console.log("IP addresses: ", record.addresses);
        if (record.isTRR) {
            console.log("IP is by TRR");
        } else {
            console.log("IP is not by TRR");
        }
        web_site_ip = record.addresses[0];
      }
    
    function resolved_trr(record_trr) {
        console.log("Resolved by trr...");
        console.log("canonicalName: ", record_trr.canonicalName);
        console.log("IP addresses: ", record_trr.addresses);
        if (record_trr.isTRR) {
            console.log("IP is by TRR");
        } else {
            console.log("IP is not by TRR");
        }
        web_site_ip_trr = record_trr.addresses[0];
        console.log("First IP addresses: ", web_site_ip);
        console.log("First IP_trr addresses: ", web_site_ip_trr);
        function changed(changed) {
            console.log("changed");
        }
        function nonchange(changed) {
            console.log("nonchanged");
        }
            
        if (web_site_ip == web_site_ip_trr) {
            console.log("Green");
            var currentTab;
            function updateIcon() {
                console.log("Tabid", currentTab.id);
                browser.browserAction.setIcon({
                    path: {
                        16: "icons/GreenButton-16.png",
                        32: "icons/GreenButton-32.png"
                    },
                    tabId: currentTab.id
                });
            }

            function updateTab(tabs) {
                if (tabs[0]) {
                  currentTab = tabs[0];
                  updateIcon();
                }
            }
            var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
            gettingActiveTab.then(updateTab);
        } else {
            console.log("Red");
            browser.browserAction.setIcon({path: "icons/RedButton-32.png"});
        }
    }

    function err(record_err) {
        console.log("DNS resolve Error");
        console.log(record_err.message);
    }

    resolving = browser.dns.resolve(message.domain_name, ["disable_trr", "bypass_cache", "disable_ipv6", "canonical_name"]);
    resolving.then(resolved, err);
    
    resolving_trr = browser.dns.resolve(message.domain_name, ["bypass_cache", "disable_ipv6", "canonical_name"]);
    resolving_trr.then(resolved_trr, err);
}

browser.runtime.onMessage.addListener(handleMessage);