// Web site IP, PTR, FQDN, Domain name from webRequest
var webIpFromBrowser, webPtrFromBrowser, webFqdnFromBrowser, webDomainFromBrowser;
var dohClient, dohClientReverse;
// [3 ~ 5] Web site IP from DNS over HTTPS server, [dohed:false...dohed:true]
var webIpFromDoh, webPtrFromDoh, webCnameFromDoh;
// Resluts
var flagPrivateIp, resultByDoh, resultByReverseDoh;
var currentTab;

function changeIcon() {
    console.log("Is private IP?", flagPrivateIp.toString()); // For Debug
    console.log("Result by DoH:", resultByDoh); // For Debug
    console.log("Result by reverse DoH:", resultByReverseDoh); // For Debug

    if (flagPrivateIp) {
        iconColor = "yellow";
    } else if (resultByDoh == "Red" && resultByReverseDoh == "Red") {
        iconColor = "red";
    } else {
        iconColor = "green";
    }

    if (flagPrivateIp) {
        browser.browserAction.setIcon({
            path: {
                16: "icons/YellowButton-16.png",
                32: "icons/YellowButton-32.png"
            },
            tabId: currentTab.id
        });
    } else if (resultByDoh == "Red" && resultByReverseDoh == "Red") {
        browser.browserAction.setIcon({
            path: {
                16: "icons/RedButton-16.png",
                32: "icons/RedButton-32.png"
            },
            tabId: currentTab.id
        });
    } else {
        browser.browserAction.setIcon({
            path: {
                16: "icons/GreenButton-16.png",
                32: "icons/GreenButton-32.png"
            },
            tabId: currentTab.id
        });
    }
}

function getResult() {
    console.log("IP from Browser:", webIpFromBrowser);
    console.log("Domain name from Browser:", webDomainFromBrowser);
    console.log("IPs from DoH", webIpFromDoh);
    console.log("PTRs from DoH", webPtrFromDoh);
    console.log("CNAMEs from DoH", webCnameFromDoh);

    for (let i in webIpFromDoh) {
        if (resultByDoh == "Green") {
            break;
        } else {
            if (webIpFromDoh[i].ip == webIpFromBrowser) {
                resultByDoh = "Green";
                break;
            } else {
                resultByDoh = "Red";
            }
        }
    }

    // Green if PTR/CNAME contain domain name 
    for (let i in webPtrFromDoh) {
        if (resultByReverseDoh == "Green") {
            break;
        } else {
            if (webPtrFromDoh[i].ptr.search(webDomainFromBrowser) != -1) {
                resultByReverseDoh = "Green";
                break;
            } else {
                resultByReverseDoh = "Red";
            }
        }
    }
    for (let i in webCnameFromDoh) {
        if (resultByReverseDoh == "Green") {
            break;
        } else {
            if (webCnameFromDoh[i].cname.search(webDomainFromBrowser) != -1) {
                resultByReverseDoh = "Green";
                break;
            } else {
                resultByReverseDoh = "Red";
            }
        }
    }
}

function doh() { 
    console.log("Response of DoH", dohClient.response);

    if(dohClient.status == 200 && dohClient.response != null) {
        if (dohClient.response.Status == 0) {
            for (x in dohClient.response.Answer) {
                switch(dohClient.response.Answer[x].type) {
                    case 1:
                        let locationOfwebIpFromDoh = webIpFromDoh.map(function(e) { return e.ip; }).indexOf(dohClient.response.Answer[x].data);
                        if (locationOfwebIpFromDoh == -1)
                            webIpFromDoh.unshift({ip: dohClient.response.Answer[x].data, dohed: false});
                        break;
                    case 5:
                        let locationOfwebCnameFromDoh = webCnameFromDoh.map(function(e) { return e.cname; }).indexOf(dohClient.response.Answer[x].data);
                        if (locationOfwebCnameFromDoh == -1)
                            webCnameFromDoh.unshift({cname: dohClient.response.Answer[x].data, dohed: false});
                        break;
                    default:
                        console.log("DoH answer is: ", dohClient.response.Answer[x]);
                }
            }
        } else {
            console.log("[Error] DoH response status: ", dohClient.response.Status);
        }
    } else {
        console.log("[Error] DoH status: ", dohClient.status);
        console.log("[Error] DoH Response: ", dohClient.response);
    }
}

function dohReverse() { 
    console.log("Response of reverse DoH", dohClientReverse.response);

    if(dohClientReverse.status == 200 && dohClientReverse.response != null) {
        if (dohClientReverse.response.Status == 0) {
            for (x in dohClientReverse.response.Answer) {
                switch(dohClientReverse.response.Answer[x].type) {
                    case 12:
                        let locationOfwebPtrFromDoh = webPtrFromDoh.map(function(e) { return e.ptr; }).indexOf(dohClientReverse.response.Answer[x].data);
                        if (locationOfwebPtrFromDoh == -1)
                            webPtrFromDoh.unshift({ptr: dohClientReverse.response.Answer[x].data, dohed: false});
                        break;
                    default:
                        console.log("Reverse DoH answer is: ", dohClientReverse.response.Answer[x]);
                }
            }
        } else {
            console.log("[Error] Reverse DoH response status: ", dohClientReverse.response.Status);
        }
    } else {
        console.log("[Error] Reverse DoH status: ", dohClientReverse.status);
        console.log("[Error] Reverse DoH Response: ", dohClientReverse.response);
    }
}

function waitForAllDohDone() {
    if (dohClient.readyState == XMLHttpRequest.DONE && dohClientReverse.readyState == XMLHttpRequest.DONE) {
        doh();
        dohReverse();
        getResult();
        changeIcon();
    }
}

// all non dohed is done??
function getWebInfoFromDoh() {
    console.log("Fqdn from Browser:", webFqdnFromBrowser);
    console.log("PTR from Browser:", webPtrFromBrowser);

    /* Enable when use cloudflare-dns */
    //var urlDoH = "https://cloudflare-dns.com/dns-query?name=" + message.webFqdnFromWindow + "&type=A&do=false&cd=false";
    let urlForDoH = "https://dns.google.com/resolve?name=" + webFqdnFromBrowser;
    dohClient = new XMLHttpRequest();
    dohClient.open("GET", urlForDoH, true);
    /* Enable when use cloudflare-dns */
    // dohClient.setRequestHeader("accept", "application/dns-json");
    dohClient.responseType = "json";
    dohClient.onreadystatechange = waitForAllDohDone;
    dohClient.send();

    let urlForReverseDoh = "https://dns.google.com/resolve?name=" + webPtrFromBrowser +"&type=PTR";
    dohClientReverse = new XMLHttpRequest();
    dohClientReverse.open("GET", urlForReverseDoh, true);
    dohClientReverse.responseType = "json";
    dohClientReverse.onload = waitForAllDohDone;
    dohClientReverse.send();
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

function getPtr(webIp) {
    let ptr = webIp.split(".");
    return ptr[3] + "." + ptr[2] + "." + ptr[1] + "." + ptr[0] + ".in-addr.arpa";
}

function getWebInfoFromBrowser(browserResponse) {
    webIpFromBrowser = browserResponse.ip;
    //webIpFromBrowser = "172.16.0.0";
    webPtrFromBrowser = getPtr(browserResponse.ip);
    webFqdnFromBrowser = getFqdn(browserResponse.url);
    webDomainFromBrowser = getDomain(webFqdnFromBrowser);
    flagPrivateIp = isPrivateIp(webIpFromBrowser);
}

function dohByWebRequest(browserResponse) {
    webIpFromDoh = [];
    webPtrFromDoh = [];
    webCnameFromDoh = [];
    resultByDoh = "";
    resultByReverseDoh = "";
    getWebInfoFromBrowser(browserResponse);
    getWebInfoFromDoh();
}

function updateActiveTab() {
    function updateTab(tabs) {
        if (tabs[0])
            currentTab = tabs[0];
    }

    var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
    gettingActiveTab.then(updateTab);
}

browser.tabs.onUpdated.addListener(updateActiveTab); // listen to tab URL changes
browser.tabs.onActivated.addListener(updateActiveTab); // listen to tab switching
browser.windows.onFocusChanged.addListener(updateActiveTab); // listen for window switching
updateActiveTab(); // update when the extension loads initially

browser.webRequest.onResponseStarted.addListener(dohByWebRequest, {urls:["*://*/*"], types:["main_frame"]}, ["responseHeaders"]);