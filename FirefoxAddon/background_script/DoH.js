function handleMessage(message) {
    function resolved(recordOS) {
        function validationIP(recordDoH) {
            if (recordDoH.Status == "0") {
                console.log("DoH status: NoError");
                for (let i in recordDoH.Answer) {                    
                    console.log("TTR IP ", i, " is: ", recordDoH.Answer[i].data);
                } // Print all IPs from DoH server
                for (let j in recordOS.addresses) {
                    console.log("OS'DNS IP ", j, " is: ", recordOS.addresses[j]);
                } // Print all IPs from OS DNS server
                console.log("Web IP: ", webIPHTTP); // Print IP from browser
                console.log("Web URL: ", webFQDNHTTP); // Print URL from browser

                // Need to make a decision: What is the best way(DOM or HTTP) to get FQDN, and redesign code
                // Need to make a decision: Should add-on use OS DNS' IP to compare?
                // If both of FQDNs that received from HTTP & windows are same, compare HTTP'IP & DoH'IP
                if (message.webFQDN == webFQDNHTTP) {
                    for (i in recordDoH.Answer) {
                        if (recordDoH.Answer[i].data == webIPHTTP) {
                            console.log("TRR IP: ", recordDoH.Answer[i].data, " = ", webIPHTTP);
                            return true;
                        }
                    }
                    return false;
                } else { // else compare OS DNS IP & DoH'sIP
                    for (i in recordDoH.Answer) {
                        for (j in recordOS.addresses) {
                            if (recordDoH.Answer[i].data == recordOS.addresses[j]) {
                                console.log("TRR IP: ", recordDoH.Answer[i].data, " = ", recordOS.addresses[j]);
                                return true;
                            }
                        }
                    }
                    return false;
                }
            } else {
                console.log("[Error] DoH status: ", recordDoH.Status);    
            }
        }

        function updateIcon() {
            if (iconColor == "green") {
                browser.browserAction.setIcon({
                    path: {
                        16: "icons/GreenButton-16.png",
                        32: "icons/GreenButton-32.png"
                    },
                    tabId: currentTab.id
                });
            } else if (iconColor == "red") {
                browser.browserAction.setIcon({
                    path: {
                        16: "icons/RedButton-16.png",
                        32: "icons/RedButton-32.png"
                    },
                    tabId: currentTab.id
                });
            }
        }

        function updateTab(tabs) {
            if (tabs[0]) {
              currentTab = tabs[0];
              updateIcon();
            }
        }

        function handlerDoH() {
            if(clientDoH.status == 200 && clientDoH.response != null) {
                if (validationIP(clientDoH.response)) {
                    console.log("Change icon to green color");
                    iconColor = "green";
                    var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
                    gettingActiveTab.then(updateTab);
                } else {
                    console.log("Change icon to red color");
                    iconColor = "red";
                    var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
                    gettingActiveTab.then(updateTab);
                }
            } else {
                console.log("[Error] DoH HTTP status: ", clientDoH.status);
                console.log("[Error] DoH Response: ", clientDoH.response);
            }
        }

        console.log("Resolved by OS' DNS...");
        console.log("canonicalName: ", recordOS.canonicalName);
        console.log("IP addresses: ", recordOS.addresses);
        console.log("Is TRR?: ", recordOS.isTRR.toString());

        var currentTab;
        var iconColor;
        /* Enable when use cloudflare-dns */
        //var urlDoH = "https://cloudflare-dns.com/dns-query?name=" + message.webFQDN + "&type=A&do=false&cd=false";
        var urlDoH = "https://dns.google.com/resolve?name=" + message.webFQDN;

        var clientDoH = new XMLHttpRequest();
        clientDoH.open("GET", urlDoH, true);
        /* Enable when use cloudflare-dns */
        // clientDoH.setRequestHeader("accept", "application/dns-json");
        clientDoH.responseType = "json";
        clientDoH.onload = handlerDoH;
        clientDoH.send();
    }

    function err(recordOS_err) {
        console.log("DNS resolve Error", recordOS_err.message);
    }

    console.log("Message from the content script: " + message.webFQDN);
    resolving = browser.dns.resolve(message.webFQDN, ["disable_trr", "bypass_cache", "disable_ipv6", "canonical_name"]);
    resolving.then(resolved, err);
}

var webIPHTTP;
var webFQDNHTTP;

function getFQDN(url) {
    var FQDN;

    if (url.indexOf("//") > -1) {
        FQDN = url.split('/')[2];
    }
    else {
        FQDN = url.split('/')[0];
    }

    //find & remove port number
    FQDN = FQDN.split(':')[0];
    //find & remove "?"
    FQDN = FQDN.split('?')[0];

    return FQDN;
}

browser.webRequest.onResponseStarted.addListener(webResponse => {
    webIPHTTP = webResponse.ip;
    webFQDNHTTP = getFQDN(webResponse.url);
}, {
    urls: ['<all_urls>'],
    types: ['main_frame']
}, [
    'responseHeaders' // to prevent "No tab with id" error
]);

browser.runtime.onMessage.addListener(handleMessage);