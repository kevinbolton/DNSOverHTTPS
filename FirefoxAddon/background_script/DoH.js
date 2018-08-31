var webIpFromBrowser;
var webFqdnFromBrowser;
var webDomainFromBrowser;
var webPtrFromBrowser; //Input of reverse DoH
var webPtrFromDoh;
var flagPrivateIp;
var resultByReverseDoh;

// Get FQDN from URL
function getFqdn(url) {
    let fqdn;

    if (url.indexOf("//") > -1) {
        fqdn = url.split('/')[2];
    } else {
        fqdn = url.split('/')[0];
    }

    fqdn = fqdn.split(':')[0]; //find & remove port number
    fqdn = fqdn.split('?')[0]; //find & remove "?"

    return fqdn;
}

function getDomain(fqdn) {
    let domain;
    let webDomain = "";
    domain = fqdn.split('.');
    for (i = 1; i < domain.length; i++) {
        if ((i+1) < domain.length) {
            webDomain = webDomain + domain[i] + ".";
        } else {
            webDomain = webDomain + domain[i];
        }
    }
    return webDomain;
}

function getPtr(webIp) {
    let ptr = webIp.split(".");
    return ptr[3] + "." + ptr[2] + "." + ptr[1] + "." + ptr[0] + ".in-addr.arpa";
}

function isPrivateIp(webIp) {
    let ip = webIp.split(".");
    if (ip[0] == 10) {
        return true;
    } else if (ip[0] == 172 && ip[1] >= 16 && ip[1] <= 32) {
        return true;
    } else if (ip[0] == 192 && ip[1] == 168) {
        return true;
    } else {
        return false;
    }
}

// Get web site IP and FQDN
function dohByWebRequest(browserResponse) {
    function getIpFqdnFromBrowser() {
        webIpFromBrowser = browserResponse.ip;
        //webIpFromBrowser = "172.16.0.0";
        flagPrivateIp = isPrivateIp(webIpFromBrowser);
        webFqdnFromBrowser = getFqdn(browserResponse.url);
        webDomainFromBrowser = getDomain(webFqdnFromBrowser);
        webPtrFromBrowser = getPtr(browserResponse.ip);
    }
    getIpFqdnFromBrowser();

    function getPtrFromDoh(webIp) {
        function setWebPtrFromDoh() {
            webPtrFromDoh = reverseDohClient.response.Answer;
        }
        // https://dns.google.com/resolve?name=1.1.95.168.in-addr.arpa&type=PTR&cd=1
        let urlForReverseDoh = "https://dns.google.com/resolve?name=" + webIp +"&type=PTR";
        var reverseDohClient = new XMLHttpRequest();
        reverseDohClient.open("GET", urlForReverseDoh, true);
        reverseDohClient.responseType = "json";
        reverseDohClient.onload = setWebPtrFromDoh;
        reverseDohClient.send();
    }
    getPtrFromDoh(webPtrFromBrowser);

    console.log("IP from Browser:", webIpFromBrowser);
    //console.log("Is private IP:", flagPrivateIp.toString());
    console.log("FQDN from Browser:", webFqdnFromBrowser);
    console.log("Domain from Browser:", webDomainFromBrowser);
    console.log("PTR from Browser:", webPtrFromBrowser);
    if (webPtrFromDoh) {
        for (let i in webPtrFromDoh) {
            console.log("PTR", i, "from DoH:", webPtrFromDoh[i].data);
        }
    } else {
        console.log("PTR from DoH is null")
    }
 
    if (webPtrFromDoh && webDomainFromBrowser) {
        for (let i in webPtrFromDoh) {
            if (webPtrFromDoh[i].data.search(webFqdnFromBrowser)) {
                resultByReverseDoh = "Green";
            } else {
                resultByReverseDoh = "Red";
            }
        }
    } else {
        console.log("PTR or Domain name not all readly~");
    }
}
browser.webRequest.onResponseStarted.addListener(dohByWebRequest, {urls:["*://*/*"], types:["main_frame"]}, ["responseHeaders"]);



function handleMessage(message) {
    console.log("Web FQDN from the content script: " + message.webFqdnFromWindow);

    function osDnsResolveErr(osDnsResolveErrMsg) {
        console.log("OS DNS resolve error: ", osDnsResolveErrMsg.message);
    }

    function osDnsResolved(osDnsRecord) {
        console.log("Resolved by OS' DNS...");
        console.log("canonicalName: ", osDnsRecord.canonicalName);
        console.log("IP addresses: ", osDnsRecord.addresses);
        console.log("Is TRR?: ", osDnsRecord.isTRR.toString());
        var currentTab;
        var iconColor;

        function validationIP(recordDoH) {
            if (recordDoH.Status == "0") {
                console.log("DoH status: NoError");
                for (let i in recordDoH.Answer) {                    
                    console.log("TTR IP ", i, " is: ", recordDoH.Answer[i].data);
                } // Print all IPs from DoH server
                for (let j in osDnsRecord.addresses) {
                    console.log("OS'DNS IP ", j, " is: ", osDnsRecord.addresses[j]);
                } // Print all IPs from OS DNS server
                console.log("Web IP: ", webIpFromBrowser); // Print IP from browser
                console.log("Web URL: ", webFqdnFromBrowser); // Print URL from browser

                // Need to make a decision: What is the best way(DOM or HTTP) to get FQDN, and redesign code
                // Need to make a decision: Should add-on use OS DNS' IP to compare?
                // If both of FQDNs that received from HTTP & windows are same, compare HTTP'IP & DoH'IP
                if (message.webFqdnFromWindow == webFqdnFromBrowser) {
                    for (i in recordDoH.Answer) {
                        if (recordDoH.Answer[i].data == webIpFromBrowser) {
                            console.log("TRR IP: ", recordDoH.Answer[i].data, " = ", webIpFromBrowser);
                            return true;
                        }
                    }
                    return false;
                } else { // else compare OS DNS IP & DoH'sIP
                    for (i in recordDoH.Answer) {
                        for (j in osDnsRecord.addresses) {
                            if (recordDoH.Answer[i].data == osDnsRecord.addresses[j]) {
                                console.log("TRR IP: ", recordDoH.Answer[i].data, " = ", osDnsRecord.addresses[j]);
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
            console.log("Result by reverse DoH:", resultByReverseDoh);
            console.log("Result by DoH:", iconColor);
            console.log("Is private IP?", flagPrivateIp);
            if (flagPrivateIp) {
                browser.browserAction.setIcon({
                    path: {
                        16: "icons/YellowButton-16.png",
                        32: "icons/YellowButton-32.png"
                    },
                    tabId: currentTab.id
                });
            } else if (iconColor == "green" || resultByReverseDoh == "Green") {
                browser.browserAction.setIcon({
                    path: {
                        16: "icons/GreenButton-16.png",
                        32: "icons/GreenButton-32.png"
                    },
                    tabId: currentTab.id
                });
            } else if (iconColor == "red" || resultByReverseDoh == "Red") {
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

        /* Enable when use cloudflare-dns */
        //var urlDoH = "https://cloudflare-dns.com/dns-query?name=" + message.webFqdnFromWindow + "&type=A&do=false&cd=false";
        var urlDoH = "https://dns.google.com/resolve?name=" + message.webFqdnFromWindow;
        var clientDoH = new XMLHttpRequest();
        clientDoH.open("GET", urlDoH, true);
        /* Enable when use cloudflare-dns */
        // clientDoH.setRequestHeader("accept", "application/dns-json");
        clientDoH.responseType = "json";
        clientDoH.onload = handlerDoH;
        clientDoH.send();
    }
    resolving = browser.dns.resolve(message.webFqdnFromWindow, ["disable_trr", "bypass_cache", "disable_ipv6", "canonical_name"]);
    resolving.then(osDnsResolved, osDnsResolveErr);
}
browser.runtime.onMessage.addListener(handleMessage);