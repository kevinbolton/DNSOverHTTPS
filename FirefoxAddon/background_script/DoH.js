function handleMessage(message) {
    console.log("Message from the content script: " + message.domain_name);
    
    function resolved(record) {
        console.log("Resolved by OS' DNS...");
        console.log("canonicalName: ", record.canonicalName);
        console.log("IP addresses: ", record.addresses);
        if (record.isTRR) {
            console.log("IP is by TRR");
        } else {
            console.log("IP is not by TRR");
        }

        function processData(data) {
            if (data.Status == "0") {
                for (i in data.Answer) {
                    console.log("TTR IP ", i, " is: ", data.Answer[i].data);
                    for (j in record.addresses) {
                        console.log("IP ", j, " is: ", record.addresses[j]);
                        if (data.Answer[i].data == record.addresses[j]) {
                            return true;
                        }
                    }
                }
                return false;
            } else {
                console.log("[Error] DoH status: ", data.Status);    
            }
        }

        function handler() {
            if(client.status == 200 && client.response != null) {
                if (processData(client.response)) {
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
                    var currentTab;

                    function updateIcon() {
                        console.log("Tabid", currentTab.id);
                        browser.browserAction.setIcon({
                            path: {
                                16: "icons/RedButton-16.png",
                                32: "icons/RedButton-32.png"
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
                }
            } else {
                console.log("[Error] HTTP status: ", client.status);
                console.log("[Error] Response: ", client.response);
            }
        }

        var urlCloudflareDoH = "https://cloudflare-dns.com/dns-query?name=" + message.domain_name + "&type=A&do=false&cd=false";
        var client = new XMLHttpRequest();
        client.open("GET", urlCloudflareDoH, true);
        client.setRequestHeader("accept", "application/dns-json")
        client.responseType = "json";
        client.onload = handler;
        client.send();
    }

    function err(record_err) {
        console.log("DNS resolve Error", record_err.message);
    }

    resolving = browser.dns.resolve(message.domain_name, ["disable_trr", "bypass_cache", "disable_ipv6", "canonical_name"]);
    resolving.then(resolved, err);
}

browser.runtime.onMessage.addListener(handleMessage);